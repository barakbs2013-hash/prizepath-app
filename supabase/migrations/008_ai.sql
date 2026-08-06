-- 008_ai.sql
create table public.ai_conversations (
  id uuid primary key default gen_random_uuid(),
  child_id uuid not null references public.profiles(id) on delete cascade,
  task_id uuid references public.tasks(id) on delete set null,
  status text not null default 'active' check (status in ('active','closed')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index idx_ai_conversations_child on public.ai_conversations(child_id);

create trigger trg_ai_conversations_updated_at
before update on public.ai_conversations
for each row execute function public.set_updated_at();

create table public.ai_messages (
  id uuid primary key default gen_random_uuid(),
  conversation_id uuid not null references public.ai_conversations(id) on delete cascade,
  role text not null check (role in ('user','assistant')),
  content text not null,
  created_at timestamptz not null default now()
);

create index idx_ai_messages_conversation on public.ai_messages(conversation_id);

alter table public.ai_conversations enable row level security;
alter table public.ai_messages enable row level security;

create policy ai_conversations_child_all on public.ai_conversations
  for all using (child_id = public.current_profile_id())
  with check (child_id = public.current_profile_id());

-- Parents get read-only oversight of their children's AI conversations.
create policy ai_conversations_parent_select on public.ai_conversations
  for select using (
    exists (
      select 1 from public.family_members fm_child
      join public.family_members fm_parent on fm_parent.family_id = fm_child.family_id
      where fm_child.profile_id = ai_conversations.child_id
        and fm_parent.profile_id = public.current_profile_id()
        and fm_parent.member_role = 'parent'
    )
  );

create policy ai_messages_child_all on public.ai_messages
  for all using (
    exists (select 1 from public.ai_conversations c where c.id = ai_messages.conversation_id and c.child_id = public.current_profile_id())
  ) with check (
    exists (select 1 from public.ai_conversations c where c.id = ai_messages.conversation_id and c.child_id = public.current_profile_id())
  );

-- Parents: read-only oversight, no write access to ai_messages.
create policy ai_messages_parent_select on public.ai_messages
  for select using (
    exists (
      select 1 from public.ai_conversations c
      join public.family_members fm_child on fm_child.profile_id = c.child_id
      join public.family_members fm_parent on fm_parent.family_id = fm_child.family_id
      where c.id = ai_messages.conversation_id
        and fm_parent.profile_id = public.current_profile_id()
        and fm_parent.member_role = 'parent'
    )
  );
