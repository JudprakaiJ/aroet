import Link from "next/link";
import { Avatar } from "@/components/primitives/avatar";
import { StatusPill } from "@/components/primitives/status-pill";
import { ServiceChip } from "@/components/primitives/service-chip";
import { CodeBadge } from "@/components/primitives/code-badge";
import { fmtDate } from "@/lib/format";
import type { DashboardCase } from "@/app/dashboard/queries";

export function CaseCard({ c }: { c: DashboardCase }) {
  return (
    <Link
      href={`/cases/${c.so_number}`}
      className="card"
      style={{ padding: 12, textAlign: "left", width: "100%", display: "block", textDecoration: "none", color: "inherit" }}
    >
      <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 6, flexWrap: "wrap" }}>
        <span className="mono" style={{ fontSize: 11, fontWeight: 600, color: "var(--ink-3)" }}>
          {c.so_number}
        </span>
        <StatusPill s={c.status} />
        {c.service_type_code && <ServiceChip typ={c.service_type_code} />}
        <span className="mono" style={{ marginLeft: "auto", fontSize: 11, color: "var(--ink-3)" }}>
          Due {fmtDate(c.due_date)}
        </span>
      </div>
      <div
        className="truncate"
        style={{
          fontSize: 14,
          fontWeight: 600,
          color: "var(--ink)",
          lineHeight: 1.3,
          letterSpacing: "-0.005em",
          marginBottom: 2,
        }}
      >
        {c.title || "Untitled"}
      </div>
      <div
        className="sub truncate"
        style={{
          textTransform: "none",
          letterSpacing: 0,
          fontSize: 12,
          color: "var(--ink-3)",
          fontWeight: 500,
        }}
      >
        {(c.customer_name || "—") + (c.machines.length ? " · " + c.machines.join(", ") : "")}
      </div>
      <div style={{ display: "flex", gap: 8, marginTop: 10, alignItems: "center" }}>
        {c.assignees.map((a) => (
          <Avatar key={a} code={a} />
        ))}
        <div style={{ marginLeft: "auto", display: "flex", gap: 6, alignItems: "center" }}>
          {c.project_code && <CodeBadge>{c.project_code}</CodeBadge>}
        </div>
      </div>
    </Link>
  );
}
