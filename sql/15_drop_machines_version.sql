-- Phase 6g: drop machines.version
--
-- Phase 6g consolidated "machine type" onto the existing product_code
-- column — the separate version field added confusion for engineers
-- (V1/V2 was only meaningful for MCVP8, and the V1/V2 distinction is
-- already encoded inside the product code itself, e.g. MCVP8V1 vs
-- MCVP8V2). The PM checklist resolver in src/lib/checklist.ts maps
-- product_code → template directly, so this drop has no impact on
-- which checklist a machine gets.
--
-- Run AFTER deploying the code change that stops SELECTing the column.
-- Re-runnable.

alter table machines drop column if exists version;
