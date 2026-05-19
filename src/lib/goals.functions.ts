import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { generateText } from "ai";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { createLovableAiGatewayProvider } from "./ai-gateway";

const ImportInput = z.object({
  text: z.string().min(20).max(50_000),
  source: z.enum(["pdf", "paste"]),
});

type ExtractedGoal = {
  title: string;
  deadline: string;
  priority: number;
  subtasks: Array<{ title: string; estimated_minutes: number; priority: number }>;
};

const TASK_TYPES = ["study", "workout", "read", "practice", "review", "build", "other"] as const;

function clampNumber(value: unknown, min: number, max: number, fallback: number) {
  const n = typeof value === "number" ? value : Number(value);
  return Number.isFinite(n) ? Math.max(min, Math.min(max, Math.round(n))) : fallback;
}

function cleanTitle(value: unknown, fallback: string) {
  const title = String(value ?? "").replace(/^[-*•\d.)\s]+/, "").trim();
  return title.length >= 3 ? title.slice(0, 200) : fallback;
}

function extractJsonFromResponse(response: string): unknown {
  let cleaned = response.replace(/```json\s*/gi, "").replace(/```/g, "").trim();
  const start = cleaned.search(/[\[{]/);
  const end = Math.max(cleaned.lastIndexOf("}"), cleaned.lastIndexOf("]"));
  if (start === -1 || end === -1 || end <= start) throw new Error("No JSON found in AI response");
  cleaned = cleaned.slice(start, end + 1);

  try {
    return JSON.parse(cleaned);
  } catch {
    return JSON.parse(
      cleaned
        .replace(/,\s*}/g, "}")
        .replace(/,\s*]/g, "]")
        .replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, ""),
    );
  }
}

function fallbackGoalsFromText(text: string): ExtractedGoal[] {
  const lines = text
    .split(/\n|\r|;/)
    .map((line) => cleanTitle(line, ""))
    .filter((line) => line.length >= 8 && line.length <= 180)
    .slice(0, 5);
  const titles = lines.length ? lines : [cleanTitle(text.split(/[.!?]/)[0], "Build a focused personal goal")];

  return titles.map((title) => ({
    title,
    deadline: "",
    priority: 3,
    subtasks: [
      `Clarify the next outcome for ${title}`,
      `Break ${title} into weekly milestones`,
      `Schedule the first focused work block`,
      `Review progress and adjust the plan`,
    ].map((task, index) => ({ title: task.slice(0, 200), estimated_minutes: index === 1 ? 45 : 30, priority: index + 1 })),
  }));
}

function normalizeExtractedGoals(raw: unknown, sourceText: string): ExtractedGoal[] {
  const rawGoals = Array.isArray((raw as any)?.goals) ? (raw as any).goals : Array.isArray(raw) ? raw : [];
  const goals = rawGoals.slice(0, 15).map((goal: any, goalIndex: number) => {
    const title = cleanTitle(goal?.title, `Goal ${goalIndex + 1}`);
    const rawSubtasks = Array.isArray(goal?.subtasks) ? goal.subtasks : [];
    const subtasks = rawSubtasks.slice(0, 20).map((subtask: any, subtaskIndex: number) => ({
      title: cleanTitle(subtask?.title, `Work on ${title}`),
      estimated_minutes: clampNumber(subtask?.estimated_minutes, 10, 240, 30),
      priority: clampNumber(subtask?.priority, 1, 5, Math.min(5, subtaskIndex + 1)),
    }));

    return {
      title,
      deadline: typeof goal?.deadline === "string" ? goal.deadline : "",
      priority: clampNumber(goal?.priority, 1, 5, 3),
      subtasks: subtasks.length ? subtasks : fallbackGoalsFromText(title)[0].subtasks,
    };
  });

  return goals.length ? goals : fallbackGoalsFromText(sourceText);
}

export const importGoalsFromText = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => ImportInput.parse(d))
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;
    const key = process.env.LOVABLE_API_KEY;
    if (!key) throw new Error("AI gateway not configured");

    const gateway = createLovableAiGatewayProvider(key);
    const model = gateway("google/gemini-3-flash-preview");

    const { object } = await generateObject({
      model,
      schema: ExtractionSchema,
      system:
        "You analyze goal documents, study plans, and routines. Extract distinct top-level goals. " +
        "For each goal, break it into 3–15 concrete, actionable sub-tasks the person can execute. " +
        "Estimate minutes realistically. Priority: 1=urgent/critical, 5=nice-to-have. " +
        "If a deadline is mentioned, parse it to YYYY-MM-DD; otherwise null.",
      prompt: `Today is ${new Date().toISOString().slice(0, 10)}.\n\nSource text:\n${data.text}`,
    });

    // Insert goals + subtasks
    let totalSubtasks = 0;
    for (const g of object.goals) {
      const { data: goalRow, error: goalErr } = await supabase
        .from("goals")
        .insert({
          user_id: userId,
          title: g.title,
          source: data.source,
          raw_text: data.text.slice(0, 4000),
          deadline: g.deadline && g.deadline.length >= 8 ? g.deadline : null,
          priority: Math.max(1, Math.min(5, Math.round(g.priority))),
        })
        .select("id")
        .single();
      if (goalErr || !goalRow) throw new Error(goalErr?.message ?? "Failed to save goal");

      const rows = g.subtasks.map((s) => ({
        goal_id: goalRow.id,
        user_id: userId,
        title: s.title,
        estimated_minutes: Math.max(10, Math.min(240, Math.round(s.estimated_minutes))),
        priority: Math.max(1, Math.min(5, Math.round(s.priority))),
      }));
      const { error: subErr } = await supabase.from("subtasks").insert(rows);
      if (subErr) throw new Error(subErr.message);
      totalSubtasks += rows.length;
    }

    return { goalsImported: object.goals.length, subtasksImported: totalSubtasks };
  });

