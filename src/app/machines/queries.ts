import "server-only";
import { createServiceClient } from "@/lib/supabase/service";

export type MachineListFilters = {
  q?: string;
};

export type MachineListItem = {
  machine_no: string;
  name: string | null;
  product_code: string | null;
  serial_no: string | null;
  customer_code: string | null;
  customer_name: string | null;
  warranty_expiry: string | null;
};

export type MachineCase = {
  so_number: string;
  status: string;
  title: string | null;
  service_type_code: string | null;
  service_type_name: string | null;
  due_date: string | null;
  close_date: string | null;
  created_at: string | null;
};

export type MachineDetail = {
  machine_no: string;
  name: string | null;
  product_code: string | null;
  serial_no: string | null;
  customer_code: string | null;
  customer_name: string | null;
  warranty_expiry: string | null;
  installation_date: string | null;
  notes: string | null;
  cases: MachineCase[];
  totals: {
    all: number;
    pm: number;
    curative: number;
  };
};

export async function listMachines(filters: MachineListFilters): Promise<MachineListItem[]> {
  const supabase = createServiceClient();

  let q = supabase
    .from("machines")
    .select(
      "machine_no, name, product_code, serial_no, customer_code, customer_name, warranty_expiry"
    )
    .order("machine_no", { ascending: true })
    .limit(500);

  if (filters.q && filters.q.trim()) {
    const term = filters.q.trim().replace(/[%_,]/g, "");
    if (term) {
      q = q.or(
        `machine_no.ilike.%${term}%,name.ilike.%${term}%,serial_no.ilike.%${term}%,customer_name.ilike.%${term}%`
      );
    }
  }

  const { data, error } = await q;
  if (error) {
    console.error("[listMachines]", error.message);
    return [];
  }
  return data ?? [];
}

export async function getMachine(machineNo: string): Promise<MachineDetail | null> {
  const supabase = createServiceClient();

  const { data: machine, error } = await supabase
    .from("machines")
    .select(
      "machine_no, name, product_code, serial_no, customer_code, customer_name, warranty_expiry, installation_date, notes"
    )
    .eq("machine_no", machineNo)
    .maybeSingle();

  if (error) {
    console.error("[getMachine]", error.message);
    return null;
  }
  if (!machine) return null;

  // Cases via case_machines junction (source of truth per sql/05). Fall back to legacy cases.machine_no.
  const [junctionRes, legacyRes] = await Promise.all([
    supabase.from("case_machines").select("so_number").eq("machine_no", machineNo),
    supabase
      .from("cases")
      .select("so_number")
      .eq("machine_no", machineNo)
      .limit(500),
  ]);

  const soSet = new Set<string>();
  for (const r of junctionRes.data ?? []) soSet.add(r.so_number);
  for (const r of legacyRes.data ?? []) soSet.add(r.so_number);

  let cases: MachineCase[] = [];
  if (soSet.size > 0) {
    const { data: caseRows, error: caseErr } = await supabase
      .from("cases")
      .select(
        "so_number, status, title, service_type_code, service_type_name, due_date, close_date, created_at"
      )
      .in("so_number", Array.from(soSet))
      .order("created_at", { ascending: false })
      .limit(50);
    if (caseErr) console.error("[getMachine cases]", caseErr.message);
    cases = caseRows ?? [];
  }

  let pm = 0;
  let curative = 0;
  for (const c of cases) {
    if (c.service_type_code === "7507") pm++;
    else if (c.service_type_code === "7505" || c.service_type_code === "7515") curative++;
  }

  return {
    ...machine,
    cases,
    totals: {
      all: cases.length,
      pm,
      curative,
    },
  };
}
