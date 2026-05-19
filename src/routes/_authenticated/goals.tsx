import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { getState, saveState, type GoalType, type Priority } from "@/lib/app-state";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";

export const Route = createFileRoute("/_authenticated/goals")({ component: GoalsPage });

async function extractPdfText(file: File): Promise<string> {
  const pdfjs = await import("pdfjs-dist");
  const workerSrc = (await import("pdfjs-dist/build/pdf.worker.min.mjs?url")).default;
  pdfjs.GlobalWorkerOptions.workerSrc = workerSrc;
  const buf = await file.arrayBuffer();
  const doc = await pdfjs.getDocument({ data: buf }).promise;
  let out = "";
  for (let i = 1; i <= doc.numPages; i += 1) {
    const page = await doc.getPage(i);
    const content = await page.getTextContent();
    out += content.items.map((it) => ("str" in it ? String(it.str) : "")).join(" ") + "\n";
  }
  return out.trim();
}

function inferType(text: string): GoalType {
  const t = text.toLowerCase();
  if (t.includes("workout") || t.includes("gym") || t.includes("run")) return "Workout";
  if (t.includes("study") || t.includes("exam") || t.includes("upsc")) return "Study";
  if (t.includes("skill") || t.includes("learn") || t.includes("build")) return "Skill";
  return "Personal";
}

function importFromText(raw: string) {
  const lines = raw
    .split(/\n|\.|;/)
    .map((l) => l.trim())
    .filter((l) => l.length > 12)
    .slice(0, 12);

  return lines.map((line) => ({
    id: crypto.randomUUID(),
    title: line.slice(0, 64),
    description: line,
    type: inferType(line),
    deadline: "",
    priority: "Medium" as Priority,
    createdAt: new Date().toISOString(),
  }));
}

function GoalsPage() {
  const [refresh, setRefresh] = useState(0);
  const [busy, setBusy] = useState(false);
  const [manualText, setManualText] = useState("");
  const [form, setForm] = useState({
    title: "",
    description: "",
    type: "Study" as GoalType,
    deadline: "",
    priority: "Medium" as Priority,
  });
  const state = getState();

  const isNotionConnected = state.notionConnected;
  const count = useMemo(() => state.goals.length, [state.goals.length]);

  const saveAndRefresh = () => {
    saveState(state);
    setRefresh((v) => v + 1);
  };

  const addManualGoal = () => {
    if (!form.title.trim()) return;
    state.goals.unshift({ ...form, id: crypto.randomUUID(), createdAt: new Date().toISOString() });
    setForm({ title: "", description: "", type: "Study", deadline: "", priority: "Medium" });
    saveAndRefresh();
  };

  const analyzeAndImport = () => {
    if (!manualText.trim()) return;
    const imported = importFromText(manualText);
    state.goals.unshift(...imported);
    setManualText("");
    saveAndRefresh();
  };

  const syncFromNotion = () => {
    if (!isNotionConnected) return;
    const mockText =
      "UPSC History revision\nPractice CSAT quant\nWorkout consistency\nDaily answer writing";
    const imported = importFromText(mockText);
    state.goals.unshift(...imported);
    saveAndRefresh();
  };

  const importPdf = async (file: File) => {
    setBusy(true);
    try {
      const text = await extractPdfText(file);
      const imported = importFromText(text);
      state.goals.unshift(...imported);
      saveAndRefresh();
    } finally {
      setBusy(false);
    }
  };

  return (
    <main className="mx-auto max-w-md p-4">
      <h1 className="text-2xl font-bold text-primary">Goals</h1>
      <p className="mt-1 text-sm text-muted-foreground">
        Import from Notion, PDF, or manual text. Total: {count}
      </p>

      <section className="mt-4 space-y-2 rounded-lg border p-3">
        <Button className="w-full" disabled={!isNotionConnected} onClick={syncFromNotion}>
          {isNotionConnected ? "Sync from Notion" : "Connect Notion in Profile first"}
        </Button>
      </section>

      <section className="mt-3 space-y-2 rounded-lg border p-3">
        <label className="text-sm font-medium">Upload PDF</label>
        <Input
          type="file"
          accept="application/pdf"
          disabled={busy}
          onChange={(e) => {
            const f = e.target.files?.[0];
            if (f) importPdf(f);
            e.currentTarget.value = "";
          }}
        />
      </section>

      <section className="mt-3 space-y-2 rounded-lg border p-3">
        <Textarea
          placeholder="Paste your goals, routines, or study plans here..."
          value={manualText}
          onChange={(e) => setManualText(e.target.value)}
          rows={5}
        />
        <Button className="w-full" onClick={analyzeAndImport}>
          Analyze & Import
        </Button>
      </section>

      <section className="space-y-2 mt-4">
        <Input
          placeholder="Title"
          value={form.title}
          onChange={(e) => setForm({ ...form, title: e.target.value })}
        />
        <Textarea
          placeholder="Description"
          value={form.description}
          onChange={(e) => setForm({ ...form, description: e.target.value })}
        />
        <select
          className="w-full rounded-md bg-card p-2"
          value={form.type}
          onChange={(e) => setForm({ ...form, type: e.target.value as GoalType })}
        >
          <option>Study</option>
          <option>Workout</option>
          <option>Skill</option>
          <option>Personal</option>
        </select>
        <Input
          type="date"
          value={form.deadline}
          onChange={(e) => setForm({ ...form, deadline: e.target.value })}
        />
        <select
          className="w-full rounded-md bg-card p-2"
          value={form.priority}
          onChange={(e) => setForm({ ...form, priority: e.target.value as Priority })}
        >
          <option>Low</option>
          <option>Medium</option>
          <option>High</option>
        </select>
        <Button className="w-full" onClick={addManualGoal}>
          Add Goal
        </Button>
      </section>

      <ul className="mt-6 space-y-2">
        {state.goals.map((g) => (
          <li key={g.id} className="rounded-lg border border-border p-3">
            <p className="font-semibold">{g.title}</p>
            <p className="text-sm text-muted-foreground">{g.description}</p>
            <p className="text-xs mt-1">
              {g.type} • {g.priority} • {g.deadline || "No deadline"}
            </p>
          </li>
        ))}
      </ul>
    </main>
  );
}
