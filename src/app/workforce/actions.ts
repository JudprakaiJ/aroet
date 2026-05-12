"use server";

import { createServiceClient } from "@/lib/supabase/service";
import { revalidatePath } from "next/cache";

// TODO: when auth is in place, get actual logged-in user code. For now: 'SYSTEM'.
async function currentUserCode(): Promise<string> {
  return "SYSTEM";
}

export async function submitSession(sessionId: number) {
  const supabase = createServiceClient();
  const by = await currentUserCode();

  await supabase
    .from("sessions")
    .update({ approval_status: "submitted" })
    .eq("id", sessionId);

  await supabase.from("session_approval_log").insert({
    session_id: sessionId,
    action: "submitted",
    by_engineer: by === "SYSTEM" ? null : by,
  });

  revalidatePath("/workforce");
}

export async function approveSession(sessionId: number) {
  const supabase = createServiceClient();
  const by = await currentUserCode();

  await supabase
    .from("sessions")
    .update({
      approval_status: "approved",
      approved_by: by === "SYSTEM" ? null : by,
      approved_at: new Date().toISOString(),
    })
    .eq("id", sessionId);

  await supabase.from("session_approval_log").insert({
    session_id: sessionId,
    action: "approved",
    by_engineer: by === "SYSTEM" ? null : by,
  });

  revalidatePath("/workforce");
}

export async function returnSession(sessionId: number, reason: string) {
  const supabase = createServiceClient();
  const by = await currentUserCode();

  await supabase
    .from("sessions")
    .update({
      approval_status: "returned",
      return_reason: reason,
    })
    .eq("id", sessionId);

  await supabase.from("session_approval_log").insert({
    session_id: sessionId,
    action: "returned",
    by_engineer: by === "SYSTEM" ? null : by,
    comment: reason,
  });

  revalidatePath("/workforce");
}

export async function bulkApproveByPeriod(start: string, end: string, engineerCode?: string) {
  const supabase = createServiceClient();
  const by = await currentUserCode();

  let q = supabase
    .from("sessions")
    .select("id")
    .gte("session_date", start)
    .lte("session_date", end)
    .eq("approval_status", "submitted");
  if (engineerCode) q = q.eq("engineer_code", engineerCode);

  const { data: ids } = await q;
  if (!ids || ids.length === 0) return { approved: 0 };

  await supabase
    .from("sessions")
    .update({
      approval_status: "approved",
      approved_by: by === "SYSTEM" ? null : by,
      approved_at: new Date().toISOString(),
    })
    .in(
      "id",
      ids.map((r) => r.id)
    );

  // Log each
  const logs = ids.map((r) => ({
    session_id: r.id,
    action: "approved" as const,
    by_engineer: by === "SYSTEM" ? null : by,
  }));
  await supabase.from("session_approval_log").insert(logs);

  revalidatePath("/workforce");
  return { approved: ids.length };
}
