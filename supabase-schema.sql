-- ============================================================
-- FlowGen — Supabase Schema
-- Run this in your Supabase SQL editor (Dashboard → SQL Editor)
-- ============================================================

-- ── Users table ───────────────────────────────────────────────────────────────
create table if not exists public.users (
  id uuid references auth.users(id) on delete cascade primary key,
  email text not null,
  created_at timestamptz default now() not null,
  stripe_customer_id text,
  subscription_status text default 'free' not null,
  free_generations_used integer default 0 not null,
  -- Default preferences
  default_image_model text,
  default_text_model text,
  default_category_preset text,
  default_lighting_preset text,
  -- Custom AI system prompt for text generation
  custom_system_prompt text,
  -- Default output language
  default_language text default 'en',
  -- Onboarding
  onboarding_completed boolean default false,
  -- Referral system
  referral_code text unique,
  referred_by text,
  referral_free_months integer default 0
);

alter table public.users enable row level security;

create policy "Users can view own profile"
  on public.users for select using (auth.uid() = id);

create policy "Users can update own profile"
  on public.users for update using (auth.uid() = id);

-- Auto-create user row on signup
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.users (id, email)
  values (new.id, new.email)
  on conflict (id) do nothing;
  return new;
end;
$$ language plpgsql security definer;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- ── API keys table ────────────────────────────────────────────────────────────
create table if not exists public.api_keys (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references public.users(id) on delete cascade not null,
  provider text not null,
  encrypted_key text not null,
  created_at timestamptz default now() not null,
  unique(user_id, provider)
);

alter table public.api_keys enable row level security;

create policy "Users can manage own API keys"
  on public.api_keys for all using (auth.uid() = user_id);

-- ── Generations table ─────────────────────────────────────────────────────────
create table if not exists public.generations (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references public.users(id) on delete cascade not null,
  created_at timestamptz default now() not null,
  image_model text not null,
  text_model text not null,
  category_preset text not null,
  lighting_preset text not null,
  platforms text[] not null default '{}',
  prompt_used text,
  status text default 'completed' not null,
  has_style_reference boolean default false,
  has_product_reference boolean default false,
  product_description text,
  image_url text  -- public URL in Supabase Storage
);

alter table public.generations enable row level security;

create policy "Users can view own generations"
  on public.generations for select using (auth.uid() = user_id);

create policy "Users can insert own generations"
  on public.generations for insert with check (auth.uid() = user_id);

-- ── Saved prompts table ───────────────────────────────────────────────────────
create table if not exists public.saved_prompts (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references public.users(id) on delete cascade not null,
  name text not null,
  prompt text not null,
  created_at timestamptz default now() not null
);

alter table public.saved_prompts enable row level security;

create policy "Users can manage own saved prompts"
  on public.saved_prompts for all using (auth.uid() = user_id);

-- ── Storage bucket ────────────────────────────────────────────────────────────
-- Run in the SQL editor OR create manually in Dashboard → Storage

insert into storage.buckets (id, name, public)
values ('generated-images', 'generated-images', true)
on conflict (id) do nothing;

-- Allow authenticated users to upload to their own folder
create policy "Authenticated users can upload images"
  on storage.objects for insert
  to authenticated
  with check (
    bucket_id = 'generated-images' and
    (storage.foldername(name))[1] = auth.uid()::text
  );

-- Allow public read access
create policy "Public read access for generated images"
  on storage.objects for select
  to public
  using (bucket_id = 'generated-images');

-- Allow users to delete their own images
create policy "Users can delete own images"
  on storage.objects for delete
  to authenticated
  using (
    bucket_id = 'generated-images' and
    (storage.foldername(name))[1] = auth.uid()::text
  );

-- ── Migrations: run these if the DB already exists ───────────────────────────
-- alter table public.users add column if not exists custom_system_prompt text;
-- alter table public.users add column if not exists default_language text default 'en';
-- alter table public.users add column if not exists onboarding_completed boolean default false;

-- ── Referral system migration (2026-05-17) ────────────────────────────────────
-- Run these if you already have a DB without the referral columns:
-- alter table public.users add column if not exists referral_code text unique;
-- alter table public.users add column if not exists referred_by text;
-- alter table public.users add column if not exists referral_free_months integer default 0;
