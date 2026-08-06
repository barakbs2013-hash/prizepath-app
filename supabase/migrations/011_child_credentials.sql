-- 011_child_credentials.sql
-- Stores child username + hashed PIN. NEVER accessible to any client role;
-- all reads/writes happen exclusively from server-side code using the
-- Supabase service role key (see src/lib/server/childAuth.ts).
create table public.child_credentials (
  id uuid primary key default gen_random_uuid(),
  profile_id uuid not null unique references public.profiles(id) on delete cascade,
  username citext not null unique,
  pin_hash text not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create trigger trg_child_credentials_updated_at
before update on public.child_credentials
for each row execute function public.set_updated_at();

alter table public.child_credentials enable row level security;

-- Intentionally NO policies for anon/authenticated roles: RLS is enabled
-- with zero client-facing policies, so PostgREST/Supabase client queries
-- always return zero rows / are rejected for non-service-role callers.
-- Only the service role (which bypasses RLS) can read or write this table.
