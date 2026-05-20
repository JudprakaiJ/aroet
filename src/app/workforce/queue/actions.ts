"use server";

import { createServiceClient } from "@/lib/supabase/service";
import { revalidatePath } from "next/cache";
import { getDemoRole, getActingAs } from "@/app/me/role-actions";

async function requireApprover(): Promise<
  { ok: true; code: string } | { ok: false; error: string }
> {
  const [role, actingAs] = await Promise.all([getDemoRole(), getActingAs()]);
  if (role !== "admin") {
    return { ok: false, error: "Only admins can approve. Switch to admin view first." };
  }
  return { ok: true, code: actingAs };
}

export async function approveSession(id: number): Promise<{ success: boolean; error?: string }> {
  const auth = await requireApprover();
  if (!auth.ok) return { success: false, error: auth.error };

  const supabase = createServiceClient();
  const { error } = await supabase
    .from("sessions")
    .update({
      approval_status: "approved",
      approved_at: new Date().toISOString(),
      approved_by: auth.code,
    })
    .eq("id", id);
  if (error) return { success: false, error: error.message };

  await supabase.from("session_approval_log").insert({
    session_id: id,
    action: "approved",
    by_engineer: auth.code,
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
  const auth = await requireApprover();
  if (!auth.ok) return { success: false, error: auth.error };

  const supabase = createServiceClient();
  const { error } = await supabase
    .from("sessions")
    .update({ approval_status: "returned", return_reason: reason?.trim() || null })
    .eq("id", id);
  if (error) return { success: false, error: error.message };

  await supabase.from("session_approval_log").insert({
    session_id: id,
    action: "returned",
    by_engineer: auth.code,
    notes: reason?.trim() || null,
  });

  revalidatePath("/workforce/queue");
  revalidatePath("/workforce");
  return { success: true };
}

export async function bulkApproveSessions(
  ids: number[]
): Promise<{ success: boolean; approved?: number; error?: string }> {
  if (ids.length === 0) return { success: false, error: "No sessions selected" };

  const auth = await requireApprover();
  if (!auth.ok) return { success: false, error: auth.error };

  const supabase = createServiceClient();
  const { error } = await supabase
    .from("sessions")
    .update({
      approval_status: "approved",
      approved_at: new Date().toISOString(),
      approved_by: auth.code,
    })
    .in("id", ids);
  if (error) return { success: false, error: error.message };

  const logRows = ids.map((id) => ({
    session_id: id,
    action: "approved",
    by_engineer: auth.code,
    notes: null,
  }));
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
