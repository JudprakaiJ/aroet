-- =============================================================================
-- AROET Phase 3 — Clock-in support
-- Adds 4 columns to sessions to track real-time clock-in / clock-out
--
-- Active session = clock_in_at IS NOT NULL AND clock_out_at IS NULL
--                  for one engineer at a time.
-- Pause:           paused_at IS NOT NULL (paused now)
-- Pause accounting paused_total_minutes accumulates across pause/resume cycles
--
-- Safe to re-run.
-- =============================================================================

alter table sessions add column if not exists clock_in_at          timestamptz;
alter table sessions add column if not exists clock_out_at         timestamptz;
alter table sessions add column if not exists paused_at            timestamptz;
alter table sessions add column if not exists paused_total_minutes int default 0;

-- Fast lookup for the active-session query (engineer with clock_out_at NULL).
-- Partial index keeps it tiny — only open sessions are indexed.
create index if not exists idx_sessions_active
  on sessions (engineer_code)
  where clock_in_at is not null and clock_out_at is null;

-- Sanity check
select
  (select count(*) from sessions where clock_in_at is not null) as with_clock_in,
  (select count(*) from sessions where clock_in_at is not null and clock_out_at is null) as currently_active;
