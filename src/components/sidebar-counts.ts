import "server-only";
import { createClient } from "@/lib/supabase/server";

export type SidebarCounts = {
  cases: number;
  pendingApprovals: number;
};

export async function getSidebarCounts(): Promise<SidebarCounts> {
  const supabase = await createClient();
  const [{ count: casesCount }, { count: pendingCount }] = await Promise.all([
    supabase
      .from("cases")
      .select("so_number", { count: "exact", head: true })
      .in("status", ["planned", "in_progress", "completed"]),
    supabase
      .from("sessions")
      .select("id", { count: "exact", head: true })
      .eq("approval_status", "submitted"),
  ]);
  return {
    cases: casesCount ?? 0,
    pendingApprovals: pendingCount ?? 0,
  };
}
