## Problem

Login works, but navigating to `/dashboard`, `/goals`, or `/profile` lands you back on `/login` or shows a blank page. Runtime error:

```
Failed to fetch dynamically imported module: …/virtual:tanstack-start-client-entry
```

Two issues mixed together:

1. **Vite dev chunk reload failure.** When the dev server restarts (logs show `[vite] server connection lost. Polling for restart...`), the cached page tries to load route chunks by their old hashed URLs. The fetch fails, the route never mounts, and the user is stranded.

2. **Auth race in `_authenticated` guard.** `beforeLoad` calls `supabase.auth.getSession()` synchronously, but right after `signInWithPassword` the in-memory session can lag the localStorage write for a tick. The guard sees `null` and redirects back to `/login`, producing the exact bounce visible in the session replay (success toast → back on `/login` 7s later).

A third smaller issue: the `handle_new_user` SQL function exists but no trigger is attached, so new signups never get a `profiles` row (not blocking auth, but blocking everything that joins `profiles`).

## Fix

### 1. Auto-recover from stale chunk errors (root cause of the runtime error)

In `src/routes/__root.tsx`, add a global listener for unhandled chunk-load failures and hard-reload the page once (guarded so we don't loop):

```ts
useEffect(() => {
  const onRejection = (e: PromiseRejectionEvent) => {
    const msg = String(e.reason?.message ?? e.reason ?? "");
    if (
      msg.includes("Failed to fetch dynamically imported module") ||
      msg.includes("Importing a module script failed")
    ) {
      if (!sessionStorage.getItem("__chunk_reloaded")) {
        sessionStorage.setItem("__chunk_reloaded", "1");
        window.location.reload();
      }
    } else {
      sessionStorage.removeItem("__chunk_reloaded");
    }
  };
  window.addEventListener("unhandledrejection", onRejection);
  return () => window.removeEventListener("unhandledrejection", onRejection);
}, []);
```

### 2. Stop the post-login bounce

In `src/routes/login.tsx`, after `signInWithPassword` succeeds, await `supabase.auth.getSession()` once before navigating, then use `window.location.assign("/dashboard")` instead of router `navigate()` for the first hop. This guarantees the next page load reads a fresh, persisted session and avoids the stale router context.

```ts
const { error } = await supabase.auth.signInWithPassword({ email, password });
if (error) {
  toast.error(error.message);
  return;
}
await supabase.auth.getSession(); // ensures session is committed
toast.success("Welcome back.");
window.location.assign("/dashboard");
```

Apply the same pattern in `src/routes/signup.tsx`.

Also tighten `src/routes/_authenticated.tsx` so the guard waits for the session rather than racing it — call `getSession()`, and if it returns null, try once more after a microtask before redirecting. (Belt-and-braces; the navigation change above is the primary fix.)

### 3. Attach the missing profile trigger

Add a migration so `handle_new_user` actually fires on `auth.users` insert:

```sql
drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();
```

### 4. Verify

- Sign in → should land on `/dashboard` without bouncing.
- Tap **Goals** and **Profile** in bottom nav → both should mount.
- Trigger a dev-server restart and refresh → page should auto-reload once instead of staying stuck.

## Out of scope

- Notifications / Google Calendar wiring (deferred to v2).
- Email confirmation flow changes (already working; user confirmed via email link).
