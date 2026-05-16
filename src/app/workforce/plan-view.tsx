import { createClient } from "@/lib/supabase/server";
import PlanningGrid from "../planning/grid";
import WorkforceTabs from "./tabs";

interface Props {
  from?: string;
  weeks?: string;
  pendingCount: number;
}

export default async function PlanView({ from, weeks, pendingCount }: Props) {
  const weeksNum = parseInt(weeks || "8");

  const today = new Date();
  const monday = new Date(today);
  const day = monday.getDay();
  const diff = day === 0 ? -6 : 1 - day;
  monday.setDate(monday.getDate() + diff);
  monday.setHours(0, 0, 0, 0);

  const fromDate = from ? new Date(from) : monday;
  const toDate = new Date(fromDate);
  toDate.setDate(toDate.getDate() + weeksNum * 7 - 1);

  const fromIso = fromDate.toISOString().split("T")[0];
  const toIso = toDate.toISOString().split("T")[0];

  const supabase = await createClient();

  const [engineersRes, sessionsRes, casesRes] = await Promise.all([
    supabase
      .from("engineers")
      .select("code, full_name, role, is_active")
      .eq("is_active", true)
      .order("code"),
    supabase
      .from("sessions")
      .select(
        "id, so_number, machine_no, engineer_code, session_date, type_code, activity_type, travel_minutes, work_minutes, office_minutes, work_done"
      )
      .gte("session_date", fromIso)
      .lte("session_date", toIso),
    supabase
      .from("cases")
      .select("so_number, project_code, service_type_code, customer_name, title"),
  ]);

  if (engineersRes.error || sessionsRes.error) {
    return (
      <div className="max-w-7xl mx-auto px-6 py-6">
        <WorkforceTabs active="plan" pendingCount={pendingCount} />
        <div className="text-red-600 text-[14px]">
          Error: {engineersRes.error?.message || sessionsRes.error?.message}
        </div>
      </div>
    );
  }

  return (
    <div className="px-6 py-6">
      <div className="max-w-7xl mx-auto">
        <WorkforceTabs active="plan" pendingCount={pendingCount} />
      </div>
      <PlanningGrid
        engineers={engineersRes.data ?? []}
        sessions={sessionsRes.data ?? []}
        cases={casesRes.data ?? []}
        fromDate={fromIso}
        toDate={toIso}
        weeks={weeksNum}
      />
    </div>
  );
}
