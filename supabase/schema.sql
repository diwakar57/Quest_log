-- Quest Log schema: tables + Row Level Security policies
-- Paste this whole file into the Supabase SQL editor and run it.

create extension if not exists pgcrypto;

-- 1. users -------------------------------------------------------------
create table if not exists public.users (
  id uuid primary key references auth.users (id) on delete cascade,
  start_date date,
  protein_target int default 160,
  height_cm int,
  starting_weight numeric,
  age int,
  free_days int[],
  run_day int,
  best_streak int default 0,
  sound_enabled boolean default true
);

alter table public.users add column if not exists age int;
alter table public.users add column if not exists best_streak int default 0;
alter table public.users add column if not exists sound_enabled boolean default true;

alter table public.users enable row level security;

create policy "users_select_own" on public.users
  for select using (id = auth.uid());
create policy "users_insert_own" on public.users
  for insert with check (id = auth.uid());
create policy "users_update_own" on public.users
  for update using (id = auth.uid()) with check (id = auth.uid());
create policy "users_delete_own" on public.users
  for delete using (id = auth.uid());

-- 2. daily_logs ----------------------------------------------------------
create table if not exists public.daily_logs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references public.users (id) on delete cascade,
  date date,
  is_training_day boolean,
  workout_quest_key text,
  workout_done boolean default false,
  rest_quest_key text,
  rest_quest_done boolean default false,
  meal_protein_logged int,
  meal_quest_done boolean default false,
  meal_side_quest_key text,
  meal_side_value numeric,
  meal_side_done boolean default false
);

alter table public.daily_logs add column if not exists meal_side_value numeric;

-- One row per user per day. Also the upsert conflict target Today.jsx relies on
-- to survive a double-fired "create today's row" (e.g. React StrictMode's dev
-- double-effect) without silently creating duplicate rows for the same date.
-- If this errors on existing data, duplicates already exist — run the dedupe
-- delete below first, then re-run this line.
create unique index if not exists daily_logs_user_date_unique on public.daily_logs (user_id, date);

alter table public.daily_logs enable row level security;

create policy "daily_logs_select_own" on public.daily_logs
  for select using (user_id = auth.uid());
create policy "daily_logs_insert_own" on public.daily_logs
  for insert with check (user_id = auth.uid());
create policy "daily_logs_update_own" on public.daily_logs
  for update using (user_id = auth.uid()) with check (user_id = auth.uid());
create policy "daily_logs_delete_own" on public.daily_logs
  for delete using (user_id = auth.uid());

-- 3. weight_logs -----------------------------------------------------------
create table if not exists public.weight_logs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references public.users (id) on delete cascade,
  date date,
  weight numeric
);

alter table public.weight_logs enable row level security;

create policy "weight_logs_select_own" on public.weight_logs
  for select using (user_id = auth.uid());
create policy "weight_logs_insert_own" on public.weight_logs
  for insert with check (user_id = auth.uid());
create policy "weight_logs_update_own" on public.weight_logs
  for update using (user_id = auth.uid()) with check (user_id = auth.uid());
create policy "weight_logs_delete_own" on public.weight_logs
  for delete using (user_id = auth.uid());

-- 4. tiers -----------------------------------------------------------------
-- current_tier is 0-indexed to match the content pool arrays (workoutPools[0..5], mealSidePools[0..5]).
create table if not exists public.tiers (
  user_id uuid primary key references public.users (id) on delete cascade,
  current_tier int default 0,
  tier_started_at date
);

alter table public.tiers alter column current_tier set default 0;

alter table public.tiers enable row level security;

create policy "tiers_select_own" on public.tiers
  for select using (user_id = auth.uid());
create policy "tiers_insert_own" on public.tiers
  for insert with check (user_id = auth.uid());
create policy "tiers_update_own" on public.tiers
  for update using (user_id = auth.uid()) with check (user_id = auth.uid());
create policy "tiers_delete_own" on public.tiers
  for delete using (user_id = auth.uid());

-- 5. trials ------------------------------------------------------------------
create table if not exists public.trials (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references public.users (id) on delete cascade,
  tier_number int,
  status text default 'pending',
  cleared_at date,
  retried_at date,
  created_at timestamptz default now(),
  notes text
);

alter table public.trials add column if not exists retried_at date;
alter table public.trials add column if not exists created_at timestamptz default now();

alter table public.trials enable row level security;

create policy "trials_select_own" on public.trials
  for select using (user_id = auth.uid());
create policy "trials_insert_own" on public.trials
  for insert with check (user_id = auth.uid());
create policy "trials_update_own" on public.trials
  for update using (user_id = auth.uid()) with check (user_id = auth.uid());
create policy "trials_delete_own" on public.trials
  for delete using (user_id = auth.uid());

-- 6. xp_stats ------------------------------------------------------------------
create table if not exists public.xp_stats (
  user_id uuid primary key references public.users (id) on delete cascade,
  strength_xp int default 0,
  endurance_xp int default 0,
  discipline_xp int default 0,
  nutrition_xp int default 0
);

alter table public.xp_stats enable row level security;

create policy "xp_stats_select_own" on public.xp_stats
  for select using (user_id = auth.uid());
create policy "xp_stats_insert_own" on public.xp_stats
  for insert with check (user_id = auth.uid());
create policy "xp_stats_update_own" on public.xp_stats
  for update using (user_id = auth.uid()) with check (user_id = auth.uid());
create policy "xp_stats_delete_own" on public.xp_stats
  for delete using (user_id = auth.uid());

-- 7. achievements ------------------------------------------------------------
create table if not exists public.achievements (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references public.users (id) on delete cascade,
  key text,
  unlocked_at date
);

-- One row per user per achievement — the upsert conflict target checkAchievements
-- relies on to avoid inserting a duplicate unlock if the check ever races.
create unique index if not exists achievements_user_key_unique on public.achievements (user_id, key);

alter table public.achievements enable row level security;

create policy "achievements_select_own" on public.achievements
  for select using (user_id = auth.uid());
create policy "achievements_insert_own" on public.achievements
  for insert with check (user_id = auth.uid());
create policy "achievements_update_own" on public.achievements
  for update using (user_id = auth.uid()) with check (user_id = auth.uid());
create policy "achievements_delete_own" on public.achievements
  for delete using (user_id = auth.uid());
