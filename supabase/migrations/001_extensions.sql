-- 001_extensions.sql
create extension if not exists pgcrypto;
create extension if not exists citext;

-- generic updated_at trigger function reused by all tables
create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;
