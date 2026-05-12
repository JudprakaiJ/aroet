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

  // 3. Detect shared sessions (same engineer + date + raw_line across multiple SOs)
  // Group by (engineer + date + raw_line) → find dups within batch
  const sessionKey = (r: any) => `${r.engineer_code}|${r.session_date}|${r.raw_line || ""}`;
  const sharedMap = new Map<string, string[]>(); // key → list of SO numbers
  for (const r of sessionRows) {
    const k = sessionKey(r);
    if (!sharedMap.has(k)) sharedMap.set(k, []);
    sharedMap.get(k)!.push(r.so_number);
  }

  // Also check existing DB rows (for cross-batch sharing)
  // Get all session keys we need to look up
  const checkKeys = sessionRows.map(sessionKey);
  if (checkKeys.length > 0) {
    // Find any existing sessions with same engineer+date+raw_line that we kept (not in soList for delete)
    // Note: we already deleted source='planner' sessions for these soList, so anything matching
    // must be from a DIFFERENT SO not in this batch.
    const engineerDates = Array.from(new Set(sessionRows.map((r) => `${r.engineer_code}|${r.session_date}`)));
    const orFilters = engineerDates.map((ed) => {
      const [eng, date] = ed.split("|");
      return `and(engineer_code.eq.${eng},session_date.eq.${date})`;
    });
    if (orFilters.length > 0) {
      // Query in chunks to avoid URL length limits
      const chunkSize = 50;
      for (let i = 0; i < orFilters.length; i += chunkSize) {
        const chunk = orFilters.slice(i, i + chunkSize).join(",");
        const { data: existing } = await supabase
          .from("sessions")
          .select("so_number, engineer_code, session_date, raw_line")
          .eq("source", "planner")
          .or(chunk);
        if (existing) {
          for (const e of existing) {
            // Skip sessions we're about to insert (their SOs are in soList — already deleted)
            if (soList.includes(e.so_number)) continue;
            const k = `${e.engineer_code}|${e.session_date}|${e.raw_line || ""}`;
            if (sharedMap.has(k)) {
              sharedMap.get(k)!.push(e.so_number);
            }
          }
        }
      }
    }
  }

  // Apply shared flag to rows we're about to insert
  for (const r of sessionRows) {
    const k = sessionKey(r);
    const allSOs = sharedMap.get(k) || [];
    if (allSOs.length > 1) {
      r.is_shared = true;
      r.shared_with_so = allSOs.filter((so) => so !== r.so_number);
    } else {
      r.is_shared = false;
      r.shared_with_so = [];
    }
  }

  // Also need to UPDATE existing rows that became shared due to a new SO joining
  // (their shared_with_so list needs the new SO added)
  const updatePromises: Promise<any>[] = [];
  for (const [k, allSOs] of sharedMap.entries()) {
    if (allSOs.length < 2) continue;
    const [eng, date, rawLine] = k.split("|");
    const existingSOs = allSOs.filter((so) => !soList.includes(so));
    if (existingSOs.length === 0) continue;
    // For each existing SO, update is_shared + shared_with_so
    for (const existingSO of existingSOs) {
      updatePromises.push(
        Promise.resolve(
          supabase
            .from("sessions")
            .update({
              is_shared: true,
              shared_with_so: allSOs.filter((so) => so !== existingSO),
            })
            .eq("so_number", existingSO)
            .eq("engineer_code", eng)
            .eq("session_date", date)
            .eq("raw_line", rawLine)
        )
      );
    }
  }
  if (updatePromises.length > 0) await Promise.all(updatePromises);

  // 4. Bulk insert in parallel — 3 inserts for whole batch
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
