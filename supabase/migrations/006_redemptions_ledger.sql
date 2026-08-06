-- 006_redemptions_ledger.sql
create table public.reward_redemptions (
  id uuid primary key default gen_random_uuid(),
  reward_id uuid not null references public.rewards(id) on delete restrict,
  child_id uuid not null references public.profiles(id) on delete cascade,
  points_cost int not null check (points_cost >= 0),
  status text not null default 'pending' check (status in ('pending','approved','rejected','fulfilled','cancelled')),
  requested_at timestamptz not null default now(),
  approved_at timestamptz,
  fulfilled_at timestamptz,
  reviewed_by_parent_id uuid references public.profiles(id),
  created_at timestamptz not null default now()
);

create index idx_redemptions_child on public.reward_redemptions(child_id);
create index idx_redemptions_reward on public.reward_redemptions(reward_id);

create table public.points_ledger (
  id uuid primary key default gen_random_uuid(),
  child_id uuid not null references public.profiles(id) on delete cascade,
  family_id uuid not null references public.families(id) on delete cascade,
  task_id uuid references public.tasks(id) on delete set null,
  redemption_id uuid references public.reward_redemptions(id) on delete set null,
  amount int not null check (amount <> 0),
  reason text not null,
  created_by_profile_id uuid references public.profiles(id),
  created_at timestamptz not null default now()
);

create index idx_points_ledger_child on public.points_ledger(child_id);
create index idx_points_ledger_family on public.points_ledger(family_id);

-- Prevent duplicate task-completion awards: only one ledger row per task
-- that is not itself tied to a redemption.
create unique index uq_points_ledger_task_award
  on public.points_ledger(task_id)
  where (task_id is not null and redemption_id is null);

-- Balance is derived, never stored as an independently-editable column.
create or replace function public.get_child_balance(p_child_id uuid)
returns bigint
language sql
stable
security definer
set search_path = public
as $$
  select coalesce(sum(amount), 0)::bigint from public.points_ledger where child_id = p_child_id;
$$;

create view public.child_points_balance as
  select child_id, coalesce(sum(amount), 0)::bigint as balance
  from public.points_ledger
  group by child_id;

alter table public.reward_redemptions enable row level security;
alter table public.points_ledger enable row level security;

-- Redemptions: children can create + read their own; parents can read/manage
-- within their families. Status-changing updates happen only through the
-- SECURITY DEFINER functions below (owned by a privileged role), not via
-- direct client updates.
create policy redemptions_child_select on public.reward_redemptions
  for select using (child_id = public.current_profile_id());

create policy redemptions_child_insert on public.reward_redemptions
  for insert with check (
    child_id = public.current_profile_id()
    and status = 'pending'
    and exists (select 1 from public.rewards r where r.id = reward_id and public.is_family_member(r.family_id))
  );

create policy redemptions_parent_select on public.reward_redemptions
  for select using (
    exists (select 1 from public.rewards r where r.id = reward_id and public.is_family_parent(r.family_id))
  );

-- Points ledger: read-only for both roles via RLS; all inserts happen via
-- SECURITY DEFINER functions (no direct insert policy granted).
create policy points_ledger_child_select on public.points_ledger
  for select using (child_id = public.current_profile_id());

create policy points_ledger_parent_select on public.points_ledger
  for select using (public.is_family_parent(family_id));
