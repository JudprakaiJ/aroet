"use server";

import { createServiceClient } from "@/lib/supabase/service";
import { revalidatePath } from "next/cache";

export async function approveSession(id: number): Promise<{ success: boolean; error?: string }> {
  const supabase = createServiceClient();

  const { error } = await supabase
    .from("sessions")
    .update({ approval_status: "approved", approved_at: new Date().toISOString() })
    .eq("id", id);
  if (error) return { success: false, error: error.message };

  // Log
  await supabase.from("session_approval_log").insert({
    session_id: id,
    action: "approved",
    notes: null,
  });

  revalidatePath("/workforce/queue");
  revalidatePath("/workforce");
  return { success: true };
}

export async function returnSession(
  id: number,
  reason?: string
): Promise<{ success: boolean; error?: string }> {
  const supabase = createServiceClient();

  const { error } = await supabase
    .from("sessions")
    .update({ approval_status: "returned" })
    .eq("id", id);
  if (error) return { success: false, error: error.message };

  await supabase.from("session_approval_log").insert({
    session_id: id,
    action: "returned",
    notes: reason || null,
  });

  revalidatePath("/workforce/queue");
  revalidatePath("/workforce");
  return { success: true };
}

export async function bulkApproveSessions(
  ids: number[]
): Promise<{ success: boolean; approved?: number; error?: string }> {
  if (ids.length === 0) return { success: false, error: "No sessions selected" };

  const supabase = createServiceClient();
  const { error } = await supabase
    .from("sessions")
    .update({ approval_status: "approved", approved_at: new Date().toISOString() })
    .in("id", ids);
  if (error) return { success: false, error: error.message };

  // Log all
  const logRows = ids.map((id) => ({ session_id: id, action: "approved", notes: null }));
  await supabase.from("session_approval_log").insert(logRows);

  revalidatePath("/workforce/queue");
  revalidatePath("/workforce");
  return { success: true, approved: ids.length };
}

export async function submitSession(id: number): Promise<{ success: boolean; error?: string }> {
  const supabase = createServiceClient();
  const { error } = await supabase
    .from("sessions")
    .update({ approval_status: "submitted" })
    .eq("id", id);
  if (error) return { success: false, error: error.message };

  await supabase.from("session_approval_log").insert({
    session_id: id,
    action: "submitted",
    notes: null,
  });

  revalidatePath("/workforce/queue");
  revalidatePath("/workforce");
  return { success: true };
}

/**
 * Detect overlapping sessions for same engineer on same date.
 * Returns array of session IDs that overlap with the given session.
 */
export interface SessionForOverlap {
  id: number;
  engineer_code: string;
  session_date: string;
  travel_minutes: number;
  work_minutes: number;
  office_minutes: number;
}

export function detectOverlaps(sessions: SessionForOverlap[]): Set<number> {
  const overlapping = new Set<number>();
  // Group by engineer + date
  const grouped = new Map<string, SessionForOverlap[]>();
  sessions.forEach((s) => {
    const key = `${s.engineer_code}-${s.session_date}`;
    if (!grouped.has(key)) grouped.set(key, []);
    grouped.get(key)!.push(s);
  });

  grouped.forEach((group) => {
    if (group.length < 2) return;
    // Sum all minutes per session
    const totals = group.map((s) => ({
      id: s.id,
      total: (s.travel_minutes || 0) + (s.work_minutes || 0) + (s.office_minutes || 0),
    }));
    const dayTotal = totals.reduce((sum, x) => sum + x.total, 0);
    // If day total > 16h (960 min), suspicious overlap
    if (dayTotal > 960) {
      totals.forEach((t) => overlapping.add(t.id));
    }
  });

  return overlapping;
}
