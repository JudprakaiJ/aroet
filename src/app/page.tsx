import { AppBar } from "@/components/app-bar";
import { DesktopTopBar } from "@/components/desktop-top";
import { SectionHeader } from "@/components/primitives/section-header";
import { EmptyState } from "@/components/primitives/empty-state";
import { QuickActionsHero } from "@/components/clock/quick-actions-hero";
import { StaleSessionBanner } from "@/components/clock/stale-session-banner";
import { CaseCard } from "@/components/dashboard/case-card";
import { SessionRow } from "@/components/dashboard/session-row";
import { UpcomingMini } from "@/components/dashboard/upcoming-mini";
import { DesktopDashboard } from "@/components/dashboard/desktop-dashboard";
import { getActiveSession } from "@/lib/clock/queries";
import { getNotifications } from "@/components/notifications/queries";
import {
  getMyActiveCases,
  getTodaySessions,
  getUpcomingThisWeek,
  getDashboardKpis,
  getPendingApprovalsTeaser,
  getRecentCases,
} from "@/app/dashboard/queries";
import { meCode } from "@/lib/auth/current-user";

export const dynamic = "force-dynamic";

export default async function DashboardPage() {
  const me = await meCode();
  const [myActive, today, upcoming, kpis, approvals, recent, activeSession, notifications] =
    await Promise.all([
      getMyActiveCases(),
      getTodaySessions(),
      getUpcomingThisWeek(),
      getDashboardKpis(),
      getPendingApprovalsTeaser(),
      getRecentCases(),
      getActiveSession(me),
      getNotifications(me),
    ]);

  return (
    <>
      <AppBar
        title="Dashboard"
        sub={`Hello ${me}`}
        activeSession={activeSession}
        notifications={notifications}
      />
      <DesktopTopBar
        title="Dashboard"
        crumbs={[{ label: "Workspace" }, { label: "Dashboard" }]}
        activeSession={activeSession}
        notifications={notifications}
      />

      {/* Mobile content */}
      <div className="scroll md:hidden">
        {activeSession && <StaleSessionBanner session={activeSession} />}
        <div className="page-px" style={{ paddingTop: 4 }}>
          <QuickActionsHero engineerCode={me} activeSession={activeSession} />
        </div>

        <SectionHeader
          title={`My active cases · ${myActive.length}`}
          action={{ label: "View all", href: "/cases" }}
        />
        {myActive.length === 0 ? (
          <div className="page-px">
            <EmptyState
              icon="folder"
              title="No active cases"
              body={`No active cases assigned to ${me}.`}
              compact
            />
          </div>
        ) : (
          <div className="page-px stack">
            {myActive.map((c) => (
              <CaseCard key={c.so_number} c={c} />
            ))}
          </div>
        )}

        <SectionHeader title="Today's sessions" />
        <div className="page-px">
          {today.length === 0 ? (
            <EmptyState
              icon="clock"
              title="No sessions today"
              body={
                <>
                  Tap <span style={{ color: "var(--red)", fontWeight: 600 }}>+</span> to log time.
                </>
              }
              compact
            />
          ) : (
            today.map((s) => <SessionRow key={s.id} s={s} />)
          )}
        </div>

        <SectionHeader title="Upcoming · this week" />
        <div className="page-px">
          <UpcomingMini items={upcoming} />
        </div>

        <div style={{ height: 24 }} />
      </div>

      {/* Desktop content */}
      <div className="dt-body hidden md:block">
        {activeSession && <StaleSessionBanner session={activeSession} />}
        <div style={{ marginBottom: 18 }}>
          <QuickActionsHero engineerCode={me} activeSession={activeSession} />
        </div>
        <DesktopDashboard kpis={kpis} approvals={approvals} recent={recent} />
      </div>
    </>
  );
}
