"use server";

import { createServiceClient } from "@/lib/supabase/service";
import { parsePlannerNote } from "@/lib/planner/parser";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

export interface NewCaseInput {
  title: string;
  service_type_code: string;
  service_mode: string;
  customer_code: string;
  customer_name: string;
  contact_name?: string;
  machine_no?: string;
  due_date?: string;
  customer_po?: string;
  engineer_codes: string[];
  lead_engineer?: string;
  initial_notes?: string;
  planner_note?: string;
  auto_parse_sessions?: boolean;
}

const SERVICE_TYPE_NAMES: Record<string, string> = {
  "7505": "Curative maintenance",
  "7507": "Preventive Maintenance",
  "7515": "Curative under warranty",
  "7504": "Installation",
  "7508": "Service Agreement",
  "7512": "Service Agreement",
  "7235": "Voucher",
  "7506": "Upgrade installation",
};

async function generateAroetSoNumber(supabase: ReturnType<typeof createServiceClient>): Promise<string> {
  const now = new Date();
  const yymm = `${(now.getFullYear() % 100).toString().padStart(2, "0")}${(now.getMonth() + 1).toString().padStart(2, "0")}`;
  const prefix = `SO${yymm}-AR-`;

  const { data } = await supabase
    .from("cases")
    .select("so_number")
    .like("so_number", `${prefix}%`)
    .order("so_number", { ascending: false })
    .limit(1);

  let nextNum = 1;
  if (data && data.length > 0) {
    const last = data[0].so_number;
    const lastNum = parseInt(last.split("-").pop() || "0");
    nextNum = lastNum + 1;
  }

  return `${prefix}${nextNum.toString().padStart(3, "0")}`;
}

export async function createCase(input: NewCaseInput) {
  const supabase = createServiceClient();

  const so_number = await generateAroetSoNumber(supabase);

  const { error: caseError } = await supabase.from("cases").insert({
    so_number,
    source: "aroet",
    status: "planned",
    service_type_code: input.service_type_code,
    service_type_name: SERVICE_TYPE_NAMES[input.service_type_code] || input.service_type_code,
    service_mode: input.service_mode,
    customer_code: input.customer_code,
    customer_name: input.customer_name,
    contact_name: input.contact_name || null,
    machine_no: input.machine_no || null,
    due_date: input.due_date || null,
    customer_po: input.customer_po || null,
    title: input.title,
    planner_note: input.planner_note || null,
    summary: input.initial_notes || null,
  });

  if (caseError) {
    console.error("Case insert error:", caseError);
    throw new Error(`Failed to create case: ${caseError.message}`);
  }

  // Assign engineers
  if (input.engineer_codes.length > 0) {
    const engineerRows = input.engineer_codes.map((code) => ({
      so_number,
      engineer_code: code,
      is_lead: code === input.lead_engineer,
    }));

    const { error: engError } = await supabase.from("case_engineers").insert(engineerRows);
    if (engError) console.error("Engineer assignment error:", engError);
  }

  // Parse sessions from planner_note if enabled
  if (input.auto_parse_sessions && input.planner_note) {
    const parsed = parsePlannerNote(input.planner_note);

    if (parsed.sessions.length > 0) {
      const sessionRows = parsed.sessions.map((s) => ({
        so_number,
        machine_no: input.machine_no,
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

      await supabase.from("sessions").insert(sessionRows);
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
      await supabase.from("case_references").insert(refRows);
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
      await supabase.from("admin_log").insert(logRows);
    }
  }

  revalidatePath("/cases");
  redirect(`/cases/${so_number}`);
}

// Helper for the New Case form — preview parsing without saving
export async function previewParse(plannerNote: string) {
  return parsePlannerNote(plannerNote);
}
