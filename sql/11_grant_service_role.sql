-- Phase 5: grant the service_role full access to every public table
--
-- Background:
--   sql/01..10 only granted SELECT/INSERT/UPDATE/DELETE to `anon` and
--   `authenticated`. Supabase's `service_role` bypasses RLS, but it
--   still respects table-level GRANTs. New tables (case_machines,
--   project_mapping, customer_contacts, session_approval_log, etc.)
--   never received an explicit grant for service_role, so server
--   actions calling createServiceClient() got "permission denied for
--   table ..." on INSERT/UPDATE/DELETE.
--
-- This migration fixes that once and for all: grant service_role
-- everything on every public table + sequence, and bake in default
-- privileges so future tables inherit the right grants.
--
-- Re-runnable: grants are idempotent.

do $$
declare
  r record;
begin
  -- Tables
  for r in
    select schemaname, tablename
    from pg_tables
    where schemaname = 'public'
  loop
    execute format(
      'grant select, insert, update, delete on %I.%I to service_role',
      r.schemaname, r.tablename
    );
  end loop;

  -- Sequences (so service_role can read nextval/currval for inserts)
  for r in
    select schemaname, sequencename
    from pg_sequences
    where schemaname = 'public'
  loop
    execute format(
      'grant usage, select on sequence %I.%I to service_role',
      r.schemaname, r.sequencename
    );
  end loop;
end $$;

-- Future-proof: any new table in public will auto-grant to service_role.
alter default privileges in schema public
  grant select, insert, update, delete on tables to service_role;
alter default privileges in schema public
  grant usage, select on sequences to service_role;
