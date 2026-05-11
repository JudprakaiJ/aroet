-- =============================================================================
-- AROET Phase 1 — Schema Migration
-- Run this in Supabase SQL Editor
-- Safe to re-run (uses IF NOT EXISTS / DROP IF EXISTS where applicable)
-- =============================================================================

-- =============================================================================
-- 1. SESSIONS — add columns for parser v5
-- =============================================================================
alter table sessions add column if not exists source text default 'manual'
  check (source in ('manual', 'planner'));

alter table sessions add column if not exists break_minutes int default 0;
alter table sessions add column if not exists work_minutes int;
alter table sessions add column if not exists office_minutes int default 0;
alter table sessions add column if not exists activity_type text default 'field'
  check (activity_type in ('field', 'travel', 'remote', 'training', 'upgrade', 'office'));

alter table sessions add column if not exists is_holiday boolean default false;
alter table sessions add column if not exists is_weekend boolean default false;
alter table sessions add column if not exists switched_to_so text;
alter table sessions add column if not exists parse_warning text;
alter table sessions add column if not exists raw_line text;

-- Migrate normal_minutes -> work_minutes (if normal_minutes existed)
do $$
begin
  if exists (
    select 1 from information_schema.columns
    where table_name = 'sessions' and column_name = 'normal_minutes'
  ) then
    update sessions set work_minutes = normal_minutes where work_minutes is null;
  end if;
end $$;

-- Drop ot_minutes (per discussion — AR= is "office time" not OT)
-- Keep for backward compat for now, but mark deprecated. Uncomment if want hard drop:
-- alter table sessions drop column if exists ot_minutes;

-- Backfill weekend flag based on session_date
update sessions
set is_weekend = extract(dow from session_date) in (0, 6)
where is_weekend = false;

-- =============================================================================
-- 2. CASE REFERENCES — track GI/CS/Invoice/Quote numbers
-- =============================================================================
create table if not exists case_references (
  id              bigserial primary key,
  so_number       text not null references cases(so_number) on delete cascade,
  type            text not null check (type in ('CS', 'GI', 'GT', 'INVOICE', 'QUOTE', 'SHIPMENT', 'OTHER')),
  reference_no    text not null,
  description     text,
  status          text,                 -- free text: 'shipped', 'received', 'at ARBE', etc.
  source          text default 'planner' check (source in ('planner', 'manual')),
  recorded_by     text references engineers(code),
  recorded_at     timestamptz default now()
);

create index if not exists idx_case_references_so on case_references(so_number);
create index if not exists idx_case_references_type on case_references(type);

-- =============================================================================
-- 3. ADMIN LOG — non-session events (invoice sent, RS done, etc.)
-- =============================================================================
create table if not exists admin_log (
  id              bigserial primary key,
  so_number       text not null references cases(so_number) on delete cascade,
  event_type      text not null check (event_type in (
    'invoice_sent', 'acceptance_signed', 'acceptance_pending',
    'rs_report_done', 'service_report_done', 'is_done',
    'post_mail', 'case_closed', 'waiting_parts',
    'meeting', 'phone_call', 'other'
  )),
  description     text,
  event_date      date,
  by_engineer     text references engineers(code),
  source          text default 'planner' check (source in ('planner', 'manual')),
  recorded_at     timestamptz default now()
);

create index if not exists idx_admin_log_so on admin_log(so_number);
create index if not exists idx_admin_log_type on admin_log(event_type);

-- =============================================================================
-- 4. CHECKLIST TEMPLATES (Phase 2 PM Execution UI will use these)
-- =============================================================================
create table if not exists checklist_templates (
  id              bigserial primary key,
  machine_type    text not null,        -- 'MCVP4', 'SPV3', 'DLM', etc.
  version         text,                  -- 'V1', 'V2', 'V3', or null
  name            text not null,
  description     text,
  source          text default 'A&R Official',
  is_active       boolean default true,
  created_at      timestamptz default now(),
  updated_at      timestamptz default now()
);

create unique index if not exists idx_checklist_template_unique
  on checklist_templates(machine_type, coalesce(version, ''));

create table if not exists checklist_sections (
  id              bigserial primary key,
  template_id     bigint not null references checklist_templates(id) on delete cascade,
  section_no      text not null,           -- '1', '2', '3', etc.
  title           text not null,
  display_order   int not null default 0
);

create index if not exists idx_checklist_sections_template on checklist_sections(template_id);

