import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { applyEvolution, getState, saveState, todayKey } from "@/lib/app-state";

export const Route = createFileRoute("/_authenticated/progress")({ component: Progress });

function Progress() {
  const [v, setV] = useState(0);
  const s = getState();
  const reviewed = s.reviewedDates.includes(todayKey());
  const [achieved, setAchieved] = useState("");
  const [mistake, setMistake] = useState("");
  const [mental, setMental] = useState(5);
  const [mission, setMission] = useState("");
  const file = () => {
    if (reviewed) return;
    s.reviews.unshift({
      id: crypto.randomUUID(),
      achieved,
      mistake,
      mentalState: mental,
      tomorrowMission: mission,
      date: todayKey(),
    });
    s.reviewedDates.push(todayKey());
    s.power += 1;
    applyEvolution(s);
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
      <h1 className="text-2xl font-bold text-primary">Progress</h1>
      <div className="mt-4 rounded-lg border p-3 space-y-2">
        <textarea
          className="w-full rounded bg-card p-2"
          placeholder="What did you achieve today?"
          value={achieved}
          onChange={(e) => setAchieved(e.target.value)}
        />
        <textarea
          className="w-full rounded bg-card p-2"
          placeholder="Biggest mistake today?"
          value={mistake}
          onChange={(e) => setMistake(e.target.value)}
        />
        <input
          className="w-full"
          type="range"
          min={1}
          max={10}
          value={mental}
          onChange={(e) => setMental(Number(e.target.value))}
        />
        <textarea
          className="w-full rounded bg-card p-2"
          placeholder="Tomorrow's mission"
          value={mission}
          onChange={(e) => setMission(e.target.value)}
        />
        <div className="flex gap-2">
          <button className="flex-1 rounded bg-primary text-primary-foreground py-2" onClick={file}>
            FILE REPORT
          </button>
          <button className="flex-1 rounded border py-2" onClick={skip}>
            SKIP
          </button>
        </div>
      </div>
      <ul className="mt-4 space-y-2">
        {s.reviews.map((r) => (
          <li key={r.id} className="rounded border p-3 text-sm">
            <p className="font-semibold">
              {r.date} • Mental {r.mentalState}/10
            </p>
            <p>{r.achieved}</p>
          </li>
        ))}
      </ul>
    </main>
  );
}
