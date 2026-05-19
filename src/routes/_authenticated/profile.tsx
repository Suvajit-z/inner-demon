import { createFileRoute } from "@tanstack/react-router";
import { getState, saveState } from "@/lib/app-state";

export const Route = createFileRoute("/_authenticated/profile")({ component: Profile });

function Profile() {
  const s = getState();
  return (
    <main className="mx-auto max-w-md p-4">
      <h1 className="text-2xl font-bold text-primary">Profile</h1>
      <p className="mt-1 text-sm text-muted-foreground">POWER: {s.power} / 100</p>
      <label className="mt-4 block text-sm">User name</label>
      <input
        className="w-full rounded-md bg-card p-3 mt-2"
        defaultValue={s.name}
        onBlur={(e) => {
          s.name = e.target.value || "Warrior";
          saveState(s);
        }}
      />
      <div className="mt-4 grid gap-2">
        <button
          className="rounded border p-3"
          onClick={() => {
            s.notionConnected = !s.notionConnected;
            saveState(s);
            location.reload();
          }}
        >
          {s.notionConnected ? "Disconnect Notion" : "Connect Notion"}
        </button>
        <button
          className="rounded border p-3"
          onClick={() => {
            s.calendarConnected = !s.calendarConnected;
            saveState(s);
            location.reload();
          }}
        >
          {s.calendarConnected ? "Disconnect Google Calendar" : "Connect Google Calendar"}
        </button>
      </div>
    </main>
  );
}
