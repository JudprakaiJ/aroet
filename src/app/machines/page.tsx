import { AppBar } from "@/components/app-bar";
import { DesktopTopBar } from "@/components/desktop-top";
import { getActiveSession } from "@/lib/clock/queries";
import { getNotifications } from "@/components/notifications/queries";
import { currentUser, isApprover, meCode } from "@/lib/auth/current-user";
import { listMachines } from "./queries";
import { listCustomersLite } from "../customers/queries";
import { MachineFilterBar } from "./filter-bar";
import { MachineListRow } from "./list-row";
import { DesktopMachinesTable } from "./desktop-machines-table";
import { NewMachineButton } from "./new-machine-button";


export const dynamic = "force-dynamic";

export default async function MachinesPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>;
}) {
  const ME = await meCode();
  const sp = await searchParams;
  const q = sp.q ?? "";

  const [machines, activeSession, notifications, me] = await Promise.all([
    listMachines({ q }),
    getActiveSession(ME),
    getNotifications(ME),
    currentUser(),
  ]);
  const isAdmin = !!me && isApprover(me.role);
  const customersLite = isAdmin ? await listCustomersLite() : [];

  return (
    <>
      <AppBar
        title="Machines"
        sub={`${machines.length} result${machines.length === 1 ? "" : "s"}`}
        activeSession={activeSession}
        notifications={notifications}
      />
      <DesktopTopBar
        title="Machines"
        crumbs={[{ label: "Workspace", href: "/" }, { label: "Machines" }]}
        activeSession={activeSession}
        notifications={notifications}
      />

      {/* Mobile */}
      <div className="scroll md:hidden">
        <div style={{ padding: "0 14px 8px", display: "flex", gap: 8, alignItems: "center" }}>
          <div style={{ flex: 1 }}>
            <MachineFilterBar initialQ={q} />
          </div>
          {isAdmin && <NewMachineButton customers={customersLite} />}
        </div>
        {machines.length === 0 ? (
          <div
            style={{
              margin: "8px 14px",
              padding: 24,
              textAlign: "center",
              color: "var(--ink-3)",
              border: "1px dashed var(--line-2)",
              borderRadius: "var(--r-lg)",
            }}
          >
            {q ? "No machines match." : "No machines yet."}
          </div>
        ) : (
          <div className="card" style={{ margin: "8px 14px 14px", overflow: "hidden" }}>
            {machines.map((m) => (
              <MachineListRow key={m.machine_no} m={m} />
            ))}
          </div>
        )}
      </div>

      {/* Desktop */}
      <div className="dt-body hidden md:block">
        <div className="dt-panel">
          <div
            style={{
              padding: "10px 16px",
              display: "flex",
              gap: 10,
              alignItems: "center",
              borderBottom: "1px solid var(--line-2)",
              background: "var(--surface)",
            }}
          >
            <div style={{ flex: "0 1 480px" }}>
              <MachineFilterBar initialQ={q} />
            </div>
            <span style={{ fontSize: 11.5, color: "var(--ink-3)", marginLeft: "auto" }}>
              {machines.length} result{machines.length === 1 ? "" : "s"}
            </span>
            {isAdmin && <NewMachineButton customers={customersLite} />}
          </div>
          <DesktopMachinesTable machines={machines} />
        </div>
      </div>
    </>
  );
}
