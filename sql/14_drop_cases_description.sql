-- Phase 6f: drop cases.description
--
-- After phase 5P the new-case form merged Title + Description into a single
-- "Subject" field, and createCase wrote the same text into both columns
-- temporarily for backwards compatibility. Nothing reads the description
-- column any more (verified across cases queries, refs tab, edit sheet, and
-- bulk reparse), so it's safe to remove.
--
-- Run AFTER deploying the code change that stops SELECTing the column
-- (otherwise old server instances would 500 on case detail loads).
-- Re-runnable.

alter table cases drop column if exists description;
