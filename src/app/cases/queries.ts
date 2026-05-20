import "server-only";
import { createClient } from "@/lib/supabase/server";
import { meCode } from "@/lib/auth/current-user";

export type CaseListFilters = {
  q?: string;
  scope?: "mine" | "team" | "all";
  status?: "open" | "verified" | "all";
  year?: string;
  type?: string;
};

export type CaseListItem = {
  so_number: string;
  status: string;
  title: string | null;
  service_type_code: string | null;
  customer_code: string | null;
  customer_name: string | null;
  project_code: string | null;
  due_date: string | null;
  created_at: string | null;
  machines: string[];
  assignees: string[];
  lead: string | null;
  hours_logged: number;
};

async function getMyCaseSOs(): Promise<string[]> {
  const supabase = await createClient();
  const me = await meCode();
  const { data } = await supabase
    .from("case_engineers")
    .select("so_number")
    .eq("engineer_code", me);
  return (data ?? []).map((r: { so_number: string }) => r.so_number);
}

export async function listCases(filters: CaseListFilters): Promise<CaseListItem[]> {
  const supabase = await createClient();

  let q = supabase
    .from("cases")
    .select(
      `so_number, status, title, service_type_code, customer_code, customer_name,
       project_code, due_date, created_at,
       case_engineers(engineer_code, is_lead),
       case_machines(machine_no, is_primary)`
    )
    .order("due_date", { ascending: true, nullsFirst: false })
    .limit(80);

  if (filters.scope === "mine") {
    const mySos = await getMyCaseSOs();
    if (mySos.length === 0) return [];
    q = q.in("so_number", mySos);
  }

  if (!filters.status || filters.status === "open") {
    q = q.in("status", ["planned", "in_progress", "completed"]);
  } else if (filters.status === "verified") {
    q = q.eq("status", "verified");
  }

  if (filters.year) {
    q = q.ilike("so_number", `SO${filters.year.slice(2)}%`);
  }

  if (filters.type) {
    q = q.eq("service_type_code", filters.type);
  }

  if (filters.q && filters.q.trim()) {
    const term = filters.q.trim().replace(/[%_,]/g, "");
    if (term) {
      q = q.or(
        `so_number.ilike.%${term}%,title.ilike.%${term}%,customer_name.ilike.%${term}%,project_code.ilike.%${term}%`
      );
    }
  }

  const { data, error } = await q;
  if (error || !data) return [];

  const rows = data as unknown as Array<{
    so_number: string;
    status: string;
    title: string | null;
    service_type_code: string | null;
    customer_code: string | null;
    customer_name: string | null;
    project_code: string | null;
    due_date: string | null;
    created_at: string | null;
    case_engineers: { engineer_code: string; is_lead: boolean | null }[] | null;
    case_machines: { machine_no: string; is_primary: boolean | null }[] | null;
  }>;

  const sos = rows.map((r) => r.so_number);
  const hoursMap = new Map<string, number>();
  if (sos.length > 0) {
    const { data: hours } = await supabase
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
      hoursMap.set(
        h.so_number,
        cur + (h.work_minutes ?? 0) + (h.travel_minutes ?? 0) + (h.office_minutes ?? 0)
      );
    }
  }

  return rows.map((r) => ({
    so_number: r.so_number,
    status: r.status,
    title: r.title,
    service_type_code: r.service_type_code,
    customer_code: r.customer_code,
    customer_name: r.customer_name,
    project_code: r.project_code,
    due_date: r.due_date,
    created_at: r.created_at,
    machines: (r.case_machines ?? [])
      .slice()
      .sort((a, b) => (b.is_primary ? 1 : 0) - (a.is_primary ? 1 : 0))
      .map((m) => m.machine_no),
    assignees: (r.case_engineers ?? []).map((e) => e.engineer_code),
    lead: (r.case_engineers ?? []).find((e) => e.is_lead)?.engineer_code ?? null,
    hours_logged: Math.round(((hoursMap.get(r.so_number) ?? 0) / 60) * 10) / 10,
  }));
}

export async function listAvailableYears(): Promise<string[]> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("cases")
    .select("so_number")
    .order("so_number", { ascending: false })
    .limit(2000);
  const years = new Set<string>();
  for (const r of (data ?? []) as Array<{ so_number: string }>) {
    const m = r.so_number.match(/^SO(\d{2})/);
    if (m) years.add(`20${m[1]}`);
  }
  return Array.from(years).sort().reverse();
}
