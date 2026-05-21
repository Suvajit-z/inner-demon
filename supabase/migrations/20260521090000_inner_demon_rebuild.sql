create table if not exists public.users (
  id uuid primary key default gen_random_uuid(),
  email text unique not null,
  username text,
  pin_hash text,
  is_admin boolean default false,
  created_at timestamp default now()
);

create table if not exists public.subscriptions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references public.users(id),
  plan_type text,
  amount numeric,
  currency text,
  status text,
  trial_start_date date,
  trial_end_date date,
  next_billing_date date,
  razorpay_subscription_id text,
  created_at timestamp default now()
);

create table if not exists public.power_levels (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references public.users(id),
  current_power integer default 1,
  current_form integer default 1,
  streak_days integer default 0,
  maintenance_day integer default 0,
  updated_at timestamp default now()
);

create table if not exists public.daily_tasks (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references public.users(id),
  task_title text,
  task_type text,
  is_complete boolean,
  task_date date,
  created_at timestamp default now()
);

create table if not exists public.night_reports (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references public.users(id),
  report_date date,
  day_log text,
  tasks_percent integer,
  biggest_win text,
  biggest_failure text,
  mental_state integer,
  main_mission_tomorrow text,
  phone_hours numeric,
  created_at timestamp default now()
);

create table if not exists public.payments (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references public.users(id),
  payment_id text,
  amount numeric,
  currency text,
  status text,
  created_at timestamp default now()
);
