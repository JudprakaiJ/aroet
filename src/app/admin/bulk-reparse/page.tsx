import { AppBar } from "@/components/app-bar";
import { DesktopTopBar } from "@/components/desktop-top";
import { getActiveSession } from "@/lib/clock/queries";
import { getNotifications } from "@/components/notifications/queries";
import { meCode } from "@/lib/auth/current-user";
import { getDemoRole } from "@/app/me/role-actions";
import { getReparseCounts } from "./actions";
import { ReparseClient } from "./reparse-client";
import Link from "next/link";


export const dynamic = "force-dynamic";

export default async function BulkReparsePage() {
  const ME = await meCode();
  const [counts, activeSession, notifications, role] = await Promise.all([
    getReparseCounts(),
    getActiveSession(ME),
    getNotifications(ME),
    getDemoRole(),
  ]);

  const isAdmin = role === "admin";

  return (
    <>
      <AppBar
        title="Bulk reparse"
        sub={`${counts.totalWithPlannerNote} case${counts.totalWithPlannerNote === 1 ? "" : "s"} with planner note`}
        activeSession={activeSession}
        notifications={notifications}
      />
      <DesktopTopBar
        title="Bulk reparse"
        crumbs={[
          { label: "Workspace", href: "/" },
          { label: "Admin" },
          { label: "Bulk reparse" },
        ]}
        activeSession={activeSession}
        notifications={notifications}
      />
      <div className="scroll">
        <div style={{ padding: "0 14px 12px" }}>
          <div className="kicker">Re-parse planner notes into sessions, refs and admin log</div>
        </div>

        {!isAdmin && (
          <div
            className="card"
            style={{
              margin: "0 14px 12px",
              padding: 12,
              background: "var(--warn-soft)",
              color: "var(--warn)",
              borderColor: "rgba(217,119,6,.3)",
              fontSize: 12,
            }}
          >
            Switch to <strong>Admin</strong> view in{" "}
            <Link href="/me" style={{ color: "inherit", textDecoration: "underline" }}>
              /me
            </Link>{" "}
            before running — engineer view is read-only.
          </div>
        )}

        <ReparseClient counts={counts} />
      </div>
    </>
  );
}
