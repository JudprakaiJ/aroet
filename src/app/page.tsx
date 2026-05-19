import { AppBar } from "@/components/app-bar";
import { SectionHeader } from "@/components/primitives/section-header";
import { SmartStartCTA } from "@/components/dashboard/smart-start-cta";
import { CaseCard } from "@/components/dashboard/case-card";
import { SessionRow } from "@/components/dashboard/session-row";
import { UpcomingMini } from "@/components/dashboard/upcoming-mini";
import {
  DASHBOARD_ENGINEER,
  getMyActiveCases,
  getTodaySessions,
  getUpcomingThisWeek,
} from "@/app/dashboard/queries";

export const dynamic = "force-dynamic";

export default async function DashboardPage() {
  const [myActive, today, upcoming] = await Promise.all([
    getMyActiveCases(),
    getTodaySessions(),
    getUpcomingThisWeek(),
  ]);

  return (
    <>
      <AppBar title="Dashboard" sub={`Hello ${DASHBOARD_ENGINEER}`} />
      <div className="scroll">
        <div style={{ padding: "10px 14px 4px" }}>
          <SmartStartCTA engineerCode={DASHBOARD_ENGINEER} />
        </div>

        <SectionHeader
          title={`My active cases · ${myActive.length}`}
          action={{ label: "View all", href: "/cases" }}
        />
        {myActive.length === 0 ? (
          <div style={{ padding: "0 14px" }}>
            <div
              className="card"
              style={{ padding: 18, textAlign: "center" }}
            >
              <div
                className="sub"
                style={{
                  textTransform: "none",
                  letterSpacing: 0,
                  fontSize: 13,
                  color: "var(--ink-3)",
                }}
              >
                No active cases assigned to {DASHBOARD_ENGINEER}.
              </div>
            </div>
          </div>
        ) : (
          <div style={{ padding: "0 14px", display: "flex", flexDirection: "column", gap: 8 }}>
            {myActive.map((c) => (
              <CaseCard key={c.so_number} c={c} />
            ))}
          </div>
        )}

        <SectionHeader title="Today's sessions" />
        <div style={{ padding: "0 14px" }}>
          {today.length === 0 ? (
            <div className="card" style={{ padding: 18, textAlign: "center" }}>
              <div
                className="sub"
                style={{
                  textTransform: "none",
                  letterSpacing: 0,
                  fontSize: 13,
                  color: "var(--ink-3)",
                }}
              >
                No sessions today. Tap{" "}
                <span style={{ color: "var(--red)", fontWeight: 600 }}>+</span> to log time.
              </div>
            </div>
          ) : (
            today.map((s) => <SessionRow key={s.id} s={s} />)
          )}
        </div>

        <SectionHeader title="Upcoming · this week" />
        <div style={{ padding: "0 14px" }}>
          <UpcomingMini items={upcoming} />
        </div>

        <div style={{ height: 24 }} />
      </div>
    </>
  );
}
