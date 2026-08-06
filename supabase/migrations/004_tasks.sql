-- 004_tasks.sql
create table public.tasks (
  id uuid primary key default gen_random_uuid(),
  family_id uuid not null references public.families(id) on delete cascade,
  created_by_parent_id uuid not null references public.profiles(id) on delete restrict,
  assigned_child_id uuid not null references public.profiles(id) on delete cascade,
  title text not null,
  description text,
  instructions text,
  deadline timestamptz,
  urgency text not null default 'medium' check (urgency in ('low','medium','high')),
  importance text not null default 'medium' check (importance in ('low','medium','high')),
  points_value int not null default 0 check (points_value >= 0),
  status text not null default 'pending' check (status in ('pending','in_progress','waiting_for_approval','completed','overdue','cancelled')),
  requires_parent_approval boolean not null default true,
  requires_photo boolean not null default false,
  completed_at timestamptz,
  approved_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index idx_tasks_assigned_status on public.tasks(assigned_child_id, status);
create index idx_tasks_family on public.tasks(family_id);

create trigger trg_tasks_updated_at
before update on public.tasks
for each row execute function public.set_updated_at();

create table public.task_steps (
  id uuid primary key default gen_random_uuid(),
  task_id uuid not null references public.tasks(id) on delete cascade,
  text text not null,
  position int not null default 0,
  completed boolean not null default false,
  source text not null default 'parent' check (source in ('parent','child','ai')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index idx_task_steps_task on public.task_steps(task_id);

create trigger trg_task_steps_updated_at
before update on public.task_steps
for each row execute function public.set_updated_at();

alter table public.tasks enable row level security;
alter table public.task_steps enable row level security;

-- Parents: full access to tasks within families they parent.
create policy tasks_parent_all on public.tasks
  for all using (public.is_family_parent(family_id))
  with check (public.is_family_parent(family_id));

-- Children: read-only access to tasks assigned to them.
create policy tasks_child_select on public.tasks
  for select using (assigned_child_id = public.current_profile_id());

-- Children: allowed to update limited fields (status transitions) on their own tasks.
-- Fine-grained field restriction is enforced in application code / functions;
-- RLS here only gates row visibility for the update.
create policy tasks_child_update_own on public.tasks
  for update using (assigned_child_id = public.current_profile_id())
  with check (assigned_child_id = public.current_profile_id());

create policy task_steps_parent_all on public.task_steps
  for all using (
    exists (select 1 from public.tasks t where t.id = task_steps.task_id and public.is_family_parent(t.family_id))
  ) with check (
    exists (select 1 from public.tasks t where t.id = task_steps.task_id and public.is_family_parent(t.family_id))
  );

create policy task_steps_child_select on public.task_steps
  for select using (
    exists (select 1 from public.tasks t where t.id = task_steps.task_id and t.assigned_child_id = public.current_profile_id())
  );

create policy task_steps_child_update on public.task_steps
  for update using (
    exists (select 1 from public.tasks t where t.id = task_steps.task_id and t.assigned_child_id = public.current_profile_id())
  ) with check (
    exists (select 1 from public.tasks t where t.id = task_steps.task_id and t.assigned_child_id = public.current_profile_id())
  );

create policy task_steps_child_insert on public.task_steps
  for insert with check (
    source = 'child' and exists (select 1 from public.tasks t where t.id = task_steps.task_id and t.assigned_child_id = public.current_profile_id())
  );
