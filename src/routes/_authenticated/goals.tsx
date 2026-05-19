import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { getState, saveState, type GoalType, type Priority } from "@/lib/app-state";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";

export const Route = createFileRoute("/_authenticated/goals")({ component: GoalsPage });

function GoalsPage() {
  const [refresh, setRefresh] = useState(0);
  const [form, setForm] = useState({
    title: "",
    description: "",
    type: "Study" as GoalType,
    deadline: "",
    priority: "Medium" as Priority,
  });
  const state = getState();
  const add = () => {
    if (!form.title.trim()) return;
    state.goals.unshift({ ...form, id: crypto.randomUUID(), createdAt: new Date().toISOString() });
    setForm({ title: "", description: "", type: "Study", deadline: "", priority: "Medium" });
    setRefresh((v) => v + 1);
  };
  return (
    <main className="mx-auto max-w-md p-4">
      <h1 className="text-2xl font-bold text-primary">Goals</h1>
      <div className="space-y-2 mt-4">
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
        <Button className="w-full" onClick={add}>
          Add Goal
        </Button>
      </div>
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
