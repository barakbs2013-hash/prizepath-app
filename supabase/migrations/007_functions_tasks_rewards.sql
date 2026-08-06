-- 007_functions_tasks_rewards.sql
-- Approve a task waiting for approval and award points atomically.
create or replace function public.approve_task_and_award_points(p_task_id uuid, p_approving_parent_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_task public.tasks%rowtype;
begin
  select * into v_task from public.tasks where id = p_task_id for update;

  if v_task.id is null then
    raise exception 'task not found';
  end if;

  if not public.is_family_parent(v_task.family_id) then
    raise exception 'not authorized';
  end if;

  if not exists (
    select 1 from public.family_members fm
    where fm.family_id = v_task.family_id and fm.profile_id = p_approving_parent_id and fm.member_role = 'parent'
  ) then
    raise exception 'approving parent not in family';
  end if;

  if v_task.status <> 'waiting_for_approval' then
    raise exception 'task is not waiting for approval';
  end if;

  update public.tasks
    set status = 'completed', approved_at = now()
    where id = p_task_id;

  insert into public.points_ledger (child_id, family_id, task_id, amount, reason, created_by_profile_id)
  values (v_task.assigned_child_id, v_task.family_id, p_task_id, v_task.points_value, 'task_completed', p_approving_parent_id)
  on conflict do nothing;
end;
$$;

-- Reject a completed/submitted task: sends it back to in_progress, no points.
create or replace function public.reject_task_completion(p_task_id uuid, p_approving_parent_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_task public.tasks%rowtype;
begin
  select * into v_task from public.tasks where id = p_task_id for update;
  if v_task.id is null then
    raise exception 'task not found';
  end if;
  if not public.is_family_parent(v_task.family_id) then
    raise exception 'not authorized';
  end if;
  if v_task.status <> 'waiting_for_approval' then
    raise exception 'task is not waiting for approval';
  end if;
  update public.tasks set status = 'in_progress', completed_at = null where id = p_task_id;
end;
$$;

-- Request a reward redemption: verifies balance/availability, inserts pending row.
create or replace function public.redeem_reward(p_child_id uuid, p_reward_id uuid)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_reward public.rewards%rowtype;
  v_balance bigint;
  v_redemption_id uuid;
begin
  if p_child_id <> public.current_profile_id() then
    raise exception 'not authorized';
  end if;

  select * into v_reward from public.rewards where id = p_reward_id for update;
  if v_reward.id is null or v_reward.active is not true then
    raise exception 'reward not available';
  end if;

  if not public.is_family_member(v_reward.family_id) then
    raise exception 'reward not in your family';
  end if;

  if v_reward.quantity_available is not null and v_reward.quantity_available <= 0 then
    raise exception 'reward out of stock';
  end if;

  v_balance := public.get_child_balance(p_child_id);
  if v_balance < v_reward.points_cost then
    raise exception 'insufficient points';
  end if;

  insert into public.reward_redemptions (reward_id, child_id, points_cost, status)
  values (p_reward_id, p_child_id, v_reward.points_cost, 'pending')
  returning id into v_redemption_id;

  return v_redemption_id;
end;
$$;

-- Approve a redemption: re-checks balance at approval time (concurrent-spend guard).
create or replace function public.approve_redemption(p_redemption_id uuid, p_approving_parent_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_redemption public.reward_redemptions%rowtype;
  v_reward public.rewards%rowtype;
  v_balance bigint;
begin
  select * into v_redemption from public.reward_redemptions where id = p_redemption_id for update;
  if v_redemption.id is null then
    raise exception 'redemption not found';
  end if;
  if v_redemption.status <> 'pending' then
    raise exception 'redemption is not pending';
  end if;

  select * into v_reward from public.rewards where id = v_redemption.reward_id for update;
  if not public.is_family_parent(v_reward.family_id) then
    raise exception 'not authorized';
  end if;

  v_balance := public.get_child_balance(v_redemption.child_id);
  if v_balance < v_redemption.points_cost then
    raise exception 'insufficient points at approval time';
  end if;

  if v_reward.quantity_available is not null and v_reward.quantity_available <= 0 then
    raise exception 'reward out of stock';
  end if;

  update public.reward_redemptions
    set status = 'approved', approved_at = now(), reviewed_by_parent_id = p_approving_parent_id
    where id = p_redemption_id;

  insert into public.points_ledger (child_id, family_id, redemption_id, amount, reason, created_by_profile_id)
  values (v_redemption.child_id, v_reward.family_id, p_redemption_id, -v_redemption.points_cost, 'reward_redeemed', p_approving_parent_id);

  if v_reward.quantity_available is not null then
    update public.rewards set quantity_available = quantity_available - 1 where id = v_reward.id;
  end if;
end;
$$;

create or replace function public.reject_redemption(p_redemption_id uuid, p_approving_parent_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_redemption public.reward_redemptions%rowtype;
  v_reward public.rewards%rowtype;
begin
  select * into v_redemption from public.reward_redemptions where id = p_redemption_id for update;
  if v_redemption.id is null then
    raise exception 'redemption not found';
  end if;
  if v_redemption.status <> 'pending' then
    raise exception 'redemption is not pending';
  end if;
  select * into v_reward from public.rewards where id = v_redemption.reward_id;
  if not public.is_family_parent(v_reward.family_id) then
    raise exception 'not authorized';
  end if;
  update public.reward_redemptions
    set status = 'rejected', reviewed_by_parent_id = p_approving_parent_id
    where id = p_redemption_id;
end;
$$;

create or replace function public.mark_redemption_fulfilled(p_redemption_id uuid, p_approving_parent_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_redemption public.reward_redemptions%rowtype;
  v_reward public.rewards%rowtype;
begin
  select * into v_redemption from public.reward_redemptions where id = p_redemption_id for update;
  if v_redemption.id is null then
    raise exception 'redemption not found';
  end if;
  if v_redemption.status <> 'approved' then
    raise exception 'redemption is not approved';
  end if;
  select * into v_reward from public.rewards where id = v_redemption.reward_id;
  if not public.is_family_parent(v_reward.family_id) then
    raise exception 'not authorized';
  end if;
  update public.reward_redemptions
    set status = 'fulfilled', fulfilled_at = now(), reviewed_by_parent_id = p_approving_parent_id
    where id = p_redemption_id;
end;
$$;
