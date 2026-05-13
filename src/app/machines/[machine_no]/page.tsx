import { createClient } from "@/lib/supabase/server";
import { notFound } from "next/navigation";
import MachineDetailClient from "./client";

export const dynamic = "force-dynamic";

export default async function MachineDetail({
  params,
}: {
  params: Promise<{ machine_no: string }>;
}) {
  const { machine_no } = await params;
  const decoded = decodeURIComponent(machine_no);
  const supabase = await createClient();

  const [{ data: m, error }, { data: cases }, { data: customers }] = await Promise.all([
    supabase.from("machines").select("*").eq("machine_no", decoded).single(),
    supabase
      .from("cases")
      .select("so_number, status, service_type_name, service_type_code, due_date, close_date, customer_name, title")
      .eq("machine_no", decoded)
      .order("created_at", { ascending: false })
      .limit(30),
    supabase.from("customers").select("code, name, city").order("name"),
  ]);

  if (error || !m) notFound();

  return <MachineDetailClient machine={m} cases={cases ?? []} customers={customers ?? []} />;
}
