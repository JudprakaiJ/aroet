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
