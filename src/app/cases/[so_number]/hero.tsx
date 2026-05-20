import Link from "next/link";
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
  const leadCode = c.assignees.find((a) => a.is_lead)?.engineer_code ?? null;

  return (
    <div style={{ padding: "0 14px 8px", display: "flex", flexDirection: "column", gap: 12 }}>
      <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
        <StatusPill s={c.status} />
        {c.service_type_code && <ServiceChip typ={c.service_type_code} full />}
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
          {c.title || "Untitled"}
        </div>
        {c.customer_name && (
          <div style={{ fontSize: 13, color: "var(--ink-3)", fontWeight: 500, marginTop: 2 }}>
            {c.customer_code ? (
              <Link
                href={`/customers/${encodeURIComponent(c.customer_code)}`}
                style={{ color: "inherit", textDecoration: "none" }}
              >
                {c.customer_name}
              </Link>
            ) : (
              c.customer_name
            )}
          </div>
        )}
      </div>

      <div
        className="card"
        style={{ padding: 12, display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}
      >
        <GridCell label="Machine">
          {c.machines.length === 0 ? (
            <Dash />
          ) : (
            <div style={{ display: "flex", flexWrap: "wrap", gap: 4 }}>
              {c.machines.map((m) => (
                <Link
                  key={m.machine_no}
                  href={`/machines/${encodeURIComponent(m.machine_no)}`}
                  style={{ textDecoration: "none" }}
                >
                  <CodeBadge>{m.machine_no}</CodeBadge>
                </Link>
              ))}
            </div>
          )}
        </GridCell>
        <GridCell label="Project">
          {c.project_code ? <CodeBadge>{c.project_code}</CodeBadge> : <Dash />}
        </GridCell>
        <GridCell label="Due">
          {c.due_date ? (
            <span className="mono" style={{ fontSize: 13, color: "var(--ink)", fontWeight: 600 }}>
              {fmtDate(c.due_date)}
            </span>
          ) : (
            <Dash />
          )}
        </GridCell>
        <GridCell label="Hours logged">
          {aggregates.hours_logged > 0 ? (
            <span className="mono" style={{ fontSize: 13, color: "var(--ink)", fontWeight: 600 }}>
              {aggregates.hours_logged}h
            </span>
          ) : (
            <Dash />
          )}
        </GridCell>
      </div>

      {c.assignees.length > 0 && (
        <div className="card" style={{ padding: 10, display: "flex", alignItems: "center", gap: 8 }}>
          <div style={{ display: "flex", gap: 4 }}>
            {c.assignees.map((a) => (
              <span
                key={a.engineer_code}
                style={{ position: "relative", display: "inline-flex" }}
                title={a.is_lead ? `${a.engineer_code} · lead` : a.engineer_code}
              >
                <Avatar code={a.engineer_code} />
                {a.is_lead && (
                  <span
                    aria-hidden
                    style={{
                      position: "absolute",
                      top: -3,
                      right: -3,
                      width: 12,
                      height: 12,
                      borderRadius: 6,
                      background: "var(--red)",
                      color: "#fff",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      border: "1.5px solid var(--surface)",
                    }}
                  >
                    <Icon name="star" size={8} />
                  </span>
                )}
              </span>
            ))}
          </div>
          {leadCode && (
            <span
              className="sub"
              style={{
                textTransform: "none",
                letterSpacing: 0,
                fontSize: 11,
                color: "var(--ink-3)",
                marginLeft: 4,
              }}
            >
              Lead: <span className="mono" style={{ fontWeight: 600 }}>{leadCode}</span>
            </span>
          )}
        </div>
      )}

      <DetailActions soNumber={c.so_number} status={c.status} machines={c.machines} />
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
