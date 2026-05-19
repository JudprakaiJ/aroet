import Link from "next/link";
import { Avatar } from "@/components/primitives/avatar";
import { StatusPill } from "@/components/primitives/status-pill";
import { ServiceChip } from "@/components/primitives/service-chip";
import { CodeBadge } from "@/components/primitives/code-badge";
import { Icon } from "@/components/icons";
import { fmtDate } from "@/lib/format";
import type { CaseListItem } from "./queries";

export function CaseListRow({ c }: { c: CaseListItem }) {
  const sub =
    (c.customer_name ?? "—") +
    (c.machines.length ? " · " + c.machines.slice(0, 2).join(", ") : "") +
    (c.project_code ? " · " + c.project_code : "");

  return (
    <Link href={`/cases/${c.so_number}`} className="case-row" style={{ textDecoration: "none", color: "inherit" }}>
      <div className="left">
        <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4, flexWrap: "wrap" }}>
          <span className="mono" style={{ fontSize: 10.5, fontWeight: 700, color: "var(--ink-3)" }}>
            {c.so_number}
          </span>
          <StatusPill s={c.status} />
        </div>
        <div
          className="truncate"
          style={{
            fontSize: 13.5,
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
            fontSize: 11.5,
            color: "var(--ink-3)",
            fontWeight: 500,
            marginBottom: 6,
          }}
        >
          {sub}
        </div>
        <div style={{ display: "flex", gap: 6, alignItems: "center", flexWrap: "wrap" }}>
          {c.service_type_code && <ServiceChip typ={c.service_type_code} />}
          <div style={{ display: "flex", gap: 4 }}>
            {c.assignees.slice(0, 3).map((a) => (
              <Avatar key={a} code={a} />
            ))}
            {c.assignees.length > 3 && (
              <span className="chip chip-slate">+{c.assignees.length - 3}</span>
            )}
          </div>
          <div
            style={{
              marginLeft: "auto",
              display: "flex",
              gap: 6,
              alignItems: "center",
              color: "var(--ink-3)",
              fontSize: 11,
            }}
          >
            {c.due_date && (
              <span className="mono" style={{ fontSize: 11 }}>
                <Icon name="calendar" size={11} /> {fmtDate(c.due_date)}
              </span>
            )}
            {c.hours_logged > 0 && (
              <span className="chip">
                <Icon name="clock" size={11} /> {c.hours_logged}h
              </span>
            )}
            {c.project_code && c.project_code.length <= 10 && <CodeBadge>{c.project_code}</CodeBadge>}
          </div>
        </div>
      </div>
    </Link>
  );
}
