"use server";

import { createServiceClient } from "@/lib/supabase/service";
import { parsePlannerNote } from "@/lib/planner/parser";
import { revalidatePath } from "next/cache";

export interface BatchResult {
  batchStart: number;
  batchEnd: number;
  total: number;
  processed: number;
  sessions: number;
  references: number;
  admin_log: number;
  errors: { so_number: string; error: string }[];
  hasMore: boolean;
}

export interface BulkResult {
  total: number;
  processed: number;
  sessions: number;
  references: number;
  admin_log: number;
  errors: { so_number: string; error: string }[];
}

const BATCH_SIZE = 25;

/**
 * Process ONE batch. Client calls repeatedly with increasing batchStart.
 */
export async function bulkReparseBatch(
  batchStart: number,
  options: { onlyEmpty?: boolean } = {}
): Promise<BatchResult> {
  const supabase = createServiceClient();

  const query = supabase
    .from("cases")
    .select("so_number, planner_note, machine_no")
    .not("planner_note", "is", null)
    .neq("planner_note", "")
    .order("so_number");

  const { data: cases, error } = await query;
  if (error) throw new Error(error.message);

  let toProcess = cases ?? [];

  if (options.onlyEmpty) {
    const { data: counts } = await supabase
      .from("sessions")
      .select("so_number")
      .in("so_number", toProcess.map((c) => c.so_number));
    const hasSessions = new Set((counts ?? []).map((s: any) => s.so_number));
    toProcess = toProcess.filter((c) => !hasSessions.has(c.so_number));
  }

  const total = toProcess.length;
  const batch = toProcess.slice(batchStart, batchStart + BATCH_SIZE);
  const batchEnd = batchStart + batch.length;

  if (batch.length === 0) {
    return {
      batchStart, batchEnd, total,
      processed: 0, sessions: 0, references: 0, admin_log: 0,
      errors: [], hasMore: false,
    };
  }

  // 1. Bulk delete planner data for all SOs in batch (3 queries total, not 3×N)
  const soList = batch.map((c) => c.so_number);
  await Promise.all([
    supabase.from("sessions").delete().in("so_number", soList).eq("source", "planner"),
    supabase.from("case_references").delete().in("so_number", soList).eq("source", "planner"),
    supabase.from("admin_log").delete().in("so_number", soList).eq("source", "planner"),
  ]);

  // 2. Parse all (CPU work, fast)
  const sessionRows: any[] = [];
  const refRows: any[] = [];
  const logRows: any[] = [];
  const errors: { so_number: string; error: string }[] = [];
  let processed = 0;

  for (const c of batch) {
    try {
      if (!c.planner_note) continue;
      const parsed = parsePlannerNote(c.planner_note);

      for (const s of parsed.sessions) {
        sessionRows.push({
          so_number: c.so_number,
          machine_no: c.machine_no,
          engineer_code: s.engineer_code,
          session_date: s.date,
          travel_minutes: s.travel_minutes,
          break_minutes: s.break_minutes,
          work_minutes: s.work_minutes,
          office_minutes: s.office_minutes,
          activity_type: s.activity_type,
          is_weekend: s.is_weekend,
          is_holiday: s.is_holiday,
          switched_to_so: s.switched_to_so || null,
          parse_warning: s.parse_warning || null,
          work_done: s.work_done,
          source: "planner",
          raw_line: s.raw_line,
        });
      }

      for (const r of parsed.references) {
        refRows.push({
          so_number: c.so_number,
          type: r.type,
          reference_no: r.reference_no,
          description: r.description || null,
          status: r.status || null,
          source: "planner",
        });
      }

      for (const l of parsed.admin_log) {
        logRows.push({
          so_number: c.so_number,
          event_type: l.event_type,
          description: l.description,
          event_date: l.event_date || null,
          by_engineer: l.by_engineer || null,
          source: "planner",
        });
      }
      processed++;
    } catch (e) {
      errors.push({ so_number: c.so_number, error: (e as Error).message });
    }
  }

  // 3. Bulk insert in parallel — 3 inserts for whole batch
  const inserts: Promise<any>[] = [];
  if (sessionRows.length > 0) inserts.push(Promise.resolve(supabase.from("sessions").insert(sessionRows)));
  if (refRows.length > 0) inserts.push(Promise.resolve(supabase.from("case_references").insert(refRows)));
  if (logRows.length > 0) inserts.push(Promise.resolve(supabase.from("admin_log").insert(logRows)));

  const results = await Promise.all(inserts);
  for (const r of results) {
    if (r.error) errors.push({ so_number: "_batch_", error: r.error.message });
  }

  const hasMore = batchEnd < total;
  if (!hasMore) revalidatePath("/cases");

  return {
    batchStart, batchEnd, total, processed,
    sessions: sessionRows.length,
    references: refRows.length,
    admin_log: logRows.length,
    errors, hasMore,
  };
}

export async function getReparseCounts() {
  const supabase = createServiceClient();

  const { data: cases } = await supabase
    .from("cases")
    .select("so_number, planner_note")
    .not("planner_note", "is", null)
    .neq("planner_note", "");

  const allWithNote = cases?.length ?? 0;

  const { data: sessions } = await supabase
    .from("sessions")
    .select("so_number")
    .eq("source", "planner");
  const hasSessions = new Set((sessions ?? []).map((s: any) => s.so_number));

  const noSessionsCount = (cases ?? []).filter((c) => !hasSessions.has(c.so_number)).length;

  return {
    totalWithPlannerNote: allWithNote,
    withoutSessions: noSessionsCount,
    withSessions: allWithNote - noSessionsCount,
  };
}

/** Legacy compat — calls batches sequentially server-side (still risks timeout for large jobs). */
export async function bulkReparse(options: { onlyEmpty?: boolean; dryRun?: boolean } = {}): Promise<BulkResult> {
  if (options.dryRun) {
    const supabase = createServiceClient();
    const { data: cases } = await supabase
      .from("cases").select("so_number")
      .not("planner_note", "is", null).neq("planner_note", "");
    return {
      total: cases?.length ?? 0,
      processed: 0, sessions: 0, references: 0, admin_log: 0, errors: [],
    };
  }

  const total: BulkResult = {
    total: 0, processed: 0, sessions: 0, references: 0, admin_log: 0, errors: [],
  };
  let start = 0;
  while (true) {
    const b = await bulkReparseBatch(start, options);
    total.total = b.total;
    total.processed += b.processed;
    total.sessions += b.sessions;
    total.references += b.references;
    total.admin_log += b.admin_log;
    total.errors.push(...b.errors);
    if (!b.hasMore) break;
    start = b.batchEnd;
  }
  return total;
}
