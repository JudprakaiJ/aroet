"use server";

import { createServiceClient } from "@/lib/supabase/service";
import { revalidatePath } from "next/cache";
import { meCode } from "@/lib/auth/current-user";

export interface AddSessionInput {
  so_number: string;
  machine_no?: string | null;
  /** Defaults to the signed-in engineer when omitted. */
  engineer_code?: string;
  session_date: string;
  activity_type: string;
  start_minutes: number;
  end_minutes: number;
  break_minutes: number;
  work_done?: string;
  submit_immediately?: boolean;
}

export async function addSession(
  input: AddSessionInput
): Promise<{ success: boolean; id?: number; error?: string }> {
  const supabase = createServiceClient();
  const engineerCode = input.engineer_code ?? (await meCode());

  if (!engineerCode) return { success: false, error: "Engineer required" };
  if (!input.session_date) return { success: false, error: "Date required" };

  const duration = input.end_minutes - input.start_minutes - input.break_minutes;
  if (duration <= 0) return { success: false, error: "Invalid duration" };

  // Map activity → travel/work/office minutes
  let travel = 0,
    work = 0,
    office = 0;
  if (input.activity_type === "travel") travel = duration;
  else if (input.activity_type === "office") office = duration;
  else work = duration;  // field, remote, training, upgrade all count as work

  // Check weekend
  const d = new Date(input.session_date);
  const isWeekend = d.getDay() === 0 || d.getDay() === 6;

  const insertRow: any = {
    so_number: input.so_number,
    machine_no: input.machine_no || null,
    engineer_code: engineerCode,
    session_date: input.session_date,
    travel_minutes: travel,
    work_minutes: work,
    office_minutes: office,
    break_minutes: input.break_minutes,
    activity_type: input.activity_type,
    is_weekend: isWeekend,
    is_holiday: false,
    work_done: input.work_done?.trim() || null,
    source: "manual",
    approval_status: input.submit_immediately ? "submitted" : "draft",
  };

  const { data, error } = await supabase.from("sessions").insert(insertRow).select("id").single();
  if (error) return { success: false, error: error.message };

  // Log if submitted
  if (input.submit_immediately && data?.id) {
    await supabase.from("session_approval_log").insert({
      session_id: data.id,
      action: "submitted",
      notes: null,
    });
  }

  revalidatePath(`/cases/${input.so_number}`);
  revalidatePath("/workforce/queue");
  revalidatePath("/workforce");
  return { success: true, id: data?.id };
}

export async function updateSession(
  id: number,
  so_number: string,
  input: Partial<AddSessionInput>
): Promise<{ success: boolean; error?: string }> {
  const supabase = createServiceClient();

  // Build update from partial
  const updates: any = {};
  if (input.engineer_code) updates.engineer_code = input.engineer_code;
  if (input.session_date) updates.session_date = input.session_date;
  if (input.machine_no !== undefined) updates.machine_no = input.machine_no || null;
  if (input.work_done !== undefined) updates.work_done = input.work_done?.trim() || null;
  if (input.break_minutes !== undefined) updates.break_minutes = input.break_minutes;

  if (
    input.activity_type !== undefined &&
    input.start_minutes !== undefined &&
    input.end_minutes !== undefined &&
    input.break_minutes !== undefined
  ) {
    const duration = input.end_minutes - input.start_minutes - input.break_minutes;
    if (duration <= 0) return { success: false, error: "Invalid duration" };
    updates.travel_minutes = 0;
    updates.work_minutes = 0;
    updates.office_minutes = 0;
    if (input.activity_type === "travel") updates.travel_minutes = duration;
    else if (input.activity_type === "office") updates.office_minutes = duration;
    else updates.work_minutes = duration;
    updates.activity_type = input.activity_type;
  }

  const { error } = await supabase.from("sessions").update(updates).eq("id", id);
  if (error) return { success: false, error: error.message };

  revalidatePath(`/cases/${so_number}`);
  return { success: true };
}

export async function deleteSession(
  id: number,
  so_number: string
): Promise<{ success: boolean; error?: string }> {
  const supabase = createServiceClient();

  // Check status — don't allow deleting approved sessions
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

  revalidatePath(`/cases/${so_number}`);
  revalidatePath("/workforce/queue");
  return { success: true };
}
