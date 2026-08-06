-- 009_notifications.sql
create table public.notifications (
  id uuid primary key default gen_random_uuid(),
  recipient_profile_id uuid not null references public.profiles(id) on delete cascade,
  type text not null,
  title text not null,
  message text,
  related_entity_type text,
  related_entity_id uuid,
  read_at timestamptz,
  created_at timestamptz not null default now()
);

create index idx_notifications_recipient on public.notifications(recipient_profile_id, read_at);

alter table public.notifications enable row level security;

create policy notifications_select_own on public.notifications
  for select using (recipient_profile_id = public.current_profile_id());

create policy notifications_update_own on public.notifications
  for update using (recipient_profile_id = public.current_profile_id())
  with check (recipient_profile_id = public.current_profile_id());

-- Inserts happen from trusted server-side code (service role / SECURITY
-- DEFINER functions) only; no client insert policy.
