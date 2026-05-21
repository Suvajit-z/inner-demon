import { createFileRoute } from "@tanstack/react-router";
import { getState } from "@/lib/app-state";

export const Route = createFileRoute("/_authenticated/profile")({ component: Profile });

function Profile() {
  const s = getState();
  return (
    <main className="mx-auto max-w-md p-4">
      <h1 className="text-2xl font-bold text-primary">Past Reviews</h1>
      <ul className="mt-4 space-y-2">
        {s.reviews.map((r) => (
          <li key={r.id} className="rounded border p-3 text-sm">
            {r.date} | {r.tasksCompleted}/5 tasks | +{r.powerGained} power
          </li>
        ))}
      </ul>
      <p className="mt-4 font-semibold">Total Power: {s.power}</p>
    </main>
  );
}
