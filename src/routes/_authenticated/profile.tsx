import { createFileRoute } from "@tanstack/react-router";
import { getState, saveState } from "@/lib/app-state";

export const Route = createFileRoute("/_authenticated/profile")({ component: Profile });

function Profile() {
  const s = getState();
  return (
    <main className="mx-auto max-w-md p-4">
      <h1 className="text-2xl font-bold text-primary">Profile</h1>
      <label className="mt-4 block text-sm">User name</label>
      <input
        className="w-full rounded-md bg-card p-3 mt-2"
        defaultValue={s.name}
        onBlur={(e) => {
          s.name = e.target.value || "Warrior";
          saveState(s);
        }}
      />
    </main>
  );
}
