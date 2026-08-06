-- 003_families.sql
create table public.families (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  owner_parent_id uuid not null references public.profiles(id) on delete restrict,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create trigger trg_families_updated_at
before update on public.families
for each row execute function public.set_updated_at();

create table public.family_members (
  id uuid primary key default gen_random_uuid(),
  family_id uuid not null references public.families(id) on delete cascade,
  profile_id uuid not null references public.profiles(id) on delete cascade,
  member_role text not null check (member_role in ('parent','child')),
  created_at timestamptz not null default now(),
  unique (family_id, profile_id)
);

create index idx_family_members_family on public.family_members(family_id);
create index idx_family_members_profile on public.family_members(profile_id);

alter table public.families enable row level security;
alter table public.family_members enable row level security;

-- helper: is the current user a member (any role) of a given family?
create or replace function public.is_family_member(fid uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.family_members fm
    where fm.family_id = fid and fm.profile_id = public.current_profile_id()
  );
$$;

-- helper: is the current user a parent member of a given family?
create or replace function public.is_family_parent(fid uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.family_members fm
    join public.profiles p on p.id = fm.profile_id
    where fm.family_id = fid and fm.profile_id = public.current_profile_id()
      and fm.member_role = 'parent' and p.role = 'parent'
  );
$$;

create policy families_select_members on public.families
  for select using (public.is_family_member(id));

create policy family_members_select_same_family on public.family_members
  for select using (public.is_family_member(family_id));

-- Now that family_members exists, allow parents to view child profiles
-- (and children to view their parent's basic profile) within the same family.
create policy profiles_select_family on public.profiles
  for select using (
    exists (
      select 1 from public.family_members mine
      join public.family_members theirs on theirs.family_id = mine.family_id
      where mine.profile_id = public.current_profile_id()
        and theirs.profile_id = public.profiles.id
    )
  );
