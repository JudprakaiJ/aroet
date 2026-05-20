"use server";

import { createServiceClient } from "@/lib/supabase/service";
import { parsePlannerNote } from "@/lib/planner/parser";
import { revalidatePath } from "next/cache";

function checkEnv() {
  if (!process.env.NEXT_PUBLIC_SUPABASE_URL) {
    throw new Error("NEXT_PUBLIC_SUPABASE_URL missing from .env.local");
  }
  if (!process.env.SUPABASE_SERVICE_ROLE_KEY) {
    throw new Error(
      "SUPABASE_SERVICE_ROLE_KEY missing from .env.local — get it from Supabase Dashboard → Settings → API → service_role key, then restart dev server"
    );
  }
}

export async function reparseCase(so_number: string) {
  checkEnv();
  const supabase = createServiceClient();

  // Get the case to get planner_note + machine_no
  const { data: caseData, error: caseErr } = await supabase
    .from("cases")
    .select("planner_note, machine_no")
    .eq("so_number", so_number)
    .single();

  if (caseErr) {
    throw new Error(`Case lookup failed (${so_number}): ${caseErr.message} [code: ${caseErr.code}]`);
  }
  if (!caseData) {
    throw new Error(`Case "${so_number}" not found in DB. Verify .env.local SUPABASE_SERVICE_ROLE_KEY matches the project.`);
  }

  if (!caseData.planner_note) {
    throw new Error("No planner note to parse on this case");
  }

  // Delete all planner-sourced data (keep manual)
  await supabase.from("sessions").delete().eq("so_number", so_number).eq("source", "planner");
  await supabase.from("case_references").delete().eq("so_number", so_number).eq("source", "planner");
  await supabase.from("admin_log").delete().eq("so_number", so_number).eq("source", "planner");

  // Re-parse
  const parsed = parsePlannerNote(caseData.planner_note);

  let inserted = { sessions: 0, references: 0, admin_log: 0 };

  if (parsed.sessions.length > 0) {
    const sessionRows = parsed.sessions.map((s) => ({
      so_number,
      machine_no: caseData.machine_no,
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
    const { error } = await supabase.from("sessions").insert(sessionRows);
    if (error) throw new Error(`Insert sessions failed: ${error.message}`);
    inserted.sessions = sessionRows.length;
  }

  if (parsed.references.length > 0) {
    const refRows = parsed.references.map((r) => ({
      so_number,
      type: r.type,
      reference_no: r.reference_no,
      description: r.description || null,
      status: r.status || null,
      source: "planner",
    }));
    const { error } = await supabase.from("case_references").insert(refRows);
    if (!error) inserted.references = refRows.length;
  }

  if (parsed.admin_log.length > 0) {
    const logRows = parsed.admin_log.map((l) => ({
      so_number,
      event_type: l.event_type,
      description: l.description,
      event_date: l.event_date || null,
      by_engineer: l.by_engineer || null,
      source: "planner",
    }));
    const { error } = await supabase.from("admin_log").insert(logRows);
    if (!error) inserted.admin_log = logRows.length;
  }

  revalidatePath(`/cases/${so_number}`);

  return inserted;
}

export async function addManualSession(input: {
  so_number: string;
  machine_no?: string;
  engineer_code: string;
  session_date: string;
  travel_minutes: number;
  break_minutes: number;
  work_minutes: number;
  office_minutes: number;
  activity_type: string;
  work_done: string;
}) {
  checkEnv();
  const supabase = createServiceClient();

  const sessionDate = new Date(input.session_date);
  const day = sessionDate.getDay();

  const { error } = await supabase.from("sessions").insert({
    so_number: input.so_number,
    machine_no: input.machine_no || null,
    engineer_code: input.engineer_code,
    session_date: input.session_date,
    travel_minutes: input.travel_minutes,
    break_minutes: input.break_minutes,
    work_minutes: input.work_minutes,
    office_minutes: input.office_minutes,
    activity_type: input.activity_type,
    is_weekend: day === 0 || day === 6,
    is_holiday: false,
    work_done: input.work_done,
    source: "manual",
  });

  if (error) throw new Error(error.message);

  revalidatePath(`/cases/${input.so_number}`);
}

export async function deleteSession(id: number, so_number: string) {
  checkEnv();
  const supabase = createServiceClient();
  await supabase.from("sessions").delete().eq("id", id);
  revalidatePath(`/cases/${so_number}`);
}

export type CaseStatus = "planned" | "in_progress" | "completed" | "verified" | "canceled";

export async function updateCaseStatus(
  so_number: string,
  status: CaseStatus
): Promise<{ success: boolean; error?: string }> {
  checkEnv();
  const supabase = createServiceClient();
  const { error } = await supabase.from("cases").update({ status }).eq("so_number", so_number);
  if (error) return { success: false, error: error.message };
  revalidatePath(`/cases/${so_number}`);
  revalidatePath("/cases");
  revalidatePath("/");
  return { success: true };
}

const SERVICE_TYPE_NAMES: Record<string, string> = {
  "7505": "Curative maintenance",
  "7504": "Installation",
  "7515": "Curative maintenance under Warranty",
  "7508": "Upgrade installation",
  "7507": "Preventive Maintenance",
  "7512": "Service Agreement",
  "7235": "Service Promotion",
  "7506": "Customer Training",
  "7506-1": "Internal Training",
};

const EDITABLE_STATUSES = new Set<CaseStatus>(["planned", "in_progress"]);

export interface CasePatch {
  title?: string | null;
  description?: string | null;
  customer_code?: string;
  machine_nos?: string[];
  project_code?: string | null;
  service_type_code?: string;
  due_date?: string | null;
  status?: CaseStatus;
}

export async function updateCase(
  so_number: string,
  patch: CasePatch
): Promise<{ success: boolean; error?: string }> {
  checkEnv();
  const supabase = createServiceClient();

  const { data: existing, error: readErr } = await supabase
    .from("cases")
    .select("status, customer_code")
    .eq("so_number", so_number)
    .maybeSingle();
  if (readErr) return { success: false, error: readErr.message };
  if (!existing) return { success: false, error: "Case not found" };
  if (!EDITABLE_STATUSES.has(existing.status as CaseStatus) && patch.status !== existing.status) {
    return {
      success: false,
      error: `Case is ${existing.status}. Reopen it (change status back to planned/in_progress) before editing other fields.`,
    };
  }

  const updates: Record<string, unknown> = {};
  if (patch.title !== undefined) updates.title = patch.title?.trim() || null;
  if (patch.description !== undefined) updates.description = patch.description?.trim() || null;
  if (patch.project_code !== undefined) updates.project_code = patch.project_code?.trim() || null;
  if (patch.due_date !== undefined) updates.due_date = patch.due_date || null;
  if (patch.status !== undefined) updates.status = patch.status;
  if (patch.service_type_code !== undefined) {
    updates.service_type_code = patch.service_type_code;
    updates.service_type_name = SERVICE_TYPE_NAMES[patch.service_type_code] ?? patch.service_type_code;
  }

  if (patch.customer_code && patch.customer_code !== existing.customer_code) {
    const { data: cust } = await supabase
      .from("customers")
      .select("name, contact_name, contact_mobile")
      .eq("code", patch.customer_code)
      .maybeSingle();
    if (!cust) return { success: false, error: "Customer not found" };
    updates.customer_code = patch.customer_code;
    updates.customer_name = cust.name;
    if (cust.contact_name) updates.contact_name = cust.contact_name;
  }

  // Keep legacy cases.machine_no column in sync with the first machine so
  // older queries (reparse, planning grid, dashboard) still work. There is
  // no "primary" concept anymore — engineers treat every machine on a case
  // equally — but the column has to point somewhere until we retire it.
  if (patch.machine_nos !== undefined) {
    updates.machine_no = patch.machine_nos[0] ?? null;
  }

  if (Object.keys(updates).length > 0) {
    const { error } = await supabase.from("cases").update(updates).eq("so_number", so_number);
    if (error) return { success: false, error: error.message };
  }

  // Reconcile case_machines if a new list was provided.
  if (patch.machine_nos) {
    const wantSet = new Set(patch.machine_nos);
    const { data: current } = await supabase
      .from("case_machines")
      .select("machine_no")
      .eq("so_number", so_number);
    const have = new Set(((current ?? []) as { machine_no: string }[]).map((m) => m.machine_no));

    const toAdd = patch.machine_nos.filter((m) => !have.has(m));
    const toRemove = Array.from(have).filter((m) => !wantSet.has(m));

    if (toRemove.length > 0) {
      const { error: delErr } = await supabase
        .from("case_machines")
        .delete()
        .eq("so_number", so_number)
        .in("machine_no", toRemove);
      if (delErr) {
        return { success: false, error: `Couldn't remove machine: ${delErr.message}` };
      }
    }
    if (toAdd.length > 0) {
      const { error: insErr } = await supabase.from("case_machines").insert(
        toAdd.map((m) => ({
          so_number,
          machine_no: m,
          is_primary: false,
        }))
      );
      if (insErr) {
        return {
          success: false,
          error: `Couldn't attach machine: ${insErr.message}. Make sure all selected machines exist in the Machines table.`,
        };
      }
    }
  }

  revalidatePath(`/cases/${so_number}`);
  revalidatePath("/cases");
  revalidatePath("/");
  return { success: true };
}
