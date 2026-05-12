"use server";

import { createServiceClient } from "@/lib/supabase/service";
import { parsePlannerNote } from "@/lib/planner/parser";
import { revalidatePath } from "next/cache";

export interface BulkResult {
  total: number;
  processed: number;
  sessions: number;
  references: number;
  admin_log: number;
  errors: { so_number: string; error: string }[];
}

export async function bulkReparse(
  options: { onlyEmpty?: boolean; dryRun?: boolean } = {}
): Promise<BulkResult> {
  const supabase = createServiceClient();

  // Get all cases with planner_note
  let query = supabase
    .from("cases")
    .select("so_number, planner_note, machine_no")
    .not("planner_note", "is", null)
    .neq("planner_note", "");

  const { data: cases, error } = await query;
  if (error) throw new Error(error.message);

  let toProcess = cases ?? [];

  // If onlyEmpty: filter to cases with 0 sessions
  if (options.onlyEmpty) {
    const { data: counts } = await supabase
      .from("sessions")
      .select("so_number")
      .in("so_number", toProcess.map((c) => c.so_number));

    const hasSessions = new Set((counts ?? []).map((s: any) => s.so_number));
    toProcess = toProcess.filter((c) => !hasSessions.has(c.so_number));
  }

  const result: BulkResult = {
    total: toProcess.length,
    processed: 0,
    sessions: 0,
    references: 0,
    admin_log: 0,
    errors: [],
  };

  if (options.dryRun) return result;

  // Process in chunks to avoid memory bloat
  const CHUNK_SIZE = 50;
  for (let i = 0; i < toProcess.length; i += CHUNK_SIZE) {
    const chunk = toProcess.slice(i, i + CHUNK_SIZE);

    for (const c of chunk) {
      try {
        if (!c.planner_note) continue;

        const parsed = parsePlannerNote(c.planner_note);

        // Delete planner-sourced data for this SO
        await Promise.all([
          supabase.from("sessions").delete().eq("so_number", c.so_number).eq("source", "planner"),
          supabase.from("case_references").delete().eq("so_number", c.so_number).eq("source", "planner"),
          supabase.from("admin_log").delete().eq("so_number", c.so_number).eq("source", "planner"),
        ]);

        // Insert sessions
        if (parsed.sessions.length > 0) {
          const rows = parsed.sessions.map((s) => ({
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
          }));
          const { error: sErr } = await supabase.from("sessions").insert(rows);
          if (sErr) {
            result.errors.push({ so_number: c.so_number, error: `Sessions: ${sErr.message}` });
            continue;
          }
          result.sessions += rows.length;
        }

        // Insert references
        if (parsed.references.length > 0) {
          const rows = parsed.references.map((r) => ({
            so_number: c.so_number,
            type: r.type,
            reference_no: r.reference_no,
            description: r.description || null,
            status: r.status || null,
            source: "planner",
          }));
          const { error: rErr } = await supabase.from("case_references").insert(rows);
          if (!rErr) result.references += rows.length;
        }

        // Insert admin log
        if (parsed.admin_log.length > 0) {
          const rows = parsed.admin_log.map((l) => ({
            so_number: c.so_number,
            event_type: l.event_type,
            description: l.description,
            event_date: l.event_date || null,
            by_engineer: l.by_engineer || null,
            source: "planner",
          }));
          const { error: aErr } = await supabase.from("admin_log").insert(rows);
          if (!aErr) result.admin_log += rows.length;
        }

        result.processed++;
      } catch (e) {
        result.errors.push({
          so_number: c.so_number,
          error: (e as Error).message,
        });
      }
    }
  }

  revalidatePath("/cases");
  return result;
}

export async function getReparseCounts() {
  const supabase = createServiceClient();

  const { data: cases } = await supabase
    .from("cases")
    .select("so_number, planner_note")
    .not("planner_note", "is", null)
    .neq("planner_note", "");

  const allWithNote = cases?.length ?? 0;

  const { data: sessions } = await supabase.from("sessions").select("so_number").eq("source", "planner");
  const hasSessions = new Set((sessions ?? []).map((s: any) => s.so_number));

  const noSessionsCount = (cases ?? []).filter((c) => !hasSessions.has(c.so_number)).length;

  return {
    totalWithPlannerNote: allWithNote,
    withoutSessions: noSessionsCount,
    withSessions: allWithNote - noSessionsCount,
  };
}
