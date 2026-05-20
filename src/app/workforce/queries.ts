import "server-only";
import { createServiceClient } from "@/lib/supabase/service";

export type HoursSession = {
  id: number;
  session_date: string;
  engineer_code: string;
  so_number: string | null;
  type_code: string | null;
  activity_type: string | null;
  travel_minutes: number | null;
  work_minutes: number | null;
  office_minutes: number | null;
  break_minutes: number | null;
  is_weekend: boolean | null;
  is_holiday: boolean | null;
  approval_status: string | null;
  source: string | null;
  work_done: string | null;
};

export type EngineerLite = {
  code: string;
  full_name: string | null;
  role: string | null;
};

export async function listActiveEngineers(): Promise<EngineerLite[]> {
  const supabase = createServiceClient();
  const { data, error } = await supabase
    .from("engineers")
    .select("code, full_name, role, is_active")
    .eq("is_active", true)
    .order("code", { ascending: true });
  if (error) {
    console.error("[listActiveEngineers]", error.message);
    return [];
  }
  return (data ?? []).map((e) => ({ code: e.code, full_name: e.full_name, role: e.role }));
}

export async function getHoursSessions(
  engineerCode: string,
  start: string,
  end: string
): Promise<HoursSession[]> {
  const supabase = createServiceClient();
  const { data, error } = await supabase
    .from("sessions")
    .select(
      "id, session_date, engineer_code, so_number, type_code, activity_type, travel_minutes, work_minutes, office_minutes, break_minutes, is_weekend, is_holiday, approval_status, source, work_done"
    )
    .eq("engineer_code", engineerCode)
    .gte("session_date", start)
    .lte("session_date", end)
    .order("session_date", { ascending: true })
    .order("id", { ascending: true });

  if (error) {
    console.error("[getHoursSessions]", error.message);
    return [];
  }
  return data ?? [];
}

export type HoursTotals = {
  work: number;
  travel: number;
  office: number;
  break: number;
  totalMinutes: number;
  daysWorked: number;
  approved: number;
  submitted: number;
  draft: number;
  returned: number;
};

export function aggregateTotals(sessions: HoursSession[]): HoursTotals {
  const totals: HoursTotals = {
    work: 0,
    travel: 0,
    office: 0,
    break: 0,
    totalMinutes: 0,
    daysWorked: 0,
    approved: 0,
    submitted: 0,
    draft: 0,
    returned: 0,
  };
  const days = new Set<string>();
  for (const s of sessions) {
    if (s.approval_status === "returned") continue;
    const w = s.work_minutes ?? 0;
    const t = s.travel_minutes ?? 0;
    const o = s.office_minutes ?? 0;
    const b = s.break_minutes ?? 0;
    totals.work += w;
    totals.travel += t;
    totals.office += o;
    totals.break += b;
    totals.totalMinutes += w + t + o;
    if (w + t + o > 0) days.add(s.session_date);
    if (s.approval_status === "approved") totals.approved++;
    else if (s.approval_status === "submitted") totals.submitted++;
    else if (s.approval_status === "returned") totals.returned++;
    else totals.draft++;
  }
  totals.daysWorked = days.size;
  return totals;
}
