-- Phase 6k-4: expand admin_log.event_type CHECK to allow 'engineer_assigned'.
--
-- Lets us write a notification row whenever an admin / PPI assigns an engineer
-- to a case (either at create time or via Edit case sheet). Engineers see this
-- in the Bell notifications panel.
--
-- Idempotent: drops the existing constraint by name if present, recreates it
-- with the extended enum list.

alter table admin_log drop constraint if exists admin_log_event_type_check;

alter table admin_log
  add constraint admin_log_event_type_check
  check (event_type in (
    'invoice_sent', 'acceptance_signed', 'acceptance_pending',
    'rs_report_done', 'service_report_done', 'is_done',
    'post_mail', 'case_closed', 'waiting_parts',
    'meeting', 'phone_call', 'other',
    'engineer_assigned'
  ));
