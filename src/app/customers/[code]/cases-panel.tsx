import Link from "next/link";
import { StatusPill } from "@/components/primitives/status-pill";
import { ServiceChip } from "@/components/primitives/service-chip";
import { EmptyState } from "@/components/primitives/empty-state";
import { Icon } from "@/components/icons";
import { fmtDate } from "@/lib/format";
import type { CustomerCase } from "../queries";

export function CasesPanel({ cases }: { cases: CustomerCase[] }) {
  if (cases.length === 0) {
    return (
      <div className="page-px">
        <EmptyState icon="folder" title="No cases yet" body="No cases for this customer yet." compact />
      </div>
    );
  }
  return (
    <div style={{ padding: "0 14px" }}>
      <div className="card" style={{ overflow: "hidden" }}>
        {cases.map((c, i) => (
          <Link
            key={c.so_number}
            href={`/cases/${encodeURIComponent(c.so_number)}`}
            style={{
              display: "block",
              padding: "12px 14px",
              borderTop: i === 0 ? "none" : "1px solid var(--line-2)",
              textDecoration: "none",
              color: "inherit",
            }}
          >
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: 8,
                flexWrap: "wrap",
                marginBottom: 4,
              }}
            >
              <span className="mono" style={{ fontSize: 10.5, fontWeight: 700, color: "var(--ink-3)" }}>
                {c.so_number}
              </span>
              <StatusPill s={c.status} />
              {c.service_type_code && <ServiceChip typ={c.service_type_code} />}
            </div>
            <div
              className="truncate"
              style={{ fontSize: 13, color: "var(--ink)", fontWeight: 500, marginBottom: 4 }}
            >
              {c.title || "Untitled"}
            </div>
            {c.due_date && (
              <div
                className="mono"
                style={{ fontSize: 11, color: "var(--ink-3)", display: "flex", gap: 4, alignItems: "center" }}
              >
                <Icon name="calendar" size={11} /> Due {fmtDate(c.due_date)}
              </div>
            )}
          </Link>
        ))}
      </div>
    </div>
  );
}
