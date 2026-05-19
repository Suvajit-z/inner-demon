import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { applyEvolution, getState, saveState, todayKey } from "@/lib/app-state";

export const Route = createFileRoute("/_authenticated/progress")({ component: Progress });

function Progress() {
  const [, setV] = useState(0);
  const s = getState();
  const reviewed = s.reviewedDates.includes(todayKey());
  const [achieved, setAchieved] = useState("");
  const [mistake, setMistake] = useState("");
  const [mental, setMental] = useState(5);
  const [mission, setMission] = useState("");
  const [social, setSocial] = useState(0);

  const file = () => {
    if (reviewed) return;
    s.reviews.unshift({
      id: crypto.randomUUID(),
      achieved,
      mistake,
      mentalState: mental,
      tomorrowMission: mission,
      socialHours: social,
      date: todayKey(),
      filed: true,
    });
    s.reviewedDates.push(todayKey());
    s.power += 1;
    if (social >= 2) s.power = Math.max(1, s.power - 1);
    applyEvolution(s);
    saveState(s);
    setV((v) => v + 1);
  };

  const skip = () => {
    if (reviewed) return;
    s.reviews.unshift({
      id: crypto.randomUUID(),
      achieved: "",
      mistake: "",
      mentalState: 5,
      tomorrowMission: "",
      socialHours: 0,
      date: todayKey(),
      filed: false,
    });
    s.reviewedDates.push(todayKey());
    s.power = Math.max(1, s.power - 2);
    saveState(s);
    setV((v) => v + 1);
  };

  return (
    <main className="mx-auto max-w-md p-4">
      <h1 className="text-2xl font-bold text-primary">Progress</h1>
      <p className="mt-1 text-sm text-muted-foreground">POWER: {s.power} / 100</p>
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
        <input
          className="w-full rounded bg-card p-2"
          type="number"
          min={0}
          placeholder="Social media hours"
          value={social}
          onChange={(e) => setSocial(Number(e.target.value || 0))}
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
      <h2 className="mt-5 font-semibold">Evolution History</h2>
      <ul className="mt-2 space-y-2">
        {s.evolutionHistory.map((e) => (
          <li key={e.date + e.to} className="rounded border p-3 text-sm">
            {e.date}: {e.from} → {e.to}
          </li>
        ))}
      </ul>
    </main>
  );
}
