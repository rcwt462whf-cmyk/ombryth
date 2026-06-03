-- Run this in Supabase SQL editor when ready to enable Pinflow integration

-- Personal API keys table (for Pinflow → Ombryth connection)
create table if not exists personal_api_keys (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade not null,
  key_hash text not null unique,        -- sha256 of the actual key (never store plaintext)
  key_prefix text not null,            -- first 8 chars shown in UI e.g. "omk_a1b2"
  label text not null default 'Pinflow',
  last_used_at timestamptz,
  created_at timestamptz default now()
);

alter table personal_api_keys enable row level security;

create policy "Users manage own personal API keys"
  on personal_api_keys for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- Index for fast key lookup during ingest auth
create index personal_api_keys_key_hash_idx on personal_api_keys(key_hash);
