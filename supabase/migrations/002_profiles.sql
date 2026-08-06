-- 002_profiles.sql
create table public.profiles (
  id uuid primary key default gen_random_uuid(),
  auth_user_id uuid not null unique references auth.users(id) on delete cascade,
  role text not null check (role in ('parent','child')),
  display_name text not null,
  avatar_url text,
  preferred_language text not null default 'he' check (preferred_language in ('he','en','ar','fr')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create trigger trg_profiles_updated_at
before update on public.profiles
for each row execute function public.set_updated_at();

create index idx_profiles_auth_user_id on public.profiles(auth_user_id);

alter table public.profiles enable row level security;

-- helper: resolve profile id for the current auth user
create or replace function public.current_profile_id()
returns uuid
language sql
stable
security definer
set search_path = public
as $$
  select id from public.profiles where auth_user_id = auth.uid();
$$;

create policy profiles_select_own on public.profiles
  for select using (auth_user_id = auth.uid());

create policy profiles_update_own on public.profiles
  for update using (auth_user_id = auth.uid());

-- profiles are created via server-side (service role) during signup flows;
-- no insert policy for regular clients.
