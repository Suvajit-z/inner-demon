
-- profiles
create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email text,
  full_name text,
  google_access_token text,
  google_refresh_token text,
  google_token_expires_at timestamptz,
  calendar_enabled boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.profiles enable row level security;

create policy "profiles_select_own" on public.profiles for select using (auth.uid() = id);
create policy "profiles_update_own" on public.profiles for update using (auth.uid() = id);
create policy "profiles_insert_own" on public.profiles for insert with check (auth.uid() = id);

-- auto-create profile on signup
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into public.profiles (id, email, full_name)
  values (new.id, new.email, coalesce(new.raw_user_meta_data->>'full_name', new.email));
  return new;
end;
$$;

create trigger on_auth_user_created
after insert on auth.users
for each row execute function public.handle_new_user();

-- goals
create table public.goals (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  title text not null,
  source text not null check (source in ('pdf','paste')),
  raw_text text,
  deadline date,
  priority int not null default 3,
  created_at timestamptz not null default now()
);

create index goals_user_idx on public.goals(user_id);
alter table public.goals enable row level security;

create policy "goals_select_own" on public.goals for select using (auth.uid() = user_id);
create policy "goals_insert_own" on public.goals for insert with check (auth.uid() = user_id);
create policy "goals_update_own" on public.goals for update using (auth.uid() = user_id);
create policy "goals_delete_own" on public.goals for delete using (auth.uid() = user_id);

-- subtasks
create table public.subtasks (
  id uuid primary key default gen_random_uuid(),
  goal_id uuid not null references public.goals(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  title text not null,
  estimated_minutes int not null default 30,
  priority int not null default 3,
  completed boolean not null default false,
  completed_at timestamptz,
  created_at timestamptz not null default now()
);

create index subtasks_user_idx on public.subtasks(user_id);
create index subtasks_goal_idx on public.subtasks(goal_id);
alter table public.subtasks enable row level security;

create policy "subtasks_select_own" on public.subtasks for select using (auth.uid() = user_id);
create policy "subtasks_insert_own" on public.subtasks for insert with check (auth.uid() = user_id);
create policy "subtasks_update_own" on public.subtasks for update using (auth.uid() = user_id);
create policy "subtasks_delete_own" on public.subtasks for delete using (auth.uid() = user_id);

-- daily_tasks
create table public.daily_tasks (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  date date not null,
  slot smallint not null check (slot between 1 and 4),
  subtask_id uuid references public.subtasks(id) on delete set null,
  title text not null,
  task_type text not null default 'study',
  estimated_minutes int not null default 30,
  completed boolean not null default false,
  completed_at timestamptz,
  calendar_event_id text,
  created_at timestamptz not null default now(),
  unique(user_id, date, slot)
);

create index daily_tasks_user_date_idx on public.daily_tasks(user_id, date);
alter table public.daily_tasks enable row level security;

create policy "daily_tasks_select_own" on public.daily_tasks for select using (auth.uid() = user_id);
create policy "daily_tasks_insert_own" on public.daily_tasks for insert with check (auth.uid() = user_id);
create policy "daily_tasks_update_own" on public.daily_tasks for update using (auth.uid() = user_id);
create policy "daily_tasks_delete_own" on public.daily_tasks for delete using (auth.uid() = user_id);
