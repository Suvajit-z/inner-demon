
# Inner Demon — v1 Build Plan

Focused on the core value prop: scan goals → AI generates 4 daily tasks → dark/gold mobile-first dashboard. Reminders delivered via Google Calendar events (per your choice).

## What's in v1

1. Auth (email + password; PIN, OTP, splash deferred to v2)
2. Goals input: PDF upload + manual paste
3. AI goal analysis + automatic 4 daily tasks (Lovable AI, Gemini)
4. Dashboard with today's 4 missions + check-off
5. Google Calendar integration: 6 AM "missions" event, 9:30 PM "night review" event
6. Dark + gold mobile-first UI, bottom nav (Home / Goals / Profile)

## What's deferred to v2 (called out so it's explicit)

- Splash, OTP email verification, 6-digit PIN, forgot-PIN flow
- Power 1–100 system, demon evolution, ranks, streaks
- Night-review popup form + submission flow
- Progress page, Ranks page
- Notion integration
- Master admin / paid tiers

## User flow (v1)

1. Sign up / log in (email + password via Lovable Cloud).
2. Goals page: upload one or more PDFs and/or paste raw text. Click **Analyze & Import**.
3. AI extracts structured goals (title, deadline, priority, sub-tasks) → saved to DB.
4. Dashboard shows today's 4 AI-generated missions. If none exist for today, a server function generates them on first visit (and a daily scheduled job regenerates at 6 AM).
5. User checks off tasks; completion is stored.
6. If Google Calendar is connected, the same 4 tasks are pushed as a 6 AM event, and a 9:30 PM "Night Review" event is created — both serve as the daily reminders.

## Architecture

- **Stack**: TanStack Start (existing) + Lovable Cloud (Supabase) + Lovable AI Gateway.
- **Routes** (file-based):
  - `/` — landing / redirect to dashboard if logged in
  - `/login`, `/signup`
  - `/_authenticated/dashboard` — today's 4 missions
  - `/_authenticated/goals` — upload/paste + list of parsed goals
  - `/_authenticated/profile` — connect Google Calendar, log out
- **Server functions** (`src/lib/*.functions.ts`):
  - `importGoalsFromText` — takes raw text (also used after PDF parse), calls AI with structured output (Zod) → inserts goals + sub-tasks
  - `getOrGenerateDailyTasks` — returns today's 4 tasks; if missing, calls AI to pick 4 from open sub-tasks weighted by deadline/priority/past completion
  - `toggleTaskComplete`
  - `pushTasksToCalendar` — creates 6 AM event with task list and 9:30 PM night-review event
- **Server route**:
  - `/api/public/cron/daily-generate` — hit by Supabase pg_cron at 06:00 user-local (v1: a single UTC time, configurable later) to pre-generate tasks + push calendar events for all opted-in users
- **PDF parsing**: client-side with `pdfjs-dist` (extract text in browser), then send text to `importGoalsFromText`. Avoids Node-only deps on the Worker.
- **AI**: `@ai-sdk/openai-compatible` + `ai` via Lovable AI Gateway, model `google/gemini-3-flash-preview`, using `Output.object({ schema: z... })` for structured goal/task extraction.
- **Google Calendar**: per-user OAuth (not the developer-account connector). User clicks "Connect Google Calendar" → standard Google OAuth → tokens stored on profile row. `pushTasksToCalendar` uses stored access token (refresh as needed).

## Database (Lovable Cloud / Supabase)

- `profiles(id uuid pk = auth.users.id, email, full_name, google_access_token, google_refresh_token, google_token_expires_at, calendar_enabled bool)`
- `goals(id, user_id, title, source 'pdf'|'paste', raw_text, deadline date null, priority int, created_at)`
- `subtasks(id, goal_id, user_id, title, estimated_minutes, priority int, depends_on uuid null, completed bool, completed_at)`
- `daily_tasks(id, user_id, date, slot smallint(1..4), subtask_id, title, task_type, estimated_minutes, completed bool, completed_at, calendar_event_id text null)`
  - unique(user_id, date, slot)
- RLS on every table: `auth.uid() = user_id` for select/insert/update/delete.

## UI / design

- Dark theme tokens in `src/styles.css` using `oklch`:
  - `--background` ≈ `#0A0A0A`, `--foreground` near white
  - `--primary` = gold `#C9A84C`, `--primary-foreground` = near-black
- Mobile-first layout, sticky bottom nav (3 items in v1: Home, Goals, Profile).
- Dashboard card: form name placeholder ("Awakening Shade" static in v1 since Power is deferred), date, 4 mission checkboxes.
- Goals page: file dropzone + textarea + "Analyze & Import" button + list of parsed goals with sub-task counts.

## Open assumptions (flag if wrong)

- v1 schedules the 6 AM job at a single UTC time; per-user timezones come in v2.
- v1 uses email+password only; PIN/OTP added in v2 alongside Power system.
- Calendar reminders are the only reminder channel in v1 (push/email later).

## Build order

1. Enable Lovable Cloud, create tables + RLS, scaffold auth (email/password) + `_authenticated` layout.
2. Theme tokens (dark + gold) + bottom nav shell.
3. Goals page: PDF (pdfjs) + paste → `importGoalsFromText` server fn with AI structured output.
4. Dashboard + `getOrGenerateDailyTasks` + toggle complete.
5. Google OAuth connect on Profile + `pushTasksToCalendar`.
6. `/api/public/cron/daily-generate` route + pg_cron schedule.
