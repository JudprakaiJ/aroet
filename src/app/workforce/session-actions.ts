"use server";

import { createServiceClient } from "@/lib/supabase/service";
import { revalidatePath } from "next/cache";
import { typeCodeFor } from "@/lib/clock/types";

const ME = "JKH";

export type SessionPatch = {
  session_date?: string;
  so_number?: string | null;
  activity_type?: string;
  travel_minutes?: number;
  work_minutes?: number;
  office_minutes?: number;
  break_minutes?: number;
  work_done?: string | null;
};

export type ManualSessionInput = {
  engineer_code?: string;
  session_date: string;
  so_number?: string | null;
  activity_type: string;
  travel_minutes?: number;
  work_minutes?: number;
  office_minutes?: number;
  break_minutes?: number;
  work_done?: string | null;
};

function clampMin(v: number | undefined): number {
  if (!v || v < 0) return 0;
  return Math.round(v);
}

function isWeekendOf(iso: string): boolean {
  const d = new Date(iso);
  const day = d.getDay();
  return day === 0 || day === 6;
}

export async function updateSession(
  id: number,
  patch: SessionPatch
): Promise<{ success: boolean; error?: string }> {
  const supabase = createServiceClient();

  const { data: existing, error: readErr } = await supabase
    .from("sessions")
    .select("approval_status, so_number")
    .eq("id", id)
    .maybeSingle();
  if (readErr) return { success: false, error: readErr.message };
  if (!existing) return { success: false, error: "Session not found" };
  if (existing.approval_status === "approved") {
    return { success: false, error: "Session is approved — locked. Ask admin to reopen." };
  }

  const updates: Record<string, unknown> = {};
  if (patch.session_date !== undefined) {
    updates.session_date = patch.session_date;
    updates.is_weekend = isWeekendOf(patch.session_date);
  }
  if (patch.so_number !== undefined) updates.so_number = patch.so_number || null;
  if (patch.activity_type !== undefined) {
    updates.activity_type = patch.activity_type;
    updates.type_code = typeCodeFor(patch.activity_type);
  }
  if (patch.travel_minutes !== undefined) updates.travel_minutes = clampMin(patch.travel_minutes);
  if (patch.work_minutes !== undefined) updates.work_minutes = clampMin(patch.work_minutes);
  if (patch.office_minutes !== undefined) updates.office_minutes = clampMin(patch.office_minutes);
  if (patch.break_minutes !== undefined) updates.break_minutes = clampMin(patch.break_minutes);
  if (patch.work_done !== undefined) updates.work_done = patch.work_done?.trim() || null;

  // Move submitted edits back to draft for re-approval
  if (existing.approval_status === "submitted") {
    updates.approval_status = "draft";
  }

  if (Object.keys(updates).length === 0) return { success: true };

  const { error } = await supabase.from("sessions").update(updates).eq("id", id);
  if (error) return { success: false, error: error.message };

  revalidatePath("/workforce");
  revalidatePath("/planning");
  if (existing.so_number) revalidatePath(`/cases/${existing.so_number}`);
  if (patch.so_number && patch.so_number !== existing.so_number) {
    revalidatePath(`/cases/${patch.so_number}`);
  }
  return { success: true };
}

export async function createManualSession(
  input: ManualSessionInput
): Promise<{ success: boolean; id?: number; error?: string }> {
  const supabase = createServiceClient();

  if (!input.session_date) return { success: false, error: "Date required" };
  if (!input.activity_type) return { success: false, error: "Activity required" };

  const row = {
    engineer_code: input.engineer_code ?? ME,
    session_date: input.session_date,
    so_number: input.so_number || null,
    machine_no: null,
    activity_type: input.activity_type,
    type_code: typeCodeFor(input.activity_type),
    travel_minutes: clampMin(input.travel_minutes),
    work_minutes: clampMin(input.work_minutes),
    office_minutes: clampMin(input.office_minutes),
    break_minutes: clampMin(input.break_minutes),
    is_weekend: isWeekendOf(input.session_date),
    is_holiday: false,
    work_done: input.work_done?.trim() || null,
    source: "manual",
    approval_status: "draft",
  };

  const { data, error } = await supabase
    .from("sessions")
    .insert(row)
    .select("id")
    .single();
  if (error) {
    if (error.message.includes("foreign key") || error.message.includes("so_number")) {
      return { success: false, error: "Unknown SO — leave blank for office time or pick a valid case." };
    }
    return { success: false, error: error.message };
  }

  revalidatePath("/workforce");
  revalidatePath("/planning");
  if (row.so_number) revalidatePath(`/cases/${row.so_number}`);
  return { success: true, id: data?.id };
}

export async function deleteSession(
  id: number
): Promise<{ success: boolean; error?: string }> {
  const supabase = createServiceClient();

  const { data: existing } = await supabase
    .from("sessions")
    .select("approval_status, so_number")
    .eq("id", id)
    .maybeSingle();
  if (!existing) return { success: false, error: "Session not found" };
  if (existing.approval_status === "approved") {
    return { success: false, error: "Session is approved — locked." };
  }

  await supabase.from("session_approval_log").delete().eq("session_id", id);
  const { error } = await supabase.from("sessions").delete().eq("id", id);
  if (error) return { success: false, error: error.message };

  revalidatePath("/workforce");
  revalidatePath("/planning");
  if (existing.so_number) revalidatePath(`/cases/${existing.so_number}`);
  return { success: true };
}
