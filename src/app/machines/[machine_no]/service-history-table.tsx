import Link from "next/link";
import { StatusPill } from "@/components/primitives/status-pill";
import { ServiceChip } from "@/components/primitives/service-chip";
import { EmptyState } from "@/components/primitives/empty-state";
import { fmtDate } from "@/lib/format";
import type { MachineCase } from "../queries";

export function ServiceHistoryTable({ cases }: { cases: MachineCase[] }) {
  if (cases.length === 0) {
    return (
      <div className="page-px">
        <EmptyState icon="history" title="No service history yet" compact />
      </div>
    );
  }

  return (
    <>
      {/* Mobile cards */}
      <div className="md:hidden" style={{ padding: "0 14px" }}>
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
              <div style={{ display: "flex", gap: 12, fontSize: 11, color: "var(--ink-3)" }}>
                {c.due_date && <span className="mono">Due {fmtDate(c.due_date)}</span>}
                {c.close_date && <span className="mono">Closed {fmtDate(c.close_date)}</span>}
              </div>
            </Link>
          ))}
        </div>
      </div>

      {/* Desktop table */}
      <div className="hidden md:block" style={{ padding: "0 14px" }}>
        <div className="card" style={{ overflow: "hidden" }}>
          <table className="dt-table">
            <thead>
              <tr>
                <th>SO</th>
                <th>Status</th>
                <th>Type</th>
                <th>Subject</th>
                <th>Due</th>
                <th>Closed</th>
              </tr>
            </thead>
            <tbody>
              {cases.map((c) => (
                <tr key={c.so_number}>
                  <td className="mono">
                    <Link
                      href={`/cases/${encodeURIComponent(c.so_number)}`}
                      style={{ color: "var(--ink)", textDecoration: "none" }}
                    >
                      {c.so_number}
                    </Link>
                  </td>
                  <td>
                    <StatusPill s={c.status} />
                  </td>
                  <td>{c.service_type_code && <ServiceChip typ={c.service_type_code} />}</td>
                  <td
                    className="truncate"
                    style={{ maxWidth: 320, color: "var(--ink)", fontWeight: 500 }}
                  >
                    <Link
                      href={`/cases/${encodeURIComponent(c.so_number)}`}
                      style={{ color: "inherit", textDecoration: "none" }}
                    >
                      {c.title ?? "Untitled"}
                    </Link>
                  </td>
                  <td className="mono" style={{ fontSize: 11.5, color: "var(--ink-3)" }}>
                    {fmtDate(c.due_date)}
                  </td>
                  <td className="mono" style={{ fontSize: 11.5, color: "var(--ink-3)" }}>
                    {fmtDate(c.close_date)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </>
  );
}
