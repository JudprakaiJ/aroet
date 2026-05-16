import { createServiceClient } from "@/lib/supabase/service";
import PlanView from "./plan-view";
import HoursView from "./hours-view";
import QueueView from "./queue-view";

export const dynamic = "force-dynamic";

export default async function WorkforcePage({
  searchParams,
}: {
  searchParams: Promise<{
    tab?: string;
    // Plan
    from?: string;
    weeks?: string;
    // Hours
    preset?: any;
    year?: string;
    month?: string;
    start?: string;
    end?: string;
    eng?: string;
    // Queue
    engineer?: string;
    status?: string;
  }>;
}) {
  const params = await searchParams;
  const tab = params.tab || "plan";

  // Get pending count for tab badge (shared across all views)
  const supabase = createServiceClient();
  const { count: pendingCount } = await supabase
    .from("sessions")
    .select("*", { count: "exact", head: true })
    .eq("approval_status", "submitted");

  if (tab === "hours") {
    return (
      <HoursView
        preset={params.preset}
        year={params.year}
        month={params.month}
        start={params.start}
        end={params.end}
        eng={params.eng}
        pendingCount={pendingCount ?? 0}
      />
    );
  }

  if (tab === "queue") {
    return (
      <QueueView
        engineer={params.engineer}
        status={params.status}
        pendingCount={pendingCount ?? 0}
      />
    );
  }

  // Default: plan
  return (
    <PlanView from={params.from} weeks={params.weeks} pendingCount={pendingCount ?? 0} />
  );
}
