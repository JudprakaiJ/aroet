"use server";

import { createServiceClient } from "@/lib/supabase/service";
import { revalidatePath } from "next/cache";
import { typeCodeFor, type ClockOutReview } from "@/lib/clock/types";

const ME = "JKH";

type ClockInArgs = {
  so_number: string;
  machine_no?: string | null;
  activity_type: string;
};

export async function clockIn({
  so_number,
  machine_no,
  activity_type,
}: ClockInArgs): Promise<{ success: boolean; session_id?: number; error?: string }> {
  const supabase = createServiceClient();

  const { data: existing } = await supabase
    .from("sessions")
    .select("id")
    .eq("engineer_code", ME)
    .not("clock_in_at", "is", null)
    .is("clock_out_at", null)
    .limit(1)
    .maybeSingle();

  if (existing) {
    return { success: false, error: "Already clocked in — clock out first." };
  }

  const sessionDate = new Date().toLocaleDateString("en-CA", { timeZone: "Asia/Bangkok" });
  const dow = new Date(sessionDate).getDay();

  const { data, error } = await supabase
    .from("sessions")
    .insert({
      so_number,
      machine_no: machine_no ?? null,
      engineer_code: ME,
      session_date: sessionDate,
      activity_type,
      type_code: typeCodeFor(activity_type),
      travel_minutes: 0,
      break_minutes: 0,
      work_minutes: 0,
      office_minutes: 0,
      is_weekend: dow === 0 || dow === 6,
      is_holiday: false,
      source: "manual",
      approval_status: "draft",
      clock_in_at: new Date().toISOString(),
      paused_total_minutes: 0,
    })
    .select("id")
    .single();

  if (error || !data) return { success: false, error: error?.message ?? "Insert failed" };

  revalidatePath("/");
  revalidatePath(`/cases/${so_number}`);
  return { success: true, session_id: data.id };
}

export async function pauseSession(session_id: number): Promise<{ success: boolean; error?: string }> {
  const supabase = createServiceClient();
  const { data: s } = await supabase
    .from("sessions")
    .select("paused_at, clock_out_at")
    .eq("id", session_id)
    .single();
  if (!s || s.clock_out_at) return { success: false, error: "Not active" };
  if (s.paused_at) return { success: false, error: "Already paused" };

  const { error } = await supabase
    .from("sessions")
    .update({ paused_at: new Date().toISOString() })
    .eq("id", session_id);
  if (error) return { success: false, error: error.message };

  revalidatePath("/");
  return { success: true };
}

export async function resumeSession(session_id: number): Promise<{ success: boolean; error?: string }> {
  const supabase = createServiceClient();
  const { data: s } = await supabase
    .from("sessions")
    .select("paused_at, paused_total_minutes, clock_out_at")
    .eq("id", session_id)
    .single();
  if (!s || s.clock_out_at) return { success: false, error: "Not active" };
  if (!s.paused_at) return { success: false, error: "Not paused" };

  const pausedMs = Date.now() - new Date(s.paused_at).getTime();
  const addedMin = Math.max(0, Math.round(pausedMs / 60_000));

  const { error } = await supabase
    .from("sessions")
    .update({
      paused_at: null,
      paused_total_minutes: (s.paused_total_minutes ?? 0) + addedMin,
    })
    .eq("id", session_id);
  if (error) return { success: false, error: error.message };

  revalidatePath("/");
  return { success: true };
}

export async function clockOut(
  session_id: number,
  review: ClockOutReview
): Promise<{ success: boolean; error?: string }> {
  const supabase = createServiceClient();
  const { data: s } = await supabase
    .from("sessions")
    .select(
      "clock_in_at, paused_at, paused_total_minutes, activity_type, so_number, type_code"
    )
    .eq("id", session_id)
    .single();

  if (!s || !s.clock_in_at) return { success: false, error: "Session not active" };

  const now = new Date();
  let pausedTotal = s.paused_total_minutes ?? 0;
  if (s.paused_at) {
    pausedTotal += Math.max(
      0,
      Math.round((now.getTime() - new Date(s.paused_at).getTime()) / 60_000)
    );
  }

  const elapsedMin = Math.max(
    0,
    Math.round((now.getTime() - new Date(s.clock_in_at).getTime()) / 60_000) - pausedTotal
  );
  const travel = Math.max(0, review.travel_minutes ?? 0);
  const breakMin = Math.max(0, review.break_minutes ?? 0);
  const remaining = Math.max(0, elapsedMin - travel - breakMin);

  let workMin = 0;
  let officeMin = 0;
  let travelMin = travel;
  if (s.activity_type === "office") {
    officeMin = remaining;
  } else if (s.activity_type === "travel") {
    travelMin = travel + remaining;
  } else {
    workMin = remaining;
  }

  const { error } = await supabase
    .from("sessions")
    .update({
      clock_out_at: now.toISOString(),
      paused_at: null,
      paused_total_minutes: pausedTotal,
      travel_minutes: travelMin,
      break_minutes: breakMin,
      work_minutes: workMin,
      office_minutes: officeMin,
      work_done: review.notes?.trim() || null,
      approval_status: review.submit_immediately ? "submitted" : "draft",
    })
    .eq("id", session_id);

  if (error) return { success: false, error: error.message };

  if (review.submit_immediately) {
    await supabase.from("session_approval_log").insert({
      session_id,
      action: "submitted",
      by_engineer: ME,
    });
  }

  revalidatePath("/");
  revalidatePath("/cases");
  if (s.so_number) revalidatePath(`/cases/${s.so_number}`);
  revalidatePath("/workforce/queue");
  return { success: true };
}

