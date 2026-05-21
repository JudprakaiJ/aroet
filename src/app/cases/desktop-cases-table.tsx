import Link from "next/link";
import { Avatar } from "@/components/primitives/avatar";
import { StatusPill } from "@/components/primitives/status-pill";
import { ServiceChip } from "@/components/primitives/service-chip";
import { CodeBadge } from "@/components/primitives/code-badge";
import { EmptyState } from "@/components/primitives/empty-state";
import { fmtDate } from "@/lib/format";
import type { CaseListItem } from "./queries";

export function DesktopCasesTable({ cases }: { cases: CaseListItem[] }) {
  if (cases.length === 0) {
    return (
      <div style={{ padding: 24 }}>
        <EmptyState
          icon="search"
          title="No cases match"
          body="Try clearing some filters or the search term."
        />
      </div>
    );
  }
  return (
    <div style={{ overflow: "auto", maxHeight: "calc(100vh - 240px)" }}>
      <table className="dt-table">
        <thead>
          <tr>
            <th>SO</th>
            <th>Subject</th>
            <th>Customer</th>
            <th>Machine</th>
            <th>Project</th>
            <th>Type</th>
            <th>Status</th>
            <th>Team</th>
            <th className="num">Hours</th>
            <th>Due</th>
          </tr>
        </thead>
        <tbody>
          {cases.map((c) => (
            <tr key={c.so_number}>
              <td className="mono">
                <Link href={`/cases/${c.so_number}`} style={{ color: "var(--ink)", textDecoration: "none" }}>
                  {c.so_number}
                </Link>
              </td>
              <td className="truncate" style={{ maxWidth: 220, color: "var(--ink)", fontWeight: 500 }}>
                <Link href={`/cases/${c.so_number}`} style={{ color: "inherit", textDecoration: "none" }}>
                  {c.title ?? "Untitled"}
                </Link>
              </td>
              <td className="truncate" style={{ maxWidth: 140 }}>
                {c.customer_name ?? "—"}
              </td>
              <td>
                <div style={{ display: "flex", flexWrap: "wrap", gap: 4 }}>
                  {c.machines.slice(0, 2).map((m) => (
                    <CodeBadge key={m}>{m}</CodeBadge>
                  ))}
                  {c.machines.length > 2 && (
                    <span style={{ fontSize: 11, color: "var(--ink-3)" }}>+{c.machines.length - 2}</span>
                  )}
                </div>
              </td>
              <td>
                {c.project_code ? <CodeBadge>{c.project_code}</CodeBadge> : <span style={{ color: "var(--ink-4)" }}>—</span>}
              </td>
              <td>{c.service_type_code && <ServiceChip typ={c.service_type_code} />}</td>
              <td>
                <StatusPill s={c.status} />
              </td>
              <td>
                <div style={{ display: "flex", gap: 2 }}>
                  {c.assignees.slice(0, 3).map((a) => (
                    <Avatar key={a} code={a} />
                  ))}
                  {c.assignees.length > 3 && (
                    <span style={{ fontSize: 10, color: "var(--ink-3)", marginLeft: 4, alignSelf: "center" }}>
                      +{c.assignees.length - 3}
                    </span>
                  )}
                </div>
              </td>
              <td className="num">{c.hours_logged > 0 ? `${c.hours_logged}h` : "—"}</td>
              <td className="mono" style={{ fontSize: 11.5, color: "var(--ink-3)" }}>
                {fmtDate(c.due_date)}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
