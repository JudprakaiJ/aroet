import { StatusPill } from "@/components/primitives/status-pill";
import { ServiceChip } from "@/components/primitives/service-chip";
import { Avatar } from "@/components/primitives/avatar";
import { CodeBadge } from "@/components/primitives/code-badge";
import { Icon } from "@/components/icons";
import { fmtDate } from "@/lib/format";
import { DetailActions } from "./detail-actions";
import type { CaseDetail, CaseAggregates } from "./queries";

type Props = {
  c: CaseDetail;
  aggregates: CaseAggregates;
};

export function CaseHero({ c, aggregates }: Props) {
  const primaryMachine = c.machines.find((m) => m.is_primary)?.machine_no ?? c.machines[0]?.machine_no ?? null;

  return (
    <div style={{ padding: "0 14px 8px", display: "flex", flexDirection: "column", gap: 12 }}>
      <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
        <StatusPill s={c.status} />
        {c.service_type_code && <ServiceChip typ={c.service_type_code} full />}
      </div>

      <div>
        <div style={{ fontSize: 20, fontWeight: 700, color: "var(--ink)", lineHeight: 1.25, letterSpacing: "-0.01em" }}>
          {c.title || "Untitled case"}
        </div>
        {c.customer_name && (
          <div style={{ fontSize: 13, color: "var(--ink-3)", fontWeight: 500, marginTop: 2 }}>
            {c.customer_name}
          </div>
        )}
      </div>

      <div className="card" style={{ padding: 12, display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
        <GridCell label="Machine">
          {c.machines.length === 0 ? (
            <span className="sub" style={{ textTransform: "none", letterSpacing: 0, fontSize: 12 }}>
              — none —
            </span>
          ) : (
            <div style={{ display: "flex", flexWrap: "wrap", gap: 4 }}>
              {c.machines.map((m) => (
                <CodeBadge key={m.machine_no}>{m.machine_no}</CodeBadge>
              ))}
            </div>
          )}
        </GridCell>
        <GridCell label="Project">
          {c.project_code ? <CodeBadge>{c.project_code}</CodeBadge> : <Dash />}
        </GridCell>
        <GridCell label="Due">
          <span className="mono" style={{ fontSize: 13, color: "var(--ink)", fontWeight: 600 }}>
            {fmtDate(c.due_date)}
          </span>
        </GridCell>
        <GridCell label="Hours logged">
          <span className="mono" style={{ fontSize: 13, color: "var(--ink)", fontWeight: 600 }}>
            {aggregates.hours_logged}h
          </span>
        </GridCell>
      </div>

      {c.assignees.length > 0 && (
        <div className="card" style={{ padding: 10, display: "flex", alignItems: "center", gap: 8 }}>
          <div style={{ display: "flex", gap: 4 }}>
            {c.assignees.map((a) => (
              <Avatar key={a.engineer_code} code={a.engineer_code} />
            ))}
          </div>
          <div style={{ marginLeft: "auto", display: "flex", gap: 6, alignItems: "center" }}>
            {c.assignees
              .filter((a) => a.is_lead)
              .map((a) => (
                <span key={a.engineer_code} className="chip chip-red mono">
                  <Icon name="star" size={11} /> Lead {a.engineer_code}
                </span>
              ))}
          </div>
        </div>
      )}

      <DetailActions
        soNumber={c.so_number}
        status={c.status}
        primaryMachineNo={primaryMachine}
      />
    </div>
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

function Dash() {
  return (
    <span className="sub" style={{ textTransform: "none", letterSpacing: 0, fontSize: 12 }}>
      —
    </span>
  );
}