create table if not exists checklist_items (
  id              bigserial primary key,
  section_id      bigint not null references checklist_sections(id) on delete cascade,
  item_no         text not null,           -- '1.1', '1.2', etc.
  text            text not null,
  expected_value  text,                    -- 'pass/fail' or '8 Nm' for calibration
  is_critical     boolean default false,
  display_order   int not null default 0
);

create index if not exists idx_checklist_items_section on checklist_items(section_id);

-- =============================================================================
-- 5. CASE CHECKLISTS (executions — Phase 2 UI)
-- =============================================================================
create table if not exists case_checklists (
  id              bigserial primary key,
  so_number       text not null references cases(so_number) on delete cascade,
  machine_no      text references machines(machine_no),
  template_id     bigint references checklist_templates(id),
  performed_by    text references engineers(code),
  performed_at    date,
  completed_at    timestamptz,
  status          text default 'in_progress' check (status in ('in_progress', 'completed', 'canceled')),
  general_remark  text
);

create index if not exists idx_case_checklists_so on case_checklists(so_number);

create table if not exists case_checklist_item_results (
  id              bigserial primary key,
  case_checklist_id bigint not null references case_checklists(id) on delete cascade,
  item_id         bigint not null references checklist_items(id),
  status          text check (status in ('pass', 'fail', 'na')),
  actual_value    text,
  remark          text,
  updated_at      timestamptz default now()
);

create unique index if not exists idx_checklist_item_result_unique
  on case_checklist_item_results(case_checklist_id, item_id);

create table if not exists case_checklist_section_results (
  id              bigserial primary key,
  case_checklist_id bigint not null references case_checklists(id) on delete cascade,
  section_id      bigint not null references checklist_sections(id),
  remark          text,
  updated_at      timestamptz default now()
);

create unique index if not exists idx_checklist_section_result_unique
  on case_checklist_section_results(case_checklist_id, section_id);

create table if not exists case_checklist_parts (
  id              bigserial primary key,
  case_checklist_id bigint not null references case_checklists(id) on delete cascade,
  section_id      bigint references checklist_sections(id),
  category        text not null check (category in ('replaced', 'needed')),
  part_no         text,
  part_name       text not null,
  quantity        int default 1,
  source          text check (source in ('ar_kit', 'customer', 'other')),
  source_other    text,                    -- if source='other', free text
  remark          text
);

create index if not exists idx_checklist_parts_case on case_checklist_parts(case_checklist_id);

create table if not exists case_checklist_photos (
  id              bigserial primary key,
  case_checklist_id bigint not null references case_checklists(id) on delete cascade,
  section_id      bigint references checklist_sections(id),
  storage_path    text not null,
  caption         text,
  include_in_report boolean default false,
  uploaded_by     text references engineers(code),
  uploaded_at     timestamptz default now()
);

create index if not exists idx_checklist_photos_case on case_checklist_photos(case_checklist_id);

-- =============================================================================
-- 6. GRANT PERMISSIONS
-- =============================================================================
grant select, insert, update, delete on case_references to anon, authenticated;
grant select, insert, update, delete on admin_log to anon, authenticated;
grant select on checklist_templates to anon, authenticated;
grant select on checklist_sections to anon, authenticated;
grant select on checklist_items to anon, authenticated;
grant select, insert, update, delete on case_checklists to anon, authenticated;
grant select, insert, update, delete on case_checklist_item_results to anon, authenticated;
grant select, insert, update, delete on case_checklist_section_results to anon, authenticated;
grant select, insert, update, delete on case_checklist_parts to anon, authenticated;
grant select, insert, update, delete on case_checklist_photos to anon, authenticated;

grant usage, select on sequence case_references_id_seq to anon, authenticated;
grant usage, select on sequence admin_log_id_seq to anon, authenticated;
grant usage, select on sequence case_checklists_id_seq to anon, authenticated;
grant usage, select on sequence case_checklist_item_results_id_seq to anon, authenticated;
grant usage, select on sequence case_checklist_section_results_id_seq to anon, authenticated;
grant usage, select on sequence case_checklist_parts_id_seq to anon, authenticated;
grant usage, select on sequence case_checklist_photos_id_seq to anon, authenticated;

-- =============================================================================
-- 7. RLS — disable for now (Phase 1: internal tool)
-- =============================================================================
alter table case_references disable row level security;
alter table admin_log disable row level security;
alter table checklist_templates disable row level security;
alter table checklist_sections disable row level security;
alter table checklist_items disable row level security;
alter table case_checklists disable row level security;
alter table case_checklist_item_results disable row level security;
alter table case_checklist_section_results disable row level security;
alter table case_checklist_parts disable row level security;
alter table case_checklist_photos disable row level security;

-- Done
select 'Migration complete' as status;
