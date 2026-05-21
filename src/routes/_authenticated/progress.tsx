import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { getState, saveState, todayKey } from "@/lib/app-state";

export const Route = createFileRoute("/_authenticated/progress")({ component: Progress });

function Progress() {
  const [v, setV] = useState(0);
  const s = getState();
  const reviewed = s.reviewedDates.includes(todayKey());
  const [tasksCompleted, setTasksCompleted] = useState(0);
  const [wentWell, setWentWell] = useState("");
  const [wentWrong, setWentWrong] = useState("");
  const [tomorrowFocus, setTomorrowFocus] = useState("");
  const file = () => {
    if (reviewed) return;
    const powerGained = Math.max(0, Math.min(5, tasksCompleted));
    s.reviews.unshift({
      id: crypto.randomUUID(),
      tasksCompleted,
      wentWell,
      wentWrong,
      tomorrowFocus,
      powerGained,
      date: todayKey(),
    });
    s.reviewedDates.push(todayKey());
    s.power += powerGained;
    saveState(s);
    setV(v + 1);
  };
  const skip = () => {
    if (reviewed) return;
    s.reviewedDates.push(todayKey());
    s.power = Math.max(0, s.power - 1);
    saveState(s);
    setV(v + 1);
  };
  return (
    <main className="mx-auto max-w-md p-4">
      <h1 className="text-2xl font-bold text-primary">Night Review</h1>
      <div className="mt-4 rounded-lg border p-3 space-y-2">
        <input
          className="w-full rounded bg-card p-2"
          min={0}
          max={5}
          type="number"
          placeholder="Tasks completed (0-5)"
          value={tasksCompleted}
          onChange={(e) => setTasksCompleted(Number(e.target.value))}
        />
        <textarea
          className="w-full rounded bg-card p-2"
          placeholder="What went well today?"
          value={wentWell}
          onChange={(e) => setWentWell(e.target.value)}
        />
        <textarea
          className="w-full rounded bg-card p-2"
          placeholder="What went wrong today?"
          value={wentWrong}
          onChange={(e) => setWentWrong(e.target.value)}
        />
        <textarea
          className="w-full rounded bg-card p-2"
          placeholder="Tomorrow's main focus"
          value={tomorrowFocus}
          onChange={(e) => setTomorrowFocus(e.target.value)}
        />
        <div className="flex gap-2">
          <button className="flex-1 rounded bg-primary text-primary-foreground py-2" onClick={file}>
            SUBMIT REVIEW
          </button>
          <button className="flex-1 rounded border py-2" onClick={skip}>
            MISS REVIEW (-1 POWER)
          </button>
        </div>
      </div>
      <ul className="mt-4 space-y-2">
        {s.reviews.map((r) => (
          <li key={r.id} className="rounded border p-3 text-sm">
            <p className="font-semibold">{r.date}</p>
            <p>
              Tasks: {r.tasksCompleted}/5 • Power: +{r.powerGained}
            </p>
          </li>
        ))}
      </ul>
    </main>
  );
}
