import "server-only";
import { createServiceClient } from "@/lib/supabase/service";

export type CustomerListFilters = {
  q?: string;
};

export type CustomerListItem = {
  code: string;
  name: string;
  city: string | null;
  country: string | null;
  contact_name: string | null;
  contact_mobile: string | null;
  machines_count: number;
  cases_count: number;
};

export type CustomerContact = {
  id: number;
  name: string;
  role: string | null;
  phone: string | null;
  email: string | null;
  is_primary: boolean;
};

export type CustomerMachine = {
  machine_no: string;
  name: string | null;
  product_code: string | null;
  version: string | null;
  serial_no: string | null;
  warranty_expiry: string | null;
};

export type CustomerCase = {
  so_number: string;
  status: string;
  title: string | null;
  service_type_code: string | null;
  due_date: string | null;
  created_at: string | null;
};

export type CustomerDetail = {
  code: string;
  name: string;
  city: string | null;
  country: string | null;
  address: string | null;
  notes: string | null;
  contact_name: string | null;
  contact_mobile: string | null;
  contacts: CustomerContact[];
  machines: CustomerMachine[];
  cases: CustomerCase[];
};

export type CustomerLite = { code: string; name: string };

export async function listCustomersLite(): Promise<CustomerLite[]> {
  const supabase = createServiceClient();
  const { data } = await supabase
    .from("customers")
    .select("code, name")
    .order("name", { ascending: true })
    .limit(2000);
  return (data ?? []) as CustomerLite[];
}

export async function listCustomers(filters: CustomerListFilters): Promise<CustomerListItem[]> {
  const supabase = createServiceClient();

  let q = supabase
    .from("customers")
    .select("code, name, city, country, contact_name, contact_mobile")
    .order("name", { ascending: true })
    .limit(500);

  if (filters.q && filters.q.trim()) {
    const term = filters.q.trim().replace(/[%_,]/g, "");
    if (term) {
      q = q.or(`code.ilike.%${term}%,name.ilike.%${term}%,city.ilike.%${term}%`);
    }
  }

  const { data, error } = await q;
  if (error) {
    console.error("[listCustomers]", error.message);
    return [];
  }
  const rows = data ?? [];
  if (rows.length === 0) return [];

  const codes = rows.map((r) => r.code);
  const [machinesAgg, casesAgg] = await Promise.all([
    supabase.from("machines").select("customer_code").in("customer_code", codes),
    supabase.from("cases").select("customer_code").in("customer_code", codes),
  ]);

  const machinesByCode = new Map<string, number>();
  for (const m of machinesAgg.data ?? []) {
    machinesByCode.set(m.customer_code, (machinesByCode.get(m.customer_code) ?? 0) + 1);
  }
  const casesByCode = new Map<string, number>();
  for (const c of casesAgg.data ?? []) {
    casesByCode.set(c.customer_code, (casesByCode.get(c.customer_code) ?? 0) + 1);
  }

  return rows.map((r) => ({
    code: r.code,
    name: r.name,
    city: r.city,
    country: r.country,
    contact_name: r.contact_name,
    contact_mobile: r.contact_mobile,
    machines_count: machinesByCode.get(r.code) ?? 0,
    cases_count: casesByCode.get(r.code) ?? 0,
  }));
}

export async function getCustomer(code: string): Promise<CustomerDetail | null> {
  const supabase = createServiceClient();

  const { data: cust, error } = await supabase
    .from("customers")
    .select("code, name, city, country, address, notes, contact_name, contact_mobile")
    .eq("code", code)
    .maybeSingle();

  if (error) {
    console.error("[getCustomer]", error.message);
    return null;
  }
  if (!cust) return null;

  const [contactsRes, machinesRes, casesRes] = await Promise.all([
    supabase
      .from("customer_contacts")
      .select("id, name, role, phone, email, is_primary")
      .eq("customer_code", code)
      .order("is_primary", { ascending: false })
      .order("name", { ascending: true }),
    supabase
      .from("machines")
      .select("machine_no, name, product_code, version, serial_no, warranty_expiry")
      .eq("customer_code", code)
      .order("machine_no", { ascending: true }),
    supabase
      .from("cases")
      .select("so_number, status, title, service_type_code, due_date, created_at")
      .eq("customer_code", code)
      .order("created_at", { ascending: false })
      .limit(30),
  ]);

  if (contactsRes.error) console.error("[getCustomer contacts]", contactsRes.error.message);
  if (machinesRes.error) console.error("[getCustomer machines]", machinesRes.error.message);
  if (casesRes.error) console.error("[getCustomer cases]", casesRes.error.message);

  return {
    ...cust,
    contacts: contactsRes.data ?? [],
    machines: machinesRes.data ?? [],
    cases: casesRes.data ?? [],
  };
}
