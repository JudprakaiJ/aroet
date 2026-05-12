-- =============================================================================
-- AROET Fix 6A — Shared session detection
-- Run AFTER 03_workforce_approvals.sql
-- =============================================================================

-- Add columns to track shared sessions (engineer copy-pasted into multiple SOs)
alter table sessions add column if not exists is_shared boolean default false;
alter table sessions add column if not exists shared_with_so text[] default '{}'::text[];

-- Index for fast duplicate detection during parse
create index if not exists idx_sessions_engineer_date_raw
  on sessions (engineer_code, session_date, source, raw_line);

-- Existing data: clear is_shared (will be re-set after next bulk reparse)
update sessions set is_shared = false, shared_with_so = '{}'::text[]
  where source = 'planner';

-- Verify
select
  count(*) as total_sessions,
  count(*) filter (where is_shared) as shared_count,
  count(*) filter (where source = 'planner') as planner_sourced
from sessions;
