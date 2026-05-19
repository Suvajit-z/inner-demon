import { useCallback, useEffect, useState } from "react";

const STORAGE_KEY = "inner-demon-reminders-enabled";

const REMINDERS = [
  { hour: 6, minute: 0, title: "🔥 Inner Demon — Morning Mission", body: "Today's 4 tasks are waiting. Time to execute." },
  { hour: 21, minute: 30, title: "🌙 Inner Demon — Night Review", body: "Reflect on today. What got done? What's left?" },
];

function msUntilNext(hour: number, minute: number) {
  const now = new Date();
  const next = new Date();
  next.setHours(hour, minute, 0, 0);
  if (next.getTime() <= now.getTime()) next.setDate(next.getDate() + 1);
  return next.getTime() - now.getTime();
}

export function useReminders() {
  const [enabled, setEnabled] = useState(false);
  const [permission, setPermission] = useState<NotificationPermission>("default");

  useEffect(() => {
    if (typeof window === "undefined" || !("Notification" in window)) return;
    setPermission(Notification.permission);
    setEnabled(localStorage.getItem(STORAGE_KEY) === "1");
  }, []);

  useEffect(() => {
    if (!enabled || permission !== "granted") return;
    const timers: ReturnType<typeof setTimeout>[] = [];

    const schedule = (hour: number, minute: number, title: string, body: string) => {
      const fire = () => {
        try {
          new Notification(title, { body, icon: "/favicon.ico", tag: `id-${hour}-${minute}` });
        } catch {
          /* ignore */
        }
        timers.push(setTimeout(fire, 24 * 60 * 60 * 1000));
      };
      timers.push(setTimeout(fire, msUntilNext(hour, minute)));
    };

    REMINDERS.forEach((r) => schedule(r.hour, r.minute, r.title, r.body));
    return () => timers.forEach(clearTimeout);
  }, [enabled, permission]);

  const enable = useCallback(async () => {
    if (typeof window === "undefined" || !("Notification" in window)) {
      return { ok: false, reason: "Notifications not supported in this browser." };
    }
    let perm = Notification.permission;
    if (perm === "default") perm = await Notification.requestPermission();
    setPermission(perm);
    if (perm !== "granted") return { ok: false, reason: "Permission denied. Enable notifications in browser settings." };
    localStorage.setItem(STORAGE_KEY, "1");
    setEnabled(true);
    try {
      new Notification("✅ Reminders enabled", { body: "You'll be pinged at 6:00 AM and 9:30 PM daily (while this tab is open)." });
    } catch {
      /* ignore */
    }
    return { ok: true };
  }, []);

  const disable = useCallback(() => {
    localStorage.removeItem(STORAGE_KEY);
    setEnabled(false);
  }, []);

  return { enabled, permission, enable, disable };
}
