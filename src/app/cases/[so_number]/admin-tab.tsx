import { Avatar } from "@/components/primitives/avatar";
import { CodeBadge } from "@/components/primitives/code-badge";
import { adminEventLabel, fmtDate } from "@/lib/format";
import type { AdminLogEntry, CaseDetail } from "./queries";

const LIFECYCLE: { id: string; label: string }[] = [
  { id: "planned",     label: "Planned" },
  { id: "in_progress", label: "In progress" },
  { id: "completed",   label: "Completed" },
  { id: "verified",    label: "Verified" },
];

function lifecycleIndex(status: string): number {
  if (status === "canceled") return -1;
  return Math.max(0, LIFECYCLE.findIndex((s) => s.id === status));
}

export function AdminTab({ c, log }: { c: CaseDetail; log: AdminLogEntry[] }) {
  const idx = lifecycleIndex(c.status);
  return (
    <div style={{ padding: "0 14px 24px", display: "flex", flexDirection: "column", gap: 12 }}>
      <div className="card" style={{ padding: 14 }}>
        <div className="kicker" style={{ marginBottom: 8 }}>
          Identifiers
        </div>
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
          <CodeBadge>{c.so_number}</CodeBadge>
          {c.sr_number && <CodeBadge>{c.sr_number}</CodeBadge>}
          {c.project_code && <CodeBadge>{c.project_code}</CodeBadge>}
          {c.service_type_code && (
            <CodeBadge>
              {c.service_type_code}
              {c.service_type_name ? ` · ${c.service_type_name}` : ""}
            </CodeBadge>
          )}
          {c.customer_po && <CodeBadge>PO {c.customer_po}</CodeBadge>}
        </div>
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "1fr 1fr",
            gap: 10,
            marginTop: 12,
            fontSize: 12,
            color: "var(--ink-3)",
          }}
        >
          <div>
            <div className="kicker">Created</div>
            <div className="mono" style={{ fontSize: 13, color: "var(--ink-2)" }}>
              {fmtDate(c.created_at)}
            </div>
          </div>
          <div>
            <div className="kicker">Source</div>
            <div className="mono" style={{ fontSize: 13, color: "var(--ink-2)" }}>
              {c.source ?? "—"}
            </div>
          </div>
        </div>
      </div>

      <div className="card" style={{ padding: 14 }}>
        <div className="kicker" style={{ marginBottom: 10 }}>
          Lifecycle
        </div>
        <div style={{ display: "flex", gap: 4 }}>
          {LIFECYCLE.map((step, i) => {
            const done = idx >= i;
            const current = idx === i;
            return (
              <div
                key={step.id}
                style={{
                  flex: 1,
                  padding: "6px 4px",
                  borderRadius: 6,
                  textAlign: "center",
                  background: current ? "var(--red-50)" : done ? "var(--ok-soft)" : "var(--surface-2)",
                  border: `1px solid ${current ? "var(--red-line)" : done ? "rgba(22,163,74,.3)" : "var(--line)"}`,
                  color: current ? "var(--red)" : done ? "var(--ok)" : "var(--ink-3)",
                  fontSize: 11,
                  fontWeight: 600,
                  letterSpacing: ".02em",
                }}
              >
                {step.label}
              </div>
            );
          })}
        </div>
        {c.status === "canceled" && (
          <div className="sub" style={{ marginTop: 6, textTransform: "none", letterSpacing: 0, color: "var(--ink-3)" }}>
            Case canceled.
          </div>
        )}
      </div>

      <div className="card" style={{ padding: 14 }}>
        <div className="kicker" style={{ marginBottom: 8 }}>
          Audit trail · {log.length}
        </div>
        {log.length === 0 ? (
          <div className="sub" style={{ textTransform: "none", letterSpacing: 0, fontSize: 12 }}>
            No admin events recorded.
          </div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
            {log.map((entry) => (
              <div
                key={entry.id}
                style={{
                  display: "flex",
                  alignItems: "flex-start",
                  gap: 10,
                  padding: 8,
                  borderRadius: 8,
                  background: "var(--surface-2)",
                  border: "1px solid var(--line-2)",
                }}
              >
                {entry.by_engineer ? <Avatar code={entry.by_engineer} size={22} /> : null}
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 13, fontWeight: 600, color: "var(--ink)" }}>
                    {adminEventLabel[entry.event_type] ?? entry.event_type}
                  </div>
                  {entry.description && (
                    <div style={{ fontSize: 12, color: "var(--ink-3)", marginTop: 2 }}>
                      {entry.description}
                    </div>
                  )}
                </div>
                <span className="mono" style={{ fontSize: 11, color: "var(--ink-4)" }}>
                  {fmtDate(entry.event_date ?? entry.recorded_at)}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
