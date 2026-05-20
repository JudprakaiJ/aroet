-- Phase 5M: per-machine PM checklist
--
-- The case_checklists table already has a machine_no column (added in
-- sql/01_migration.sql), but the application up to phase 5L only ever
-- attached one checklist per case. Multi-machine PMs (e.g. 4× MCVP8 at
-- one site) need one checklist per case_machine.
--
-- This migration:
--  1. Backfills machine_no on any existing checklist rows from
--     case_machines (primary first) then falls back to cases.machine_no
--  2. Adds a unique constraint on (so_number, machine_no) so the app
--     can rely on a single row per (case, machine)
--  3. Adds a supporting index for the new lookup path
--
-- Re-runnable: every statement is guarded with IF NOT EXISTS or no-ops
-- on second run.

-- 1a. Backfill from case_machines (primary preferred)
update case_checklists cc
set machine_no = m.machine_no
from (
  select c.id as checklist_id, cm.machine_no
  from case_checklists c
  cross join lateral (
    select machine_no
    from case_machines
    where so_number = c.so_number
    order by is_primary desc nulls last, machine_no
    limit 1
  ) cm
  where c.machine_no is null
) m
where cc.id = m.checklist_id;

-- 1b. Fall back to legacy cases.machine_no
update case_checklists cc
set machine_no = c.machine_no
from cases c
where cc.so_number = c.so_number
  and cc.machine_no is null
  and c.machine_no is not null;

-- 2. Unique constraint on (so_number, machine_no)
do $$
begin
  if not exists (
    select 1 from pg_constraint
    where conname = 'case_checklists_so_machine_uniq'
  ) then
    alter table case_checklists
      add constraint case_checklists_so_machine_uniq
      unique (so_number, machine_no);
  end if;
end $$;

-- 3. Index for the new per-machine lookup
create index if not exists idx_case_checklists_so_machine
  on case_checklists (so_number, machine_no);
