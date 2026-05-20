import { AppBar } from "@/components/app-bar";
import { DesktopTopBar } from "@/components/desktop-top";
import { getActiveSession } from "@/lib/clock/queries";
import { getNotifications } from "@/components/notifications/queries";
import { meCode } from "@/lib/auth/current-user";
import { getDemoRole, getActingAs } from "@/app/me/role-actions";
import { listSubmittedSessions } from "./queries";
import { QueueSection } from "./queue-section";


export const dynamic = "force-dynamic";

export default async function ApprovalsQueuePage() {
  const ME = await meCode();
  const [groups, activeSession, notifications, role, actingAs] = await Promise.all([
    listSubmittedSessions(),
    getActiveSession(ME),
    getNotifications(ME),
    getDemoRole(),
    getActingAs(),
  ]);

  const sessionsCount = groups.reduce((sum, g) => sum + g.count, 0);
  const isAdmin = role === "admin";

  return (
    <>
      <AppBar
        title="Approvals"
        sub={`${sessionsCount} session${sessionsCount === 1 ? "" : "s"} · ${groups.length} engineer${groups.length === 1 ? "" : "s"}`}
        activeSession={activeSession}
        notifications={notifications}
      />
      <DesktopTopBar
        title="Approvals queue"
        crumbs={[
          { label: "Workspace", href: "/" },
          { label: "Workforce", href: "/workforce" },
          { label: "Approvals" },
        ]}
        activeSession={activeSession}
        notifications={notifications}
      />
      <div className="scroll">
        <div style={{ padding: "0 14px 12px" }}>
          <div className="kicker">Pending submissions</div>
        </div>
        <QueueSection groups={groups} isAdmin={isAdmin} actingAs={actingAs} />
        <div style={{ height: 40 }} />
      </div>
    </>
  );
}
