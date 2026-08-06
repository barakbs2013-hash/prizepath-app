-- 013_submit_task_completion.sql
-- Handles the child-facing "mark task done" action. This is intentionally
-- a separate function from approve_task_and_award_points: that one is
-- gated on the CALLER being a parent in the task's family (used for the
-- parent-approval flow); this one is gated on the caller being the
-- assigned child, and auto-awards points itself when no approval is
-- required, reusing the same ledger insert + duplicate-award guard
-- (uq_points_ledger_task_award).
create or replace function public.submit_task_completion(p_task_id uuid)
returns public.tasks
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

  if v_task.assigned_child_id <> public.current_profile_id() then
    raise exception 'not authorized';
  end if;

  if v_task.status not in ('pending', 'in_progress') then
    raise exception 'task cannot be completed from its current status';
  end if;

  if v_task.requires_parent_approval then
    update public.tasks
      set status = 'waiting_for_approval', completed_at = now()
      where id = p_task_id
      returning * into v_task;
    return v_task;
  end if;

  update public.tasks
    set status = 'completed', completed_at = now(), approved_at = now()
    where id = p_task_id
    returning * into v_task;

  insert into public.points_ledger (child_id, family_id, task_id, amount, reason, created_by_profile_id)
  values (v_task.assigned_child_id, v_task.family_id, p_task_id, v_task.points_value, 'task_completed', v_task.assigned_child_id)
  on conflict do nothing;

  return v_task;
end;
$$;
