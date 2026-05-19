import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import {
  applyEvolution,
  ensureTodayTasks,
  getForm,
  getState,
  saveState,
  todayKey,
} from "@/lib/app-state";

export const Route = createFileRoute("/_authenticated/dashboard")({ component: Page });

function Page() {
  const [, setV] = useState(0);
  const state = ensureTodayTasks(getState());
  const tasks = state.tasksByDate[todayKey()] || [];
  saveState(state);
  const done = tasks.filter((t) => t.completed).length;
  const toggle = (id: string) => {
    const t = tasks.find((x) => x.id === id);
    if (!t) return;
    t.completed = !t.completed;
    const c = tasks.filter((x) => x.completed).length;
    if (c === 4) state.power += 4;
    else if (c === 3) state.power += 2;
    else if (c === 2) state.power += 1;
    applyEvolution(state);
    saveState(state);
    setV((x) => x + 1);
  };
  return (
    <main className="mx-auto max-w-md p-4">
      <section className="rounded-xl border border-primary/40 bg-card p-4">
        <p className="text-sm">{state.name}</p>
        <h1 className="text-xl font-bold text-primary">{getForm(state.demonIndex)}</h1>
        <p className="mt-1 font-semibold">POWER: {Math.max(0, Math.min(100, state.power))} / 100</p>
        <div className="mt-2 h-2 rounded bg-muted">
          <div className="h-2 rounded bg-primary" style={{ width: `${state.power}%` }} />
        </div>
        <p className="mt-2 text-sm text-muted-foreground">Daily Summary: {done}/4 tasks complete</p>
      </section>
      <h2 className="mt-5 mb-2 font-semibold">Today&apos;s 4 Tasks</h2>
      <ul className="space-y-2">
        {tasks.map((t) => (
          <li key={t.id} className="rounded-lg border border-border p-3">
            <label className="flex gap-3">
              <input type="checkbox" checked={t.completed} onChange={() => toggle(t.id)} />
              <span>{t.title}</span>
            </label>
          </li>
        ))}
      </ul>
    </main>
  );
}
