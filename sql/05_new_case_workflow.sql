-- =============================================================================
-- AROET Sprint 2 — New case workflow schema
-- Run in Supabase SQL Editor
-- =============================================================================

-- 1. Add SR number + project_code to cases
alter table cases add column if not exists sr_number text;
alter table cases add column if not exists project_code text;
alter table cases add column if not exists description text;

create index if not exists idx_cases_sr_number on cases (sr_number);
create index if not exists idx_cases_project_code on cases (project_code);

-- 2. Junction table for case ↔ machines (one case → many machines)
create table if not exists case_machines (
  id              bigserial primary key,
  so_number       text not null references cases(so_number) on delete cascade,
  machine_no      text not null references machines(machine_no) on delete cascade,
  is_primary      boolean default false,
  created_at      timestamptz default now(),
  unique (so_number, machine_no)
);

create index if not exists idx_case_machines_so on case_machines (so_number);
create index if not exists idx_case_machines_machine on case_machines (machine_no);

-- 3. Project code mapping table (machine prefix or customer hint → suggested project)
create table if not exists project_mapping (
  id              bigserial primary key,
  machine_prefix  text,             -- e.g., "MCVP4", "PE9", "AR22SV"
  customer_pattern text,            -- e.g., "ESSILOR", "HOYA"
  project_code    text not null,    -- e.g., "ZEGU99", "ESSA01"
  confidence      integer default 50, -- 0-100, higher = more confident match
  notes           text,
  created_at      timestamptz default now()
);

create index if not exists idx_project_mapping_prefix on project_mapping (machine_prefix);
create index if not exists idx_project_mapping_customer on project_mapping (customer_pattern);

-- 4. Seed common mappings (from analysis of historical cases)
insert into project_mapping (machine_prefix, customer_pattern, project_code, confidence, notes) values
  ('MCVP4',  'LUXOTTICA',  'ZEGU99', 80, 'Luxottica Dongguan MCVP4 machines'),
  ('MCVP4',  'ZEISS',      'ZEGU99', 75, 'Zeiss MCVP4 line'),
  ('PE9',    'ESSILOR LAO', 'ESSA01', 85, 'Essilor Laos PE91/PE92'),
  ('AR22SM', 'ESSILOR',    'CARZE25', 60, 'Essilor SM-series'),
  ('AR22SV', 'ESSILOR MFG INDIA', 'ESFOC97', 80, 'Essilor India SPV3'),
  ('AR22SV', 'EOLT',       'ESFOC98', 75, 'Essilor Thailand Lab'),
  ('AR22SV', 'EMTC',       'ESFOC99', 75, 'Essilor Thailand Mfg'),
  ('AR',     'RODENSTOCK', 'ROTH',   70, 'Rodenstock Thailand'),
  ('AR',     'HOYA',       'HOTH',   70, 'Hoya Thailand'),
  ('AR',     'TRANSITIONS','TRTH',   70, 'Transitions Thailand'),
  (null,     'EOLT',       'ESTH',   55, 'Generic EOLT'),
  (null,     'EMTC',       'ESTH',   55, 'Generic EMTC'),
  (null,     'ESSILORLUXOTTICA', 'ESRY', 65, 'EssilorLuxottica TH')
on conflict do nothing;

-- 5. Grants
grant select, insert, update, delete on case_machines to anon, authenticated;
grant usage, select on sequence case_machines_id_seq to anon, authenticated;
alter table case_machines disable row level security;

grant select, insert, update, delete on project_mapping to anon, authenticated;
grant usage, select on sequence project_mapping_id_seq to anon, authenticated;
alter table project_mapping disable row level security;

-- 6. Verify
select
  (select count(*) from project_mapping) as project_mappings_seeded,
  (select column_name from information_schema.columns where table_name='cases' and column_name='sr_number') as has_sr_number,
  (select column_name from information_schema.columns where table_name='cases' and column_name='project_code') as has_project_code;
