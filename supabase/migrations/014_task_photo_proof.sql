-- 014_task_photo_proof.sql
-- Photo proof for tasks created with requires_photo.
--
-- Before this, requires_photo was display-only: nothing stored a photo and
-- nothing checked for one, so a child could finish a photo task without ever
-- attaching anything. This adds the column, the bucket, and — most
-- importantly — the check inside submit_task_completion, so the rule holds
-- even if a request skips the API route.

alter table public.tasks add column if not exists proof_photo_url text;
alter table public.tasks add column if not exists proof_photo_uploaded_at timestamptz;

-- Bucket for the proof photos. Public-read like reward-images: paths are
-- random UUIDs, so a URL is unguessable, and the parent's approval screen can
-- render the image without minting signed URLs on every page load.
insert into storage.buckets (id, name, public)
values ('task-photos', 'task-photos', true)
on conflict (id) do nothing;

-- Uploads go through the server with the service role (which bypasses these
-- policies); the policy below only covers public read of the bucket.
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
  if v_task.requires_photo and coalesce(v_task.proof_photo_url, '') = '' then
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
