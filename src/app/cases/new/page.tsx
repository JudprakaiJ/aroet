import { AppBar } from "@/components/app-bar";
import { createClient } from "@/lib/supabase/server";
import { NewCaseClient } from "./new-client";

export const dynamic = "force-dynamic";

type Customer = { code: string; name: string };
type Machine = { machine_no: string; customer_code: string | null; name: string | null; product_code: string | null };
type Engineer = { code: string; full_name: string | null; role: string | null };

export default async function NewCasePage() {
  const supabase = await createClient();
  const [{ data: customers }, { data: machines }, { data: engineers }] = await Promise.all([
    supabase.from("customers").select("code, name").order("name", { ascending: true }),
    supabase.from("machines").select("machine_no, customer_code, name, product_code").order("machine_no"),
    supabase.from("engineers").select("code, full_name, role").eq("is_active", true).order("code"),
  ]);

  return (
    <>
      <AppBar title="New case" sub="Paste D365 title or enter manually" leftIcon="back" showSync={false} showBell={false} />
      <div className="scroll">
        <NewCaseClient
          customers={(customers ?? []) as Customer[]}
          machines={(machines ?? []) as Machine[]}
          engineers={(engineers ?? []) as Engineer[]}
        />
      </div>
    </>
  );
}
