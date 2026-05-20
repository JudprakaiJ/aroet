import { AppBar } from "@/components/app-bar";
import { DesktopTopBar } from "@/components/desktop-top";
import { getActiveSession } from "@/lib/clock/queries";
import { getNotifications } from "@/components/notifications/queries";
import { meCode } from "@/lib/auth/current-user";
import { listMachines } from "./queries";
import { MachineFilterBar } from "./filter-bar";
import { MachineListRow } from "./list-row";
import { DesktopMachinesTable } from "./desktop-machines-table";


export const dynamic = "force-dynamic";

export default async function MachinesPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; version?: string }>;
}) {
  const ME = await meCode();
  const sp = await searchParams;
  const q = sp.q ?? "";
  const unknownVersion = sp.version === "unknown";

  const [machines, activeSession, notifications] = await Promise.all([
    listMachines({ q, unknownVersion }),
    getActiveSession(ME),
    getNotifications(ME),
  ]);

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
        <div style={{ padding: "0 14px 8px" }}>
          <MachineFilterBar initialQ={q} unknownVersion={unknownVersion} />
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
            {q || unknownVersion ? "No machines match." : "No machines yet."}
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
              <MachineFilterBar initialQ={q} unknownVersion={unknownVersion} />
            </div>
            <span style={{ fontSize: 11.5, color: "var(--ink-3)", marginLeft: "auto" }}>
              {machines.length} result{machines.length === 1 ? "" : "s"}
            </span>
          </div>
          <DesktopMachinesTable machines={machines} />
        </div>
      </div>
    </>
  );
}