export type SwitchableCase = {
  so_number: string;
  title: string | null;
  customer_name: string | null;
  machine_no: string | null;
};

export async function listMyActiveCasesForSwitch(currentSo: string | null): Promise<SwitchableCase[]> {
  const supabase = createServiceClient();
  const { data: sos } = await supabase
    .from("case_engineers")
    .select("so_number")
    .eq("engineer_code", ME);
  const soList = ((sos ?? []) as { so_number: string }[]).map((r) => r.so_number);
  if (soList.length === 0) return [];
  const { data } = await supabase
    .from("cases")
    .select("so_number, title, customer_name, machine_no")
    .in("so_number", soList)
    .in("status", ["planned", "in_progress"])
    .order("due_date", { ascending: true, nullsFirst: false });
  return ((data ?? []) as SwitchableCase[]).filter((c) => c.so_number !== currentSo);
}

export async function switchActiveCase(
  session_id: number,
  new_so_number: string,
  new_machine_no: string | null
): Promise<{ success: boolean; error?: string }> {
  const supabase = createServiceClient();
  const { data: s } = await supabase
    .from("sessions")
    .select("so_number, clock_in_at, clock_out_at")
    .eq("id", session_id)
    .single();
  if (!s || !s.clock_in_at || s.clock_out_at) return { success: false, error: "Not active" };
  if (s.so_number === new_so_number) return { success: false, error: "Already on this case" };

  const oldSo = s.so_number;
  const { error } = await supabase
    .from("sessions")
    .update({ so_number: new_so_number, machine_no: new_machine_no })
    .eq("id", session_id);
  if (error) return { success: false, error: error.message };

  revalidatePath("/");
  if (oldSo) revalidatePath(`/cases/${oldSo}`);
  revalidatePath(`/cases/${new_so_number}`);
  return { success: true };
}

export async function changeActivity(
  session_id: number,
  new_activity_type: string
): Promise<{ success: boolean; error?: string }> {
  const supabase = createServiceClient();
  const { data: s } = await supabase
    .from("sessions")
    .select("clock_in_at, clock_out_at, activity_type")
    .eq("id", session_id)
    .single();
  if (!s || !s.clock_in_at || s.clock_out_at) return { success: false, error: "Not active" };
  if (s.activity_type === new_activity_type) return { success: false, error: "Already on this activity" };

  const { error } = await supabase
    .from("sessions")
    .update({
      activity_type: new_activity_type,
      type_code: typeCodeFor(new_activity_type),
    })
    .eq("id", session_id);
  if (error) return { success: false, error: error.message };

  revalidatePath("/");
  return { success: true };
}

export async function editStartTime(
  session_id: number,
  new_clock_in_iso: string
): Promise<{ success: boolean; error?: string }> {
  const supabase = createServiceClient();
  const { data: s } = await supabase
    .from("sessions")
    .select("clock_in_at, clock_out_at")
    .eq("id", session_id)
    .single();
  if (!s || !s.clock_in_at || s.clock_out_at) return { success: false, error: "Not active" };

  const newDate = new Date(new_clock_in_iso);
  if (Number.isNaN(newDate.getTime())) return { success: false, error: "Invalid time" };
  if (newDate.getTime() > Date.now()) return { success: false, error: "Start time can't be in the future" };

  const { error } = await supabase
    .from("sessions")
    .update({ clock_in_at: newDate.toISOString() })
    .eq("id", session_id);
  if (error) return { success: false, error: error.message };

  revalidatePath("/");
  return { success: true };
}

export type EmergencyCase = {
  so_number: string;
  title: string | null;
  customer_name: string | null;
  machine_no: string | null;
  status: string | null;
  service_type_code: string | null;
  is_mine: boolean;
};

