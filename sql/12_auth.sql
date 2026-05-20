-- Phase 6: PIN authentication
--
-- Adds:
--   1. engineers.pin_hash (scrypt hash of 4-digit PIN, set on first login)
--   2. login_attempts table for rate-limited PIN entry
--   3. JKH bumped to role='admin' so it can demo the approver paths
--
-- Re-runnable: every statement is guarded with IF NOT EXISTS or no-ops on re-run.

-- 1. PIN hash column
alter table engineers add column if not exists pin_hash text;

-- 2. Login attempt rate limit table
create table if not exists login_attempts (
  engineer_code text primary key references engineers(code) on delete cascade,
  fail_count    int default 0,
  last_fail_at  timestamptz,
  locked_until  timestamptz
);

-- 3. JKH = admin (Job tests both engineer + admin paths)
update engineers set role = 'admin' where code = 'JKH' and is_active = true;

-- 4. Grants
grant select, insert, update, delete on login_attempts to service_role, anon, authenticated;
alter table login_attempts disable row level security;
