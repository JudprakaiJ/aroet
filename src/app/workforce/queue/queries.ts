import "server-only";
import { createServiceClient } from "@/lib/supabase/service";

export type QueueSession = {
  id: number;
  engineer_code: string;
  engineer_name: string | null;
  session_date: string;
  so_number: string | null;
  type_code: string | null;
  activity_type: string | null;
  travel_minutes: number | null;
  work_minutes: number | null;
  office_minutes: number | null;
  break_minutes: number | null;
  work_done: string | null;
  is_weekend: boolean | null;
  approved_by: string | null;
  approved_at: string | null;
  return_reason: string | null;
  approval_status: string;
};

export type QueueGroup = {
  engineer_code: string;
  engineer_name: string | null;
  total_minutes: number;
  count: number;
  sessions: QueueSession[];
};

export async function listSubmittedSessions(): Promise<QueueGroup[]> {
  const supabase = createServiceClient();
  const { data, error } = await supabase
    .from("sessions")
    .select(
      "id, engineer_code, session_date, so_number, type_code, activity_type, travel_minutes, work_minutes, office_minutes, break_minutes, work_done, is_weekend, approved_by, approved_at, return_reason, approval_status"
    )
    .eq("approval_status", "submitted")
    .order("engineer_code", { ascending: true })
    .order("session_date", { ascending: true });

  if (error) {
    console.error("[listSubmittedSessions]", error.message);
    return [];
  }

  const engineerCodes = Array.from(
    new Set((data ?? []).map((s) => s.engineer_code))
  );
  const { data: engineers } = engineerCodes.length
    ? await supabase
        .from("engineers")
        .select("code, full_name")
        .in("code", engineerCodes)
    : { data: [] };
  const nameByCode = new Map<string, string | null>();
  for (const e of engineers ?? []) nameByCode.set(e.code, e.full_name);

  const groupsByCode = new Map<string, QueueGroup>();
  for (const s of data ?? []) {
    const name = nameByCode.get(s.engineer_code) ?? null;
    const total =
      (s.travel_minutes ?? 0) + (s.work_minutes ?? 0) + (s.office_minutes ?? 0);
    const session: QueueSession = {
      ...s,
      engineer_name: name,
    } as QueueSession;
    const existing = groupsByCode.get(s.engineer_code);
    if (existing) {
      existing.sessions.push(session);
      existing.total_minutes += total;
      existing.count += 1;
    } else {
      groupsByCode.set(s.engineer_code, {
        engineer_code: s.engineer_code,
        engineer_name: name,
        total_minutes: total,
        count: 1,
        sessions: [session],
      });
    }
  }

  return Array.from(groupsByCode.values()).sort((a, b) =>
    a.engineer_code.localeCompare(b.engineer_code)
  );
}
