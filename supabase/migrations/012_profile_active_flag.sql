-- 012_profile_active_flag.sql
-- Adds a soft "active" flag so parents can deactivate a child profile
-- without deleting history (tasks, ledger, redemptions all keep working).
alter table public.profiles add column is_active boolean not null default true;
