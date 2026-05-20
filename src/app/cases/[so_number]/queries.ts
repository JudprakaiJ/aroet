import "server-only";
import { createClient } from "@/lib/supabase/server";

export type CaseDetail = {
  so_number: string;
  sr_number: string | null;
  title: string | null;
  description: string | null;
  service_type_code: string | null;
  service_type_name: string | null;
  customer_code: string | null;
  customer_name: string | null;
  contact_name: string | null;
  project_code: string | null;
  status: string;
  due_date: string | null;
  close_date: string | null;
  created_at: string | null;
  source: string | null;
  customer_po: string | null;
  machines: { machine_no: string; is_primary: boolean }[];
  assignees: { engineer_code: string; is_lead: boolean }[];
};

export type CaseAggregates = {
  sessions_count: number;
  hours_logged: number;
  refs_count: number;
  admin_count: number;
};

export type CaseSession = {
  id: number;
  session_date: string | null;
  engineer_code: string;
  type_code: string | null;
  activity_type: string | null;
  travel_minutes: number | null;
  work_minutes: number | null;
  office_minutes: number | null;
  break_minutes: number | null;
  is_weekend: boolean | null;
  work_done: string | null;
  approval_status: string | null;
  source: string | null;
  machine_no: string | null;
  approved_by: string | null;
  approved_at: string | null;
  return_reason: string | null;
};

export type CaseReference = {
  id: number;
  type: string;
  reference_no: string;
  description: string | null;
  status: string | null;
  recorded_by: string | null;
  recorded_at: string | null;
};

export type AdminLogEntry = {
  id: number;
  event_type: string;
  description: string | null;
  event_date: string | null;
  by_engineer: string | null;
  recorded_at: string | null;
};

export type SimilarCase = {
  so_number: string;
  status: string;
  title: string | null;
  service_type_code: string | null;
  customer_code: string | null;
  customer_name: string | null;
  reason: "machine" | "customer";
};

export type CustomerDetail = {
  code: string;
  name: string;
  city: string | null;
  country: string | null;
  address: string | null;
  contact_name: string | null;
  contact_mobile: string | null;
};

export type MachineDetail = {
  machine_no: string;
  customer_code: string | null;
  name: string | null;
  product_code: string | null;
  serial_no: string | null;
  version: string | null;
  warranty_expiry: string | null;
  installation_date: string | null;
};

export async function getCase(so_number: string): Promise<CaseDetail | null> {
  const supabase = await createClient();
  const { data: c } = await supabase
    .from("cases")
    .select(
      `so_number, sr_number, title, description, service_type_code, service_type_name,
       customer_code, customer_name, contact_name, project_code, status, due_date,
       close_date, created_at, source, customer_po, machine_no`
    )
    .eq("so_number", so_number)
    .maybeSingle();
  if (!c) return null;

  const [machinesRes, assigneesRes] = await Promise.all([
    supabase
      .from("case_machines")
      .select("machine_no, is_primary")
      .eq("so_number", so_number)
      .order("is_primary", { ascending: false }),
    supabase
      .from("case_engineers")
      .select("engineer_code, is_lead")
      .eq("so_number", so_number)
      .order("is_lead", { ascending: false }),
  ]);

  // Legacy fallback: cases created before sql/05 only stored the single
  // cases.machine_no — synthesize a primary entry so the UI doesn't
  // misreport "no machine attached".
  let machineList = (
    (machinesRes.data ?? []) as { machine_no: string; is_primary: boolean | null }[]
  ).map((m) => ({
    machine_no: m.machine_no,
    is_primary: Boolean(m.is_primary),
  }));
  const cAny = c as { machine_no?: string | null };
  if (machineList.length === 0 && cAny.machine_no) {
    machineList = [{ machine_no: cAny.machine_no, is_primary: true }];
  }

  return {
    ...(c as unknown as CaseDetail),
    machines: machineList,
    assignees: ((assigneesRes.data ?? []) as { engineer_code: string; is_lead: boolean | null }[]).map((a) => ({
      engineer_code: a.engineer_code,
      is_lead: Boolean(a.is_lead),
    })),
  };
}

export async function getCaseAggregates(so_number: string): Promise<CaseAggregates> {
  const supabase = await createClient();
  const [sessionsRes, refsRes, adminRes] = await Promise.all([
    supabase
      .from("sessions")
      .select("travel_minutes, work_minutes, office_minutes, approval_status")
      .eq("so_number", so_number),
    supabase
      .from("case_references")
      .select("id", { count: "exact", head: true })
      .eq("so_number", so_number),
    supabase
      .from("admin_log")
      .select("id", { count: "exact", head: true })
      .eq("so_number", so_number),
  ]);

  const rows =
    (sessionsRes.data ?? []) as Array<{
      travel_minutes: number | null;
      work_minutes: number | null;
      office_minutes: number | null;
      approval_status: string | null;
    }>;
  const total = rows
    .filter((r) => r.approval_status !== "returned")
    .reduce(
      (a, r) => a + (r.travel_minutes ?? 0) + (r.work_minutes ?? 0) + (r.office_minutes ?? 0),
      0
    );

  return {
    sessions_count: rows.length,
    hours_logged: Math.round((total / 60) * 10) / 10,
    refs_count: refsRes.count ?? 0,
    admin_count: adminRes.count ?? 0,
  };
}

