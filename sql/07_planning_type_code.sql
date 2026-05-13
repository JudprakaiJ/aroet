-- =============================================================================
-- AROET Sprint 4 — Planning Grid schema
-- Add type_code column to sessions (T/V/A/PERS/AL/SICK/WFH/OFF)
-- =============================================================================

alter table sessions add column if not exists type_code text;

create index if not exists idx_sessions_type_code on sessions (type_code);
create index if not exists idx_sessions_engineer_date on sessions (engineer_code, session_date);

update sessions
   set type_code = case
     when activity_type = 'travel' then 'T'
     when activity_type = 'field' then 'T'
     when activity_type = 'remote' then 'WFH'
     when activity_type = 'office' then 'OFF'
     when activity_type = 'training' then 'T'
     when activity_type = 'upgrade' then 'T'
     else 'T'
   end
 where type_code is null;

select
  (select count(*) from sessions where type_code is not null) as sessions_with_type_code,
  (select count(*) from sessions where type_code is null) as sessions_missing_type_code;
