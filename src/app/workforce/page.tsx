import { createServiceClient } from "@/lib/supabase/service";
import { computePayPeriod, type PayPeriodPreset } from "@/lib/pay-period";
import WorkforceCalendar from "./calendar";

export const dynamic = "force-dynamic";

interface Props {
  searchParams: Promise<{
    preset?: PayPeriodPreset;
    year?: string;
    month?: string;
    start?: string;
    end?: string;
    eng?: string;
  }>;
}

export default async function WorkforcePage({ searchParams }: Props) {
  const params = await searchParams;
  const now = new Date();
  const preset: PayPeriodPreset = (params.preset as PayPeriodPreset) || "h1_1_20";
  const year = parseInt(params.year || String(now.getFullYear()));
  const month = parseInt(params.month || String(now.getMonth() + 1));
  const period = computePayPeriod(preset, year, month, params.start, params.end);

  const supabase = createServiceClient();

  // 1. Engineers — schema uses 'full_name' (not 'name')
  const { data: engineersRaw } = await supabase
    .from("engineers")
    .select("code, full_name, role, is_active")
    .order("code");

  // Map full_name → name for the calendar component
  const engineers = (engineersRaw || []).map((e: any) => ({
    code: e.code,
    name: e.full_name,
    role: e.role,
  }));

  // 2. Sessions within period (including shared session info)
  const { data: sessions } = await supabase
    .from("sessions")
    .select(
      "id, so_number, session_date, engineer_code, activity_type, travel_minutes, break_minutes, work_minutes, office_minutes, is_holiday, is_weekend, approval_status, work_done, is_shared, shared_with_so"
    )
    .gte("session_date", period.start)
    .lte("session_date", period.end)
    .order("session_date");

  // 3. Cases referenced (to show SO + machine + customer in drill-down)
  // Schema uses: service_type_name (not service_type), customer_name (not customer_code)
  const soNumbers = Array.from(new Set((sessions || []).map((s: any) => s.so_number)));
  const { data: casesRaw, error: caseErr } =
    soNumbers.length > 0
      ? await supabase
          .from("cases")
          .select("so_number, title, service_type_name, customer_name, machine_no")
          .in("so_number", soNumbers)
      : { data: [], error: null };
  if (caseErr) {
    console.error("[workforce] cases query error:", caseErr.message);
  }
  // Map to the shape calendar.tsx expects
  const cases = (casesRaw || []).map((c: any) => ({
    so_number: c.so_number,
    title: c.title,
    service_type: c.service_type_name,
    customer_code: c.customer_name,
    machine_no: c.machine_no,
  }));

  return (
    <WorkforceCalendar
      engineers={engineers}
      sessions={sessions || []}
      cases={cases}
      period={period}
      preset={preset}
      year={year}
      month={month}
      filterEngineer={params.eng}
    />
  );
}
