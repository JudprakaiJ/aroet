-- =============================================================================
-- AROET Fix 9 — Customer contacts junction + machine extra fields
-- Run AFTER 05_new_case_workflow.sql
-- =============================================================================

-- 1. customer_contacts (junction)
create table if not exists customer_contacts (
  id            bigserial primary key,
  customer_code text not null references customers(code) on delete cascade,
  name          text not null,
  role          text,                       -- e.g. "Technical Manager", "Procurement", "Finance"
  phone         text,
  email         text,
  is_primary    boolean default false,
  notes         text,
  created_at    timestamptz default now(),
  updated_at    timestamptz default now()
);

create index if not exists idx_customer_contacts_customer on customer_contacts (customer_code);
create index if not exists idx_customer_contacts_primary on customer_contacts (customer_code, is_primary) where is_primary = true;

-- 2. Add address to customers (if not exists)
alter table customers add column if not exists address text;
alter table customers add column if not exists notes text;

-- 3. Add extra fields to machines
alter table machines add column if not exists warranty_expiry date;
alter table machines add column if not exists installation_date date;
alter table machines add column if not exists notes text;

-- 4. Grants
grant select, insert, update, delete on customer_contacts to anon, authenticated;
grant usage, select on sequence customer_contacts_id_seq to anon, authenticated;
alter table customer_contacts disable row level security;

-- 5. Verify
select
  (select column_name from information_schema.columns where table_name='customers' and column_name='address') as has_address,
  (select column_name from information_schema.columns where table_name='machines' and column_name='warranty_expiry') as has_warranty,
  (select column_name from information_schema.columns where table_name='machines' and column_name='installation_date') as has_install_date,
  (select column_name from information_schema.columns where table_name='customer_contacts' and column_name='customer_code') as customer_contacts_ready;
