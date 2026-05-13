import { createClient } from "@/lib/supabase/server";
import MachinesClient from "./client";

export const dynamic = "force-dynamic";

export default async function MachinesPage({
  searchParams,
}: {
  searchParams: Promise<{ filter?: string }>;
}) {
  const { filter } = await searchParams;
  const supabase = await createClient();

  const [{ data: machines, error }, { data: customers }] = await Promise.all([
    supabase
      .from("machines")
      .select(
        "machine_no, name, product_code, serial_no, customer_code, customer_name, warranty_expiry, installation_date, version, notes"
      )
      .order("machine_no", { ascending: false })
      .limit(500),
    supabase.from("customers").select("code, name, city, country").order("name"),
  ]);

  if (error) return <div className="p-6 text-red-600">Error: {error.message}</div>;

  return <MachinesClient initialMachines={machines ?? []} customers={customers ?? []} filter={filter} />;
}
