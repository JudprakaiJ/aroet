import "server-only";
import { createServiceClient } from "@/lib/supabase/service";

export type PlanEngineer = {
  code: string;
  full_name: string | null;
  role: string | null;
};

export type PlanSession = {
  id: number;
  engineer_code: string;
  session_date: string;
  type_code: string | null;
  so_number: string | null;
  activity_type: string | null;
  is_weekend: boolean | null;
  is_holiday: boolean | null;
  work_done: string | null;
  source: string | null;
  approval_status: string | null;
  clock_in_at: string | null;
};

export type PlanCaseInfo = {
  so_number: string;
  title: string | null;
  service_type_code: string | null;
  customer_name: string | null;
  project_code: string | null;
  machine_no: string | null;
};

export async function listPlanEngineers(): Promise<PlanEngineer[]> {
  const supabase = createServiceClient();
  const { data, error } = await supabase
    .from("engineers")
    .select("code, full_name, role, is_active")
    .eq("is_active", true)
    .order("role", { ascending: true })
    .order("code", { ascending: true });
  if (error) {
    console.error("[listPlanEngineers]", error.message);
    return [];
  }
  return (data ?? []).map((e) => ({ code: e.code, full_name: e.full_name, role: e.role }));
}

export async function listSessionsInRange(
  start: string,
  end: string
): Promise<PlanSession[]> {
  const supabase = createServiceClient();
  const { data, error } = await supabase
    .from("sessions")
    .select(
      "id, engineer_code, session_date, type_code, so_number, activity_type, is_weekend, is_holiday, work_done, source, approval_status, clock_in_at"
    )
    .gte("session_date", start)
    .lte("session_date", end)
    .order("session_date", { ascending: true });
  if (error) {
    console.error("[listSessionsInRange]", error.message);
    return [];
  }
  return data ?? [];
}

export async function listCasesBySos(sos: string[]): Promise<PlanCaseInfo[]> {
  if (sos.length === 0) return [];
  const supabase = createServiceClient();
  const { data, error } = await supabase
    .from("cases")
    .select("so_number, title, service_type_code, customer_name, project_code, machine_no")
    .in("so_number", sos);
  if (error) {
    console.error("[listCasesBySos]", error.message);
    return [];
  }
  return data ?? [];
}

export function buildDateRange(from: string, days: number): string[] {
  const out: string[] = [];
  const d = new Date(from);
  for (let i = 0; i < days; i++) {
    out.push(d.toISOString().slice(0, 10));
    d.setDate(d.getDate() + 1);
  }
  return out;
}

/**
 * Get Monday of the week containing `iso` (assumes ISO yyyy-mm-dd).
 * Returns Sunday-as-start version actually — we'll align to Monday explicitly.
 */
export function mondayOf(iso: string): string {
  const d = new Date(iso);
  const day = d.getDay(); // 0=Sun..6=Sat
  const offset = day === 0 ? -6 : 1 - day; // shift back to Monday
  d.setDate(d.getDate() + offset);
  return d.toISOString().slice(0, 10);
}

export function addDays(iso: string, days: number): string {
  const d = new Date(iso);
  d.setDate(d.getDate() + days);
  return d.toISOString().slice(0, 10);
}
