-- 014_task_photo_proof.sql
-- OPTIONAL hardening for photo proof. The app does NOT need this migration:
-- proof photos live at `task-photos/<task id>/`, the bucket is the record, and
-- /api/tasks/[taskId]/complete refuses to submit a requires_photo task with an
-- empty folder. Running this moves that same rule into the database, so it
-- holds even for a caller that reaches the RPC directly.
--
-- The bucket is created by the app's setup (or here, if missing).

insert into storage.buckets (id, name, public)
values ('task-photos', 'task-photos', true)
on conflict (id) do nothing;

-- Uploads go through the server with the service role, which bypasses these
-- policies; this only covers public read so parents can view the photo.
drop policy if exists task_photos_public_read on storage.objects;
create policy task_photos_public_read on storage.objects
  for select using (bucket_id = 'task-photos');

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

  -- A photo task is not done until the photo exists.
  if v_task.requires_photo and not exists (
    select 1 from storage.objects
    where bucket_id = 'task-photos'
      and name like p_task_id::text || '/%'
  ) then
    raise exception 'photo_required';
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
