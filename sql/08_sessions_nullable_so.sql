-- =============================================================================
-- AROET Sprint 5 — Allow null so_number for leave sessions (AL/SICK/PERS)
-- =============================================================================

-- Drop NOT NULL on sessions.so_number so leave types can be saved
-- without requiring a case
alter table sessions alter column so_number drop not null;

-- Verify
select column_name, is_nullable
  from information_schema.columns
 where table_name='sessions' and column_name='so_number';
