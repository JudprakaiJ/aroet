import "server-only";
import { createClient } from "@/lib/supabase/server";

export type NotificationItem = {
  id: string;
  kind: "approval" | "case_event";
  action: string;
  actor: string | null;
  so_number: string | null;
  comment: string | null;
  happened_at: string;
};

export async function getNotifications(engineerCode: string): Promise<NotificationItem[]> {
  const supabase = await createClient();

  const [{ data: mySessionIds }, { data: myCaseSOs }] = await Promise.all([
    supabase.from("sessions").select("id").eq("engineer_code", engineerCode).limit(2000),
    supabase.from("case_engineers").select("so_number").eq("engineer_code", engineerCode),
  ]);

  const sessionIds = (mySessionIds ?? []).map((r: { id: number }) => r.id);
  const caseSos = (myCaseSOs ?? []).map((r: { so_number: string }) => r.so_number);

  const [{ data: approvals }, { data: caseEvents }] = await Promise.all([
    sessionIds.length === 0
      ? Promise.resolve({ data: [] as unknown[] })
      : supabase
          .from("session_approval_log")
          .select("id, session_id, action, by_engineer, comment, created_at, sessions(so_number)")
          .in("session_id", sessionIds)
          .order("created_at", { ascending: false })
          .limit(30),
    caseSos.length === 0
      ? Promise.resolve({ data: [] as unknown[] })
      : supabase
          .from("admin_log")
          .select("id, so_number, event_type, description, by_engineer, recorded_at, event_date")
          .in("so_number", caseSos)
          .order("recorded_at", { ascending: false })
          .limit(30),
  ]);

  const approvalRows = ((approvals ?? []) as Array<{
    id: number;
    session_id: number;
    action: string;
    by_engineer: string | null;
    comment: string | null;
    created_at: string;
    sessions:
      | { so_number: string | null }
      | { so_number: string | null }[]
      | null;
  }>).map<NotificationItem>((r) => {
    const nested = Array.isArray(r.sessions) ? r.sessions[0] : r.sessions;
    return {
      id: `appr:${r.id}`,
      kind: "approval" as const,
      action: r.action,
      actor: r.by_engineer,
      so_number: nested?.so_number ?? null,
      comment: r.comment,
      happened_at: r.created_at,
    };
  });

  const caseRows = ((caseEvents ?? []) as Array<{
    id: number;
    so_number: string;
    event_type: string;
    description: string | null;
    by_engineer: string | null;
    recorded_at: string;
  }>).map<NotificationItem>((r) => ({
    id: `case:${r.id}`,
    kind: "case_event" as const,
    action: r.event_type,
    actor: r.by_engineer,
    so_number: r.so_number,
    comment: r.description,
    happened_at: r.recorded_at,
  }));

  const merged = [...approvalRows, ...caseRows]
    .filter((n) => n.actor !== engineerCode)
    .sort((a, b) => (a.happened_at > b.happened_at ? -1 : 1))
    .slice(0, 50);

  return merged;
}
