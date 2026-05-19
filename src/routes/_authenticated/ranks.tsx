import { createFileRoute } from "@tanstack/react-router";
import { getForm, getState } from "@/lib/app-state";

export const Route = createFileRoute("/_authenticated/ranks")({ component: Ranks });

function Ranks() {
  const s = getState();
  return (
    <main className="mx-auto max-w-md p-4">
      <h1 className="text-2xl font-bold text-primary">🏆 GLOBAL BATTLEFIELD</h1>
      <div className="mt-4 rounded-lg border p-4">
        <p className="text-sm text-muted-foreground">Your Rank</p>
        <p className="text-lg font-semibold">#{Math.max(1, 999 - s.demonIndex * 100 - s.power)}</p>
        <p className="text-sm">
          {getForm(s.demonIndex)} • POWER: {s.power} / 100
        </p>
      </div>
    </main>
  );
}
