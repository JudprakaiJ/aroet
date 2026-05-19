import { notFound } from "next/navigation";
import { AppBar } from "@/components/app-bar";
import { DesktopTopBar } from "@/components/desktop-top";
import { getActiveSession } from "@/lib/clock/queries";
import { getNotifications } from "@/components/notifications/queries";
import { CaseHero } from "./hero";

const ME = "JKH";
import { TabsStrip } from "./tabs-strip";
import { SessionsTab } from "./sessions-tab";
import { RefsTab } from "./refs-tab";
import { AdminTab } from "./admin-tab";
import { ChecklistTab } from "./checklist-tab";
import { SimilarTab } from "./similar-tab";
import {
  getCase,
  getCaseAggregates,
  getCaseSessions,
  getCaseReferences,
  getAdminLog,
  getCustomerDetail,
  getMachineDetails,
  getSimilar,
} from "./queries";

export const dynamic = "force-dynamic";

type TabId = "sessions" | "refs" | "admin" | "tasks" | "similar";
const TAB_IDS: TabId[] = ["sessions", "refs", "admin", "tasks", "similar"];

export default async function CaseDetailPage({
  params,
  searchParams,
}: {
  params: Promise<{ so_number: string }>;
  searchParams: Promise<{ tab?: string }>;
}) {
  const { so_number } = await params;
  const decoded = decodeURIComponent(so_number);
  const { tab: rawTab } = await searchParams;
  const tab: TabId = (TAB_IDS as string[]).includes(rawTab ?? "") ? (rawTab as TabId) : "sessions";

  const c = await getCase(decoded);
  if (!c) notFound();

  const machineNos = c.machines.map((m) => m.machine_no);

  const [aggregates, sessions, references, log, customer, machineDetails, similar, activeSession, notifications] =
    await Promise.all([
      getCaseAggregates(decoded),
      tab === "sessions" ? getCaseSessions(decoded) : Promise.resolve([]),
      tab === "refs" ? getCaseReferences(decoded) : Promise.resolve([]),
      tab === "admin" ? getAdminLog(decoded) : Promise.resolve([]),
      tab === "refs" ? getCustomerDetail(c.customer_code) : Promise.resolve(null),
      tab === "refs" ? getMachineDetails(machineNos) : Promise.resolve([]),
      tab === "similar" ? getSimilar(c) : Promise.resolve([]),
      getActiveSession(ME),
      getNotifications(ME),
    ]);

  return (
    <>
      <AppBar
        title="Case detail"
        sub={c.so_number}
        leftIcon="back"
        showSync={false}
        activeSession={activeSession}
        notifications={notifications}
      />
      <DesktopTopBar
        title={c.title ?? "Case detail"}
        crumbs={[
          { label: "Workspace", href: "/" },
          { label: "Cases", href: "/cases" },
          { label: c.so_number },
        ]}
        activeSession={activeSession}
        notifications={notifications}
      />
      <div className="scroll">
        <CaseHero c={c} aggregates={aggregates} />
        <TabsStrip
          soNumber={c.so_number}
          active={tab}
          tabs={[
            { id: "sessions", label: "Sessions", count: aggregates.sessions_count },
            { id: "refs", label: "Refs", count: c.machines.length },
            { id: "admin", label: "Admin", count: null },
            { id: "tasks", label: "Tasks", count: null },
            { id: "similar", label: "Similar", count: null },
          ]}
        />
        {tab === "sessions" && <SessionsTab so_number={c.so_number} sessions={sessions} />}
        {tab === "refs" && (
          <RefsTab
            customer={customer}
            machines={machineDetails}
            references={references}
            description={c.description}
          />
        )}
        {tab === "admin" && <AdminTab c={c} log={log} />}
        {tab === "tasks" && <ChecklistTab c={c} />}
        {tab === "similar" && <SimilarTab items={similar} />}
      </div>
    </>
  );
}
