import { createClient } from "@/lib/supabase/server";
import { notFound } from "next/navigation";
import CustomerDetailClient from "./client";

export const dynamic = "force-dynamic";

export default async function CustomerDetail({
  params,
}: {
  params: Promise<{ code: string }>;
}) {
  const { code } = await params;
  const supabase = await createClient();

  const [{ data: customer }, { data: contacts }, { data: machines }, { data: cases }] =
    await Promise.all([
      supabase
        .from("customers")
        .select("code, name, city, country, address, contact_name, contact_mobile, notes")
        .eq("code", code)
        .single(),
      supabase
        .from("customer_contacts")
        .select("id, customer_code, name, role, phone, email, is_primary")
        .eq("customer_code", code)
        .order("is_primary", { ascending: false }),
      supabase
        .from("machines")
        .select("machine_no, name, product_code, serial_no, version, warranty_expiry")
        .eq("customer_code", code)
        .order("machine_no", { ascending: false }),
      supabase
        .from("cases")
        .select("so_number, status, service_type_name, machine_no, title, due_date")
        .eq("customer_code", code)
        .order("created_at", { ascending: false })
        .limit(30),
    ]);

  if (!customer) notFound();

  return (
    <CustomerDetailClient
      customer={customer}
      contacts={contacts ?? []}
      machines={machines ?? []}
      cases={cases ?? []}
    />
  );
}
