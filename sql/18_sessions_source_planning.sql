-- Phase 6l-2: extend sessions.source CHECK to allow 'planning'.
--
-- The /planning grid (since Phase 5j) and now the case-form Plan dates
-- picker (Phase 6l) both write sessions with source='planning' to mark
-- pre-scheduled entries that haven't been clocked into yet. The original
-- CHECK from sql/01 only allowed 'manual' / 'planner', so every planning
-- write was silently failing with sessions_source_check violation —
-- which is why no rows currently exist in the table with that source.
--
-- Idempotent: drops the existing constraint by name and recreates it
-- with the extended enum list.

alter table sessions drop constraint if exists sessions_source_check;

alter table sessions
  add constraint sessions_source_check
  check (source in ('manual', 'planner', 'planning'));
