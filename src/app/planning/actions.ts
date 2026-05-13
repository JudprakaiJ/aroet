"use server";

import { createServiceClient } from "@/lib/supabase/service";
import { revalidatePath } from "next/cache";

const LEAVE_TYPES = new Set(["AL", "SICK", "PERS"]);
const NON_WORK_TYPES = new Set(["AL", "SICK", "PERS", "WFH", "OFF"]);

const TYPE_TO_ACTIVITY: Record<string, string> = {
  T: "field",
  V: "field",
  A: "field",
  WFH: "remote",
  OFF: "office",
  PERS: "remote",
  AL: "field",
  SICK: "field",
};

export interface AssignSessionInput {
  engineer_code: string;
  session_date: string;
  type_code: string;
  so_number?: string | null;
  work_done?: string;
  existing_id?: number;
}

export async function assignSession(
  input: AssignSessionInput
): Promise<{ success: boolean; id?: number; error?: string }> {
  const supabase = createServiceClient();

  if (!input.engineer_code) return { success: false, error: "Engineer required" };
  if (!input.session_date) return { success: false, error: "Date required" };
  if (!input.type_code) return { success: false, error: "Type required" };

  const isLeave = LEAVE_TYPES.has(input.type_code);
  const activity = TYPE_TO_ACTIVITY[input.type_code] || "field";

  let travel = 0;
  let work = 0;
  let office = 0;

  if (!NON_WORK_TYPES.has(input.type_code)) {
    work = 480;
  } else if (input.type_code === "WFH") {
    work = 480;
  } else if (input.type_code === "OFF") {
    office = 480;
  }

  const d = new Date(input.session_date);
  const weekend = d.getDay() === 0 || d.getDay() === 6;

  const row: any = {
    so_number: isLeave ? null : input.so_number || null,
    machine_no: null,
    engineer_code: input.engineer_code,
    session_date: input.session_date,
    travel_minutes: travel,
    work_minutes: work,
    office_minutes: office,
    break_minutes: 0,
    activity_type: activity,
    type_code: input.type_code,
    is_weekend: weekend,
    is_holiday: false,
    work_done: input.work_done?.trim() || null,
    source: "planning",
    approval_status: "draft",
  };

  if (input.existing_id) {
    const { error } = await supabase.from("sessions").update(row).eq("id", input.existing_id);
    if (error) return { success: false, error: error.message };
    revalidatePath("/planning");
    return { success: true, id: input.existing_id };
  }

  const { data, error } = await supabase.from("sessions").insert(row).select("id").single();
  if (error) {
    if (error.message.includes("foreign key") || error.message.includes("so_number")) {
      return {
        success: false,
        error: isLeave
          ? "Cannot create leave session — please select a case temporarily (or wait for full leave support)"
          : "Invalid case. Please select a valid SO from dropdown.",
      };
    }
    return { success: false, error: error.message };
  }

  revalidatePath("/planning");
  revalidatePath("/workforce");
  return { success: true, id: data?.id };
}

export async function deleteSessionFromGrid(
  id: number
): Promise<{ success: boolean; error?: string }> {
  const supabase = createServiceClient();

  const { data: existing } = await supabase
    .from("sessions")
    .select("approval_status")
    .eq("id", id)
    .single();
  if (existing?.approval_status === "approved") {
    return { success: false, error: "Cannot delete approved session" };
  }

  await supabase.from("session_approval_log").delete().eq("session_id", id);
  const { error } = await supabase.from("sessions").delete().eq("id", id);
  if (error) return { success: false, error: error.message };

  revalidatePath("/planning");
  revalidatePath("/workforce");
  return { success: true };
}
