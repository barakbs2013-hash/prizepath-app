-- 005_rewards.sql
create table public.rewards (
  id uuid primary key default gen_random_uuid(),
  family_id uuid not null references public.families(id) on delete cascade,
  created_by_parent_id uuid not null references public.profiles(id) on delete restrict,
  name text not null,
  description text,
  image_url text,
  points_cost int not null check (points_cost >= 0),
  active boolean not null default true,
  quantity_available int check (quantity_available is null or quantity_available >= 0),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index idx_rewards_family on public.rewards(family_id);

create trigger trg_rewards_updated_at
before update on public.rewards
for each row execute function public.set_updated_at();

alter table public.rewards enable row level security;

create policy rewards_parent_all on public.rewards
  for all using (public.is_family_parent(family_id))
  with check (public.is_family_parent(family_id));

create policy rewards_child_select on public.rewards
  for select using (active = true and public.is_family_member(family_id));
