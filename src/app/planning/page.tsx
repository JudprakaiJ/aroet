import { createClient } from "@/lib/supabase/server";
import PlanningGrid from "./grid";

export const dynamic = "force-dynamic";

export default async function PlanningPage({
  searchParams,
}: {
  searchParams: Promise<{ from?: string; weeks?: string }>;
}) {
  const sp = await searchParams;
  const weeks = parseInt(sp.weeks || "8");

  // Default start = beginning of this week (Monday)
  const today = new Date();
  const monday = new Date(today);
  const day = monday.getDay();
  const diff = day === 0 ? -6 : 1 - day; // Sunday → -6, else 1-day
  monday.setDate(monday.getDate() + diff);
  monday.setHours(0, 0, 0, 0);

  const fromDate = sp.from ? new Date(sp.from) : monday;
  const toDate = new Date(fromDate);
  toDate.setDate(toDate.getDate() + weeks * 7 - 1);

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
      <div className="p-6 text-red-600 text-[14px]">
        Error: {engineersRes.error?.message || sessionsRes.error?.message}
      </div>
    );
  }

  return (
    <PlanningGrid
      engineers={engineersRes.data ?? []}
      sessions={sessionsRes.data ?? []}
      cases={casesRes.data ?? []}
      fromDate={fromIso}
      toDate={toIso}
      weeks={weeks}
    />
  );
}
