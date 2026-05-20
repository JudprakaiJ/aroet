import Link from "next/link";
import { notFound } from "next/navigation";
import { AppBar } from "@/components/app-bar";
import { DesktopTopBar } from "@/components/desktop-top";
import { getActiveSession } from "@/lib/clock/queries";
import { getNotifications } from "@/components/notifications/queries";
import { meCode } from "@/lib/auth/current-user";
import { CodeBadge } from "@/components/primitives/code-badge";
import { Icon } from "@/components/icons";
import { fmtDate } from "@/lib/format";
import { getMachine } from "../queries";
import { ServiceHistoryTable } from "./service-history-table";


export const dynamic = "force-dynamic";

export default async function MachineDetailPage({
  params,
}: {
  params: Promise<{ machine_no: string }>;
}) {
  const ME = await meCode();
  const { machine_no } = await params;
  const decoded = decodeURIComponent(machine_no);

  const [machine, activeSession, notifications] = await Promise.all([
    getMachine(decoded),
    getActiveSession(ME),
    getNotifications(ME),
  ]);

  if (!machine) notFound();

  return (
    <>
      <AppBar
        title={machine.name ?? machine.machine_no}
        sub={machine.machine_no}
        leftIcon="back"
        showSync={false}
        activeSession={activeSession}
        notifications={notifications}
      />
      <DesktopTopBar
        title={machine.name ?? machine.machine_no}
        crumbs={[
          { label: "Workspace", href: "/" },
          { label: "Machines", href: "/machines" },
          { label: machine.machine_no },
        ]}
        activeSession={activeSession}
        notifications={notifications}
      />
      <div className="scroll">
        <div style={{ padding: "0 14px 12px", display: "flex", flexDirection: "column", gap: 12 }}>
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
            <CodeBadge>{machine.machine_no}</CodeBadge>
            {machine.product_code && (
              <span className="chip" style={{ fontSize: 11 }}>
                {machine.product_code}
              </span>
            )}
            {machine.version ? (
              <span className="chip" style={{ fontSize: 11 }}>
                v{machine.version}
              </span>
            ) : (
              <span className="chip chip-soft" style={{ fontSize: 11, color: "var(--warn)" }}>
                Unknown version
              </span>
            )}
          </div>

          <div>
            <div
              style={{
                fontSize: 20,
                fontWeight: 700,
                color: "var(--ink)",
                lineHeight: 1.25,
                letterSpacing: "-0.01em",
              }}
            >
              {machine.name || machine.machine_no}
            </div>
            {machine.customer_code && (
              <div style={{ fontSize: 13, marginTop: 2 }}>
                <Link
                  href={`/customers/${encodeURIComponent(machine.customer_code)}`}
                  style={{ color: "var(--ink-3)", textDecoration: "none", fontWeight: 500 }}
                >
                  <Icon name="building" size={11} /> {machine.customer_name ?? machine.customer_code}
                </Link>
              </div>
            )}
          </div>

          <div className="card" style={{ padding: 12, display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
            <GridCell label="Serial">
              {machine.serial_no ? (
                <span className="mono" style={{ fontSize: 13, fontWeight: 600 }}>
                  {machine.serial_no}
                </span>
              ) : (
                <Dash />
              )}
            </GridCell>
            <GridCell label="Product">
              {machine.product_code ? (
                <span style={{ fontSize: 13, fontWeight: 600 }}>{machine.product_code}</span>
              ) : (
                <Dash />
              )}
            </GridCell>
            <GridCell label="Installed">
              <span className="mono" style={{ fontSize: 13, fontWeight: 600 }}>
                {fmtDate(machine.installation_date)}
              </span>
            </GridCell>
            <GridCell label="Warranty">
              <span className="mono" style={{ fontSize: 13, fontWeight: 600 }}>
                {fmtDate(machine.warranty_expiry)}
              </span>
            </GridCell>
          </div>

          {machine.notes && (
            <div className="card" style={{ padding: 12 }}>
              <div className="kicker" style={{ marginBottom: 4 }}>
                Notes
              </div>
              <div style={{ fontSize: 13, color: "var(--ink)", whiteSpace: "pre-wrap" }}>
                {machine.notes}
              </div>
            </div>
          )}

          <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 8 }}>
            <StatCard label="Cases" value={machine.totals.all} />
            <StatCard label="PM" value={machine.totals.pm} />
            <StatCard label="Curative" value={machine.totals.curative} />
          </div>
        </div>

        <div style={{ padding: "0 14px 8px" }}>
          <div className="kicker">Service history</div>
        </div>
        <ServiceHistoryTable cases={machine.cases} />

        <div style={{ height: 40 }} />
      </div>
    </>
  );
}

function GridCell({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <div className="kicker" style={{ marginBottom: 4 }}>
        {label}
      </div>
      <div style={{ minHeight: 22, display: "flex", alignItems: "center" }}>{children}</div>
    </div>
  );
}

function StatCard({ label, value }: { label: string; value: number }) {
  return (
    <div className="card" style={{ padding: 12, textAlign: "center" }}>
      <div style={{ fontSize: 22, fontWeight: 700, color: "var(--ink)", lineHeight: 1.1 }}>
        {value}
      </div>
      <div className="kicker" style={{ marginTop: 2 }}>
        {label}
      </div>
    </div>
  );
}

function Dash() {
  return (
    <span className="sub" style={{ textTransform: "none", letterSpacing: 0, fontSize: 12 }}>
      —
    </span>
  );
}
