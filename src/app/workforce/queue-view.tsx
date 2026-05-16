import { createClient } from "@/lib/supabase/server";
import QueueClient from "./queue/client";
import WorkforceTabs from "./tabs";

interface Props {
  engineer?: string;
  status?: string;
  pendingCount: number;
}

export default async function QueueView({ engineer, status, pendingCount }: Props) {
  const supabase = await createClient();

  const filterStatus = status === "approved" ? "approved" : "submitted";

  let query = supabase
    .from("sessions")
    .select(
      "id, so_number, machine_no, engineer_code, session_date, travel_minutes, work_minutes, office_minutes, break_minutes, activity_type, work_done, is_weekend, approval_status, source, created_at"
    )
    .eq("approval_status", filterStatus)
    .order("session_date", { ascending: false });

  if (engineer && engineer !== "all") query = query.eq("engineer_code", engineer);

  const { data: sessions } = await query.limit(200);

  const [{ data: engineers }, { data: cases }] = await Promise.all([
    supabase.from("engineers").select("code, full_name, role").order("code"),
    supabase.from("cases").select("so_number, customer_name, title, service_type_name, machine_no"),
  ]);

  const counts = { submitted: 0, returned: 0, approved: 0 };
  const { count: submittedCount } = await supabase
    .from("sessions")
    .select("*", { count: "exact", head: true })
    .eq("approval_status", "submitted");
  const { count: returnedCount } = await supabase
    .from("sessions")
    .select("*", { count: "exact", head: true })
    .eq("approval_status", "returned");
  counts.submitted = submittedCount ?? 0;
  counts.returned = returnedCount ?? 0;

  const now = new Date();
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().split("T")[0];
  const { count: approvedCount } = await supabase
    .from("sessions")
    .select("*", { count: "exact", head: true })
    .eq("approval_status", "approved")
    .gte("session_date", monthStart);
  counts.approved = approvedCount ?? 0;

  return (
    <div className="max-w-7xl mx-auto px-6 py-6">
      <WorkforceTabs active="queue" pendingCount={pendingCount} />
      <QueueClient
        sessions={sessions ?? []}
        engineers={engineers ?? []}
        cases={cases ?? []}
        counts={counts}
        currentEngineer={engineer || "all"}
        currentStatus={filterStatus}
      />
    </div>
  );
}
