import "server-only";
import { createClient } from "@/lib/supabase/server";
import type { ActiveSession } from "./types";

export async function getActiveSession(engineerCode: string): Promise<ActiveSession | null> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("sessions")
    .select(
      `id, so_number, machine_no, engineer_code, activity_type, type_code,
       clock_in_at, paused_at, paused_total_minutes,
       cases(title, customer_name)`
    )
    .eq("engineer_code", engineerCode)
    .not("clock_in_at", "is", null)
    .is("clock_out_at", null)
    .order("clock_in_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (!data) return null;
  const row = data as unknown as {
    id: number;
    so_number: string | null;
    machine_no: string | null;
    engineer_code: string;
    activity_type: string | null;
    type_code: string | null;
    clock_in_at: string;
    paused_at: string | null;
    paused_total_minutes: number | null;
    cases:
      | { title: string | null; customer_name: string | null }
      | { title: string | null; customer_name: string | null }[]
      | null;
  };
  const nested = Array.isArray(row.cases) ? row.cases[0] : row.cases;
  return {
    id: row.id,
    so_number: row.so_number,
    machine_no: row.machine_no,
    engineer_code: row.engineer_code,
    activity_type: row.activity_type ?? "field",
    type_code: row.type_code ?? "T",
    clock_in_at: row.clock_in_at,
    paused_at: row.paused_at,
    paused_total_minutes: row.paused_total_minutes ?? 0,
    case_title: nested?.title ?? null,
    customer_name: nested?.customer_name ?? null,
  };
}