export async function searchCasesForEmergency(query: string): Promise<EmergencyCase[]> {
  const supabase = createServiceClient();
  const q = query.trim();

  const { data: mySos } = await supabase
    .from("case_engineers")
    .select("so_number")
    .eq("engineer_code", ME);
  const mySet = new Set(((mySos ?? []) as { so_number: string }[]).map((r) => r.so_number));

  let req = supabase
    .from("cases")
    .select("so_number, title, customer_name, machine_no, status, service_type_code")
    .in("status", ["planned", "in_progress"])
    .order("due_date", { ascending: true, nullsFirst: false })
    .limit(40);

  if (q.length > 0) {
    const like = `%${q}%`;
    req = req.or(
      `so_number.ilike.${like},title.ilike.${like},customer_name.ilike.${like},machine_no.ilike.${like}`
    );
  }

  const { data } = await req;
  return ((data ?? []) as Omit<EmergencyCase, "is_mine">[]).map((c) => ({
    ...c,
    is_mine: mySet.has(c.so_number),
  }));
}

export type EmergencyMode = "continue" | "restart";

export async function emergencySwitchCase(
  session_id: number,
  new_so_number: string,
  new_machine_no: string | null,
  mode: EmergencyMode,
  new_activity_type?: string
): Promise<{ success: boolean; new_session_id?: number; error?: string }> {
  const supabase = createServiceClient();
  const { data: s } = await supabase
    .from("sessions")
    .select(
      "id, so_number, clock_in_at, paused_at, paused_total_minutes, activity_type, type_code, clock_out_at"
    )
    .eq("id", session_id)
    .single();
  if (!s || !s.clock_in_at || s.clock_out_at) return { success: false, error: "Not active" };
  if (s.so_number === new_so_number && mode === "continue") {
    return { success: false, error: "Already on this case" };
  }

  const oldSo = s.so_number;

  if (mode === "continue") {
    const { error } = await supabase
      .from("sessions")
      .update({
        so_number: new_so_number,
        machine_no: new_machine_no,
        ...(new_activity_type
          ? { activity_type: new_activity_type, type_code: typeCodeFor(new_activity_type) }
          : {}),
      })
      .eq("id", session_id);
    if (error) return { success: false, error: error.message };

    revalidatePath("/");
    if (oldSo) revalidatePath(`/cases/${oldSo}`);
    revalidatePath(`/cases/${new_so_number}`);
    return { success: true, new_session_id: session_id };
  }

  const now = new Date();
  let pausedTotal = s.paused_total_minutes ?? 0;
  if (s.paused_at) {
    pausedTotal += Math.max(
      0,
      Math.round((now.getTime() - new Date(s.paused_at).getTime()) / 60_000)
    );
  }
  const elapsedMin = Math.max(
    0,
    Math.round((now.getTime() - new Date(s.clock_in_at).getTime()) / 60_000) - pausedTotal
  );
  let workMin = 0;
  let officeMin = 0;
  let travelMin = 0;
  if (s.activity_type === "office") officeMin = elapsedMin;
  else if (s.activity_type === "travel") travelMin = elapsedMin;
  else workMin = elapsedMin;

  const { error: closeErr } = await supabase
    .from("sessions")
    .update({
      clock_out_at: now.toISOString(),
      paused_at: null,
      paused_total_minutes: pausedTotal,
      travel_minutes: travelMin,
      break_minutes: 0,
      work_minutes: workMin,
      office_minutes: officeMin,
      work_done: "Emergency switch — auto-closed",
      approval_status: "draft",
    })
    .eq("id", session_id);
  if (closeErr) return { success: false, error: closeErr.message };

  const activity = new_activity_type ?? s.activity_type ?? "field";
  const sessionDate = now.toLocaleDateString("en-CA", { timeZone: "Asia/Bangkok" });
  const dow = new Date(sessionDate).getDay();

  const { data: inserted, error: insertErr } = await supabase
    .from("sessions")
    .insert({
      so_number: new_so_number,
      machine_no: new_machine_no,
      engineer_code: ME,
      session_date: sessionDate,
      activity_type: activity,
      type_code: typeCodeFor(activity),
      travel_minutes: 0,
      break_minutes: 0,
      work_minutes: 0,
      office_minutes: 0,
      is_weekend: dow === 0 || dow === 6,
      is_holiday: false,
      source: "manual",
      approval_status: "draft",
      clock_in_at: now.toISOString(),
      paused_total_minutes: 0,
    })
    .select("id")
    .single();

  if (insertErr || !inserted) return { success: false, error: insertErr?.message ?? "Restart failed" };

  revalidatePath("/");
  revalidatePath("/cases");
  if (oldSo) revalidatePath(`/cases/${oldSo}`);
  revalidatePath(`/cases/${new_so_number}`);
  return { success: true, new_session_id: inserted.id };
}
