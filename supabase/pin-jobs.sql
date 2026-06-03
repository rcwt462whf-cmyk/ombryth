-- Run after pinflow-integration.sql

create table if not exists public.pin_jobs (
  id uuid primary key,
  user_id uuid references auth.users(id) on delete cascade not null,
  workspace_id text not null,
  blog_url text not null,
  callback_url text not null,
  preset text default 'lifestyle',
  source_id text,
  external_row_id text,
  status text default 'pending' not null,  -- pending | completed | failed
  image_url text,
  error text,
  created_at timestamptz default now() not null,
  completed_at timestamptz
);

alter table public.pin_jobs enable row level security;

create policy "Users can view own pin jobs"
  on public.pin_jobs for select using (auth.uid() = user_id);

create policy "Service can insert pin jobs"
  on public.pin_jobs for insert with check (true);

create policy "Service can update pin jobs"
  on public.pin_jobs for update using (true);
