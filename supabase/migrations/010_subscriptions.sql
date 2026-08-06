-- 010_subscriptions.sql
create table public.subscriptions (
  id uuid primary key default gen_random_uuid(),
  family_id uuid not null references public.families(id) on delete cascade,
  plan text not null default 'free' check (plan in ('free','premium')),
  status text not null default 'active' check (status in ('active','inactive','canceled')),
  provider text,
  provider_customer_id text,
  provider_subscription_id text,
  current_period_end timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create unique index uq_subscriptions_family on public.subscriptions(family_id);

create trigger trg_subscriptions_updated_at
before update on public.subscriptions
for each row execute function public.set_updated_at();

alter table public.subscriptions enable row level security;

create policy subscriptions_parent_select on public.subscriptions
  for select using (public.is_family_parent(family_id));

-- No client insert/update policy: subscriptions are provisioned by
-- server-side code (default free row on family creation) and, for now,
-- flipped to premium only via manual DB update / future billing webhook.
