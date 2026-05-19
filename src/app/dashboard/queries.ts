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

export type DashboardKpis = {
  pending_approvals: number;
  open_cases: number;
  in_progress_cases: number;
  hours_this_week: number;
  sessions_today: number;
};

function weekStartISO(today: string): string {
  const d = new Date(today + "T00:00:00Z");
  const dow = d.getUTCDay();
  const offset = (dow + 6) % 7;
  d.setUTCDate(d.getUTCDate() - offset);
  return d.toISOString().slice(0, 10);
}

export async function getDashboardKpis(): Promise<DashboardKpis> {
  const supabase = await createClient();
  const today = bangkokToday();
  const weekStart = weekStartISO(today);

  const [pending, openCases, weekSessions, todayCount] = await Promise.all([
    supabase
      .from("sessions")
      .select("id", { count: "exact", head: true })
      .eq("approval_status", "submitted"),
    supabase
      .from("cases")
      .select("status")
      .in("status", ["planned", "in_progress"]),
    supabase
      .from("sessions")
      .select("work_minutes, travel_minutes, office_minutes, approval_status")
      .gte("session_date", weekStart)
      .lte("session_date", today),
    supabase
      .from("sessions")
      .select("id", { count: "exact", head: true })
      .eq("session_date", today),
  ]);

  const openRows = (openCases.data ?? []) as { status: string }[];
  const weekMinutes = ((weekSessions.data ?? []) as Array<{
    work_minutes: number | null;
    travel_minutes: number | null;
    office_minutes: number | null;
    approval_status: string | null;
  }>)
    .filter((r) => r.approval_status !== "returned")
    .reduce((a, r) => a + (r.work_minutes ?? 0) + (r.travel_minutes ?? 0) + (r.office_minutes ?? 0), 0);

  return {
    pending_approvals: pending.count ?? 0,
    open_cases: openRows.length,
    in_progress_cases: openRows.filter((c) => c.status === "in_progress").length,
    hours_this_week: Math.round((weekMinutes / 60) * 10) / 10,
    sessions_today: todayCount.count ?? 0,
  };
}

export type ApprovalTeaserRow = {
  id: number;
  engineer_code: string;
  session_date: string | null;
  so_number: string | null;
  type_code: string | null;
  total_minutes: number;
};

export async function getPendingApprovalsTeaser(): Promise<ApprovalTeaserRow[]> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("sessions")
    .select(
      "id, engineer_code, session_date, so_number, type_code, work_minutes, travel_minutes, office_minutes"
    )
    .eq("approval_status", "submitted")
    .order("id", { ascending: false })
    .limit(5);
  return ((data ?? []) as Array<{
    id: number;
    engineer_code: string;
    session_date: string | null;
    so_number: string | null;
    type_code: string | null;
    work_minutes: number | null;
    travel_minutes: number | null;
    office_minutes: number | null;
  }>).map((r) => ({
    id: r.id,
    engineer_code: r.engineer_code,
    session_date: r.session_date,
    so_number: r.so_number,
    type_code: r.type_code,
    total_minutes: (r.work_minutes ?? 0) + (r.travel_minutes ?? 0) + (r.office_minutes ?? 0),
  }));
}

export type RecentCaseRow = {
  so_number: string;
  title: string | null;
  status: string;
  service_type_code: string | null;
  customer_name: string | null;
  lead: string | null;
  hours_logged: number;
};

export async function getRecentCases(): Promise<RecentCaseRow[]> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("cases")
    .select(
      `so_number, title, status, service_type_code, customer_name,
       case_engineers(engineer_code, is_lead)`
    )
    .order("created_at", { ascending: false })
    .limit(7);

  const rows = (data ?? []) as Array<{
    so_number: string;
    title: string | null;
    status: string;
    service_type_code: string | null;
    customer_name: string | null;
    case_engineers: { engineer_code: string; is_lead: boolean | null }[] | null;
  }>;

  const sos = rows.map((r) => r.so_number);
  const hoursMap = new Map<string, number>();
  if (sos.length > 0) {
    const supabase2 = await createClient();
    const { data: hours } = await supabase2
      .from("sessions")
      .select("so_number, work_minutes, travel_minutes, office_minutes, approval_status")
      .in("so_number", sos)
      .neq("approval_status", "returned");
    for (const h of (hours ?? []) as Array<{
      so_number: string | null;
      work_minutes: number | null;
      travel_minutes: number | null;
      office_minutes: number | null;
    }>) {
      if (!h.so_number) continue;
      const cur = hoursMap.get(h.so_number) ?? 0;
      hoursMap.set(h.so_number, cur + (h.work_minutes ?? 0) + (h.travel_minutes ?? 0) + (h.office_minutes ?? 0));
    }
  }

  return rows.map((r) => ({
    so_number: r.so_number,
    title: r.title,
    status: r.status,
    service_type_code: r.service_type_code,
    customer_name: r.customer_name,
    lead: (r.case_engineers ?? []).find((e) => e.is_lead)?.engineer_code ?? null,
    hours_logged: Math.round(((hoursMap.get(r.so_number) ?? 0) / 60) * 10) / 10,
  }));
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