// ---------------- Daily task generation ----------------

const SelectInput = z.object({ date: z.string().optional() });

const SelectionSchema = z.object({
  picks: z.array(z.object({
    subtask_id: z.string().uuid(),
    title: z.string(),
    task_type: z.enum(["study", "workout", "read", "practice", "review", "build", "other"]),
    estimated_minutes: z.number().int().min(10).max(240),
  })).length(4),
});

export const getOrGenerateDailyTasks = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => SelectInput.parse(d ?? {}))
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;
    const date = data.date ?? new Date().toISOString().slice(0, 10);

    const { data: existing } = await supabase
      .from("daily_tasks")
      .select("*")
      .eq("user_id", userId)
      .eq("date", date)
      .order("slot");
    if (existing && existing.length >= 4) return { date, tasks: existing };

    // Pool of open subtasks with goal context
    const { data: pool } = await supabase
      .from("subtasks")
      .select("id, title, estimated_minutes, priority, completed, goal_id, goals!inner(title, deadline, priority)")
      .eq("user_id", userId)
      .eq("completed", false)
      .limit(80);

    if (!pool || pool.length === 0) {
      return { date, tasks: [], message: "No goals yet. Import goals to generate missions." };
    }

    const poolSummary = pool.map((s: any) => ({
      id: s.id,
      title: s.title,
      minutes: s.estimated_minutes,
      task_priority: s.priority,
      goal: s.goals?.title,
      goal_deadline: s.goals?.deadline,
      goal_priority: s.goals?.priority,
    }));

    const key = process.env.LOVABLE_API_KEY;
    if (!key) throw new Error("AI gateway not configured");
    const gateway = createLovableAiGatewayProvider(key);
    const model = gateway("google/gemini-3-flash-preview");

    const { object } = await generateObject({
      model,
      schema: SelectionSchema,
      system:
        "You pick exactly 4 daily missions from the user's open sub-task pool. " +
        "Weight by: (1) closest goal deadline first, (2) higher goal priority, (3) higher task priority, " +
        "(4) variety across goals. Total minutes should fit a day (aim 2–4 hours). " +
        "Use the provided subtask_id verbatim. Pick task_type that best matches the title.",
      prompt: `Today: ${date}\n\nOpen subtask pool:\n${JSON.stringify(poolSummary, null, 2)}`,
    });

    const rows = object.picks.map((p, i) => ({
      user_id: userId,
      date,
      slot: i + 1,
      subtask_id: p.subtask_id,
      title: p.title,
      task_type: p.task_type,
      estimated_minutes: p.estimated_minutes,
    }));

    // Wipe partial existing, insert fresh
    await supabase.from("daily_tasks").delete().eq("user_id", userId).eq("date", date);
    const { data: inserted, error } = await supabase
      .from("daily_tasks")
      .insert(rows)
      .select("*")
      .order("slot");
    if (error) throw new Error(error.message);
    return { date, tasks: inserted ?? [] };
  });

const ToggleInput = z.object({ id: z.string().uuid(), completed: z.boolean() });

export const toggleTaskComplete = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => ToggleInput.parse(d))
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;
    const { data: row, error } = await supabase
      .from("daily_tasks")
      .update({
        completed: data.completed,
        completed_at: data.completed ? new Date().toISOString() : null,
      })
      .eq("id", data.id)
      .eq("user_id", userId)
      .select("subtask_id")
      .single();
    if (error) throw new Error(error.message);

    // Propagate to subtask
    if (row?.subtask_id) {
      await supabase
        .from("subtasks")
        .update({
          completed: data.completed,
          completed_at: data.completed ? new Date().toISOString() : null,
        })
        .eq("id", row.subtask_id)
        .eq("user_id", userId);
    }
    return { ok: true };
  });

export const listGoals = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { supabase, userId } = context;
    const { data, error } = await supabase
      .from("goals")
      .select("id, title, source, deadline, priority, created_at, subtasks(id, completed)")
      .eq("user_id", userId)
      .order("created_at", { ascending: false });
    if (error) throw new Error(error.message);
    return (data ?? []).map((g: any) => ({
      id: g.id,
      title: g.title,
      source: g.source,
      deadline: g.deadline,
      priority: g.priority,
      created_at: g.created_at,
      subtask_total: g.subtasks?.length ?? 0,
      subtask_done: (g.subtasks ?? []).filter((s: any) => s.completed).length,
    }));
  });

const DeleteGoalInput = z.object({ id: z.string().uuid() });

export const deleteGoal = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => DeleteGoalInput.parse(d))
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;
    const { error } = await supabase.from("goals").delete().eq("id", data.id).eq("user_id", userId);
    if (error) throw new Error(error.message);
    return { ok: true };
  });
