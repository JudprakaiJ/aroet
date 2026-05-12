import { createClient } from "@/lib/supabase/server";
import NewCaseForm from "./form";

export default async function NewCasePage() {
  const supabase = await createClient();

  const [customers, engineers, machines] = await Promise.all([
    supabase.from("customers").select("code, name, city, country, contact_name, contact_mobile").order("name"),
    supabase.from("engineers").select("code, full_name, role").eq("is_active", true).order("code"),
    supabase.from("machines").select("machine_no, name, product_code, customer_code, version").eq("is_active", true).order("machine_no"),
  ]);

  return (
    <NewCaseForm
      customers={customers.data ?? []}
      engineers={engineers.data ?? []}
      machines={machines.data ?? []}
    />
  );
}
