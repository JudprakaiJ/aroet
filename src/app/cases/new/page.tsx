import { AppBar } from "@/components/app-bar";
import { DesktopTopBar } from "@/components/desktop-top";
import { createClient } from "@/lib/supabase/server";
import { getActiveSession } from "@/lib/clock/queries";
import { getNotifications } from "@/components/notifications/queries";
import { meCode } from "@/lib/auth/current-user";
import { NewCaseClient } from "./new-client";


export const dynamic = "force-dynamic";

type Customer = { code: string; name: string };
type Machine = { machine_no: string; customer_code: string | null; name: string | null; product_code: string | null };
type Engineer = { code: string; full_name: string | null; role: string | null };

export default async function NewCasePage() {
  const ME = await meCode();
  const supabase = await createClient();
  const [{ data: customers }, { data: machines }, { data: engineers }, activeSession, notifications] = await Promise.all([
    supabase.from("customers").select("code, name").order("name", { ascending: true }),
    supabase.from("machines").select("machine_no, customer_code, name, product_code").order("machine_no"),
    supabase.from("engineers").select("code, full_name, role").eq("is_active", true).order("code"),
    getActiveSession(ME),
    getNotifications(ME),
  ]);

  return (
    <>
      <AppBar
        title="New case"
        sub="Paste D365 title or enter manually"
        leftIcon="back"
        showSync={false}
        activeSession={activeSession}
        notifications={notifications}
      />
      <DesktopTopBar
        title="New case"
        crumbs={[{ label: "Workspace", href: "/" }, { label: "Cases", href: "/cases" }, { label: "New" }]}
        showClockIn={false}
        activeSession={activeSession}
        notifications={notifications}
      />
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
