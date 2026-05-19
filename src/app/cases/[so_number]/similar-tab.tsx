import Link from "next/link";
import { StatusPill } from "@/components/primitives/status-pill";
import { ServiceChip } from "@/components/primitives/service-chip";
import type { SimilarCase } from "./queries";

const REASON_LABEL: Record<SimilarCase["reason"], string> = {
  machine: "Same machine",
  customer: "Same customer",
};

export function SimilarTab({ items }: { items: SimilarCase[] }) {
  if (items.length === 0) {
    return (
      <div className="card" style={{ margin: "0 14px 24px", padding: 18, textAlign: "center" }}>
        <div className="sub" style={{ textTransform: "none", letterSpacing: 0, fontSize: 13 }}>
          No similar cases found by machine or customer + service type.
        </div>
      </div>
    );
  }
  return (
    <div style={{ padding: "0 14px 24px" }}>
      <div className="card" style={{ overflow: "hidden" }}>
        {items.map((s, i) => (
          <Link
            key={s.so_number}
            href={`/cases/${s.so_number}`}
            className="row-link"
            style={{
              display: "flex",
              alignItems: "center",
              gap: 10,
              padding: "12px 14px",
              borderTop: i === 0 ? "none" : "1px solid var(--line-2)",
              textDecoration: "none",
              color: "inherit",
            }}
          >
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 2 }}>
                <span className="mono" style={{ fontSize: 11, fontWeight: 700, color: "var(--ink-3)" }}>
                  {s.so_number}
                </span>
                <StatusPill s={s.status} />
              </div>
              <div className="truncate" style={{ fontSize: 13, fontWeight: 600, color: "var(--ink)" }}>
                {s.title ?? "Untitled"}
              </div>
              <div
                className="sub truncate"
                style={{ textTransform: "none", letterSpacing: 0, fontSize: 11.5, color: "var(--ink-3)" }}
              >
                {s.customer_name ?? "—"}
              </div>
            </div>
            <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: 4 }}>
              {s.service_type_code && <ServiceChip typ={s.service_type_code} />}
              <span className="chip chip-slate" style={{ fontSize: 10 }}>
                {REASON_LABEL[s.reason]}
              </span>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
