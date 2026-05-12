-- =============================================================================
-- AROET Phase 1 — Workforce + Approvals
-- Run AFTER 01_migration.sql
-- Safe to re-run
-- =============================================================================

-- =============================================================================
-- 1. SESSIONS — extra columns for billing flag + approval status
-- =============================================================================
-- Whether AR= (office time) is customer-related → bill or not bill
alter table sessions add column if not exists is_customer_related boolean default false;

-- Per-session approval status
alter table sessions add column if not exists approval_status text default 'draft'
  check (approval_status in ('draft', 'submitted', 'approved', 'returned'));

alter table sessions add column if not exists approved_by text references engineers(code);
alter table sessions add column if not exists approved_at timestamptz;
alter table sessions add column if not exists return_reason text;

-- =============================================================================
-- 2. SESSION_APPROVAL_LOG — audit trail of approve/return/edit-after-approve
-- =============================================================================
create table if not exists session_approval_log (
  id              bigserial primary key,
  session_id      bigint not null references sessions(id) on delete cascade,
  action          text not null check (action in (
    'submitted', 'approved', 'returned', 'edited_after_approval', 'reset_to_draft'
  )),
  by_engineer     text references engineers(code),
  comment         text,
  created_at      timestamptz default now()
);

create index if not exists idx_session_approval_log_session
  on session_approval_log(session_id);
create index if not exists idx_session_approval_log_created
  on session_approval_log(created_at desc);

-- =============================================================================
-- 3. PAY_PERIODS view (helper, not a strict table — period is computed)
-- For reference. The app computes periods on the fly via filters.
-- =============================================================================
-- (No table needed — periods are computed in queries with date filters.)

-- =============================================================================
-- 4. ENGINEER ROLES — role flag for approval permission
-- =============================================================================
-- Add a role field to engineers so we know who can approve (PPI, HR Manager)
alter table engineers add column if not exists role text default 'engineer'
  check (role in ('engineer', 'tech_manager', 'admin', 'boss', 'hr'));

-- Backfill known roles from team structure
update engineers set role = 'boss'        where code = 'PPI';
update engineers set role = 'tech_manager' where code = 'SPE';
update engineers set role = 'admin'       where code = 'CCH';
update engineers set role = 'admin'       where code = 'LRO';
update engineers set role = 'engineer'    where code in ('JKH','RKO','TCH','PSU','RMA','IRO','KBU','JYE');

-- =============================================================================
-- 5. GRANT PERMISSIONS for new table
-- =============================================================================
grant select, insert, update, delete on session_approval_log to anon, authenticated;
grant usage, select on sequence session_approval_log_id_seq to anon, authenticated;

-- =============================================================================
-- 6. RLS — disable for now (Phase 1)
-- =============================================================================
alter table session_approval_log disable row level security;

-- Done
select 'Workforce + approvals migration complete' as status;