export async function getCaseSessions(so_number: string): Promise<CaseSession[]> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("sessions")
    .select(
      `id, session_date, engineer_code, type_code, activity_type,
       travel_minutes, work_minutes, office_minutes, break_minutes,
       is_weekend, work_done, approval_status, source, machine_no,
       approved_by, approved_at, return_reason`
    )
    .eq("so_number", so_number)
    .order("session_date", { ascending: false })
    .order("id", { ascending: false });
  return (data ?? []) as CaseSession[];
}

export async function getCaseReferences(so_number: string): Promise<CaseReference[]> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("case_references")
    .select("id, type, reference_no, description, status, recorded_by, recorded_at")
    .eq("so_number", so_number)
    .order("recorded_at", { ascending: false });
  return (data ?? []) as CaseReference[];
}

export async function getAdminLog(so_number: string): Promise<AdminLogEntry[]> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("admin_log")
    .select("id, event_type, description, event_date, by_engineer, recorded_at")
    .eq("so_number", so_number)
    .order("event_date", { ascending: false })
    .order("recorded_at", { ascending: false });
  return (data ?? []) as AdminLogEntry[];
}

export async function getCustomerDetail(code: string | null): Promise<CustomerDetail | null> {
  if (!code) return null;
  const supabase = await createClient();
  const { data } = await supabase
    .from("customers")
    .select("code, name, city, country, address, contact_name, contact_mobile")
    .eq("code", code)
    .maybeSingle();
  return (data as CustomerDetail) ?? null;
}

export type LiteCustomer = { code: string; name: string };
export type LiteMachine = { machine_no: string; customer_code: string | null; product_code: string | null };

export async function listLiteCustomers(): Promise<LiteCustomer[]> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("customers")
    .select("code, name")
    .order("name", { ascending: true })
    .limit(500);
  return (data ?? []) as LiteCustomer[];
}

export async function listLiteMachines(): Promise<LiteMachine[]> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("machines")
    .select("machine_no, customer_code, product_code")
    .order("machine_no", { ascending: true })
    .limit(2000);
  return (data ?? []) as LiteMachine[];
}

export async function getMachineDetails(machineNos: string[]): Promise<MachineDetail[]> {
  if (machineNos.length === 0) return [];
  const supabase = await createClient();
  const { data } = await supabase
    .from("machines")
    .select(
      "machine_no, customer_code, name, product_code, serial_no, version, warranty_expiry, installation_date"
    )
    .in("machine_no", machineNos);
  return (data ?? []) as MachineDetail[];
}

export async function getSimilar(c: CaseDetail): Promise<SimilarCase[]> {
  const supabase = await createClient();
  const primary = c.machines.find((m) => m.is_primary)?.machine_no ?? c.machines[0]?.machine_no ?? null;
  const queries: Promise<SimilarCase[]>[] = [];

  if (primary) {
    queries.push(
      (async () => {
        const { data } = await supabase
          .from("case_machines")
          .select(
            "so_number, cases(so_number, status, title, service_type_code, customer_code, customer_name)"
          )
          .eq("machine_no", primary)
          .neq("so_number", c.so_number)
          .limit(6);
        type CasesNested =
          | {
              so_number: string;
              status: string;
              title: string | null;
              service_type_code: string | null;
              customer_code: string | null;
              customer_name: string | null;
            }
          | Array<{
              so_number: string;
              status: string;
              title: string | null;
              service_type_code: string | null;
              customer_code: string | null;
              customer_name: string | null;
            }>
          | null;
        const rows = (data ?? []) as unknown as Array<{ cases: CasesNested }>;
        const out: SimilarCase[] = [];
        for (const r of rows) {
          const nested = Array.isArray(r.cases) ? r.cases[0] : r.cases;
          if (nested) out.push({ ...nested, reason: "machine" as const });
        }
        return out;
      })()
    );
  }
  if (c.customer_code && c.service_type_code) {
    queries.push(
      (async () => {
        const { data } = await supabase
          .from("cases")
          .select("so_number, status, title, service_type_code, customer_code, customer_name")
          .eq("customer_code", c.customer_code!)
          .eq("service_type_code", c.service_type_code!)
          .neq("so_number", c.so_number)
          .order("created_at", { ascending: false })
          .limit(6);
        return ((data ?? []) as Array<{
          so_number: string;
          status: string;
          title: string | null;
          service_type_code: string | null;
          customer_code: string | null;
          customer_name: string | null;
        }>).map((r) => ({ ...r, reason: "customer" as const }));
      })()
    );
  }
  if (queries.length === 0) return [];
  const results = (await Promise.all(queries)).flat();
  const seen = new Set<string>();
  const out: SimilarCase[] = [];
  for (const r of results) {
    if (seen.has(r.so_number)) continue;
    seen.add(r.so_number);
    out.push(r);
    if (out.length >= 6) break;
  }
  return out;
}
