import { createClient } from "@/lib/supabase/server";
import CustomersClient from "./client";

export const dynamic = "force-dynamic";

export default async function CustomersPage() {
  const supabase = await createClient();

  const [{ data: customers, error }, { data: contacts }, { data: machineCounts }, { data: caseCounts }] =
    await Promise.all([
      supabase
        .from("customers")
        .select("code, name, city, country, address, contact_name, contact_mobile, notes")
        .order("name"),
      supabase.from("customer_contacts").select("id, customer_code, name, role, phone, email, is_primary"),
      supabase.from("machines").select("customer_code"),
      supabase.from("cases").select("customer_code"),
    ]);

  if (error) return <div className="p-6 text-red-600">Error: {error.message}</div>;

  const machineMap = new Map<string, number>();
  (machineCounts ?? []).forEach((m: any) => {
    if (m.customer_code) machineMap.set(m.customer_code, (machineMap.get(m.customer_code) ?? 0) + 1);
  });

  const caseMap = new Map<string, number>();
  (caseCounts ?? []).forEach((c: any) => {
    if (c.customer_code) caseMap.set(c.customer_code, (caseMap.get(c.customer_code) ?? 0) + 1);
  });

  const contactsMap = new Map<string, any[]>();
  (contacts ?? []).forEach((c: any) => {
    if (!contactsMap.has(c.customer_code)) contactsMap.set(c.customer_code, []);
    contactsMap.get(c.customer_code)!.push(c);
  });

  const enriched = (customers ?? []).map((c: any) => ({
    ...c,
    contacts: contactsMap.get(c.code) ?? [],
    machines_count: machineMap.get(c.code) ?? 0,
    cases_count: caseMap.get(c.code) ?? 0,
  }));

  return <CustomersClient customers={enriched} />;
}
