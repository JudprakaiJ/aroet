import { notFound } from "next/navigation";
import { AppBar } from "@/components/app-bar";
import { DesktopTopBar } from "@/components/desktop-top";
import { getActiveSession } from "@/lib/clock/queries";
import { getNotifications } from "@/components/notifications/queries";
import { meCode } from "@/lib/auth/current-user";
import { CaseHero } from "./hero";

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
  listLiteCustomers,
  listLiteMachines,
  listLiteEngineers,
  getCasePlanRanges,
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
  const ME = await meCode();
  const { so_number } = await params;
  const decoded = decodeURIComponent(so_number);
  const { tab: rawTab } = await searchParams;
  const tab: TabId = (TAB_IDS as string[]).includes(rawTab ?? "") ? (rawTab as TabId) : "sessions";

  const c = await getCase(decoded);
  if (!c) notFound();

  const machineNos = c.machines.map((m) => m.machine_no);

  const [
    aggregates,
    sessions,
    references,
    log,
    customer,
    machineDetails,
    similar,
    activeSession,
    notifications,
    liteCustomers,
    liteMachines,
    liteEngineers,
    planRanges,
  ] = await Promise.all([
    getCaseAggregates(decoded),
    tab === "sessions" ? getCaseSessions(decoded) : Promise.resolve([]),
    tab === "refs" ? getCaseReferences(decoded) : Promise.resolve([]),
    tab === "admin" ? getAdminLog(decoded) : Promise.resolve([]),
    tab === "refs" ? getCustomerDetail(c.customer_code) : Promise.resolve(null),
    tab === "refs" ? getMachineDetails(machineNos) : Promise.resolve([]),
    tab === "similar" ? getSimilar(c) : Promise.resolve([]),
    getActiveSession(ME),
    getNotifications(ME),
    listLiteCustomers(),
    listLiteMachines(),
    listLiteEngineers(),
    getCasePlanRanges(decoded),
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
        <CaseHero
          c={c}
          aggregates={aggregates}
          customers={liteCustomers}
          allMachines={liteMachines}
          engineers={liteEngineers}
          planRanges={planRanges}
        />
        <TabsStrip
          soNumber={c.so_number}
          active={tab}
          tabs={[
            { id: "sessions", label: "Sessions", count: aggregates.sessions_count },
            { id: "tasks", label: "Checklist", count: null },
            { id: "refs", label: "Refs", count: aggregates.refs_count },
            { id: "admin", label: "Admin", count: aggregates.admin_count },
          ]}
        />
        {tab === "sessions" && <SessionsTab so_number={c.so_number} sessions={sessions} />}
        {tab === "refs" && (
          <RefsTab
            customer={customer}
            machines={machineDetails}
            references={references}
          />
        )}
        {tab === "admin" && <AdminTab c={c} log={log} />}
        {tab === "tasks" && <ChecklistTab c={c} />}
        {tab === "similar" && <SimilarTab items={similar} />}
        {tab !== "similar" && (
          <div className="page-px" style={{ paddingTop: 16, paddingBottom: 32 }}>
            <a
              href={`/cases/${c.so_number}?tab=similar`}
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: 6,
                fontSize: 12,
                color: "var(--ink-3)",
                textDecoration: "none",
                fontWeight: 500,
              }}
            >
              See similar cases →
            </a>
          </div>
        )}
      </div>
    </>
  );
}
