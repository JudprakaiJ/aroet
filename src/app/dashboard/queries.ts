import "server-only";
import { createClient } from "@/lib/supabase/server";

export const DASHBOARD_ENGINEER = "JKH";

export type DashboardCase = {
  so_number: string;
  status: string;
  title: string | null;
  service_type_code: string | null;
  due_date: string | null;
  project_code: string | null;
  customer_code: string | null;
  customer_name: string | null;
  machines: string[];
  assignees: string[];
};

export type DashboardSession = {
  id: number;
  so_number: string | null;
  type_code: string | null;
  activity_type: string | null;
  total_minutes: number;
  approval_status: string;
  customer_name: string | null;
  work_done: string | null;
};

function bangkokToday(): string {
  return new Date().toLocaleDateString("en-CA", { timeZone: "Asia/Bangkok" });
}

function addDaysISO(iso: string, days: number): string {
  const d = new Date(iso + "T00:00:00Z");
  d.setUTCDate(d.getUTCDate() + days);
  return d.toISOString().slice(0, 10);
}

type CaseRow = {
  so_number: string;
  status: string;
  title: string | null;
  service_type_code: string | null;
  due_date: string | null;
  project_code: string | null;
  customer_code: string | null;
  customer_name: string | null;
  case_engineers: { engineer_code: string; is_lead: boolean | null }[] | null;
  case_machines: { machine_no: string; is_primary: boolean | null }[] | null;
};

function shapeCase(row: CaseRow): DashboardCase {
  return {
    so_number: row.so_number,
    status: row.status,
    title: row.title,
    service_type_code: row.service_type_code,
    due_date: row.due_date,
    project_code: row.project_code,
    customer_code: row.customer_code,
    customer_name: row.customer_name,
    machines: (row.case_machines ?? [])
      .sort((a, b) => (b.is_primary ? 1 : 0) - (a.is_primary ? 1 : 0))
      .map((m) => m.machine_no),
    assignees: (row.case_engineers ?? []).map((e) => e.engineer_code),
  };
}

export async function getMyActiveCases(): Promise<DashboardCase[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("cases")
    .select(
      `so_number, status, title, service_type_code, due_date, project_code,
       customer_code, customer_name,
       case_engineers!inner(engineer_code, is_lead),
       case_machines(machine_no, is_primary)`
    )
    .eq("case_engineers.engineer_code", DASHBOARD_ENGINEER)
    .in("status", ["planned", "in_progress"])
    .order("due_date", { ascending: true, nullsFirst: false })
    .limit(4);

  if (error || !data) return [];
  return (data as unknown as CaseRow[]).map(shapeCase);
}

export async function getTodaySessions(): Promise<DashboardSession[]> {
  const supabase = await createClient();
  const today = bangkokToday();
  const { data, error } = await supabase
    .from("sessions")
    .select(
      `id, so_number, type_code, activity_type,
       travel_minutes, work_minutes, office_minutes, break_minutes,
       approval_status, work_done,
       cases(customer_name)`
    )
    .eq("engineer_code", DASHBOARD_ENGINEER)
    .eq("session_date", today)
    .neq("approval_status", "returned")
    .order("id", { ascending: true });

  if (error || !data) return [];
  return data.map((r) => {
    const row = r as unknown as {
      id: number;
      so_number: string | null;
      type_code: string | null;
      activity_type: string | null;
      travel_minutes: number | null;
      work_minutes: number | null;
      office_minutes: number | null;
      approval_status: string | null;
      work_done: string | null;
      cases: { customer_name: string | null } | null;
    };
    const total =
      (row.travel_minutes ?? 0) + (row.work_minutes ?? 0) + (row.office_minutes ?? 0);
    return {
      id: row.id,
      so_number: row.so_number,
      type_code: row.type_code,
      activity_type: row.activity_type,
      total_minutes: total,
      approval_status: row.approval_status ?? "draft",
      customer_name: row.cases?.customer_name ?? null,
      work_done: row.work_done,
    };
  });
}

export async function getUpcomingThisWeek(): Promise<DashboardCase[]> {
  const supabase = await createClient();
  const today = bangkokToday();
  const weekOut = addDaysISO(today, 7);
  const { data, error } = await supabase
    .from("cases")
    .select(
      `so_number, status, title, service_type_code, due_date, project_code,
       customer_code, customer_name,
       case_engineers!inner(engineer_code, is_lead),
       case_machines(machine_no, is_primary)`
    )
    .eq("case_engineers.engineer_code", DASHBOARD_ENGINEER)
    .in("status", ["planned", "in_progress"])
    .gt("due_date", today)
    .lte("due_date", weekOut)
    .order("due_date", { ascending: true })
    .limit(3);

  if (error || !data) return [];
  return (data as unknown as CaseRow[]).map(shapeCase);
}
