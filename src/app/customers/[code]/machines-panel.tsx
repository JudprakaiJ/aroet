import Link from "next/link";
import { CodeBadge } from "@/components/primitives/code-badge";
import { fmtDate } from "@/lib/format";
import type { CustomerMachine } from "../queries";

export function MachinesPanel({ machines }: { machines: CustomerMachine[] }) {
  if (machines.length === 0) {
    return (
      <div style={{ padding: "0 14px" }}>
        <div
          style={{
            padding: 24,
            textAlign: "center",
            color: "var(--ink-3)",
            border: "1px dashed var(--line-2)",
            borderRadius: "var(--r-lg)",
          }}
        >
          No machines for this customer.
        </div>
      </div>
    );
  }
  return (
    <div style={{ padding: "0 14px" }}>
      <div className="card" style={{ overflow: "hidden" }}>
        {machines.map((m, i) => (
          <Link
            key={m.machine_no}
            href={`/machines/${encodeURIComponent(m.machine_no)}`}
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
              <CodeBadge>{m.machine_no}</CodeBadge>
              {m.product_code ? (
                <span className="chip" style={{ fontSize: 10 }}>
                  {m.product_code}
                </span>
              ) : (
                <span className="chip chip-soft" style={{ fontSize: 10, color: "var(--warn)" }}>
                  No product
                </span>
              )}
            </div>
            {m.name && (
              <div
                className="truncate"
                style={{ fontSize: 13, color: "var(--ink)", fontWeight: 500, marginBottom: 4 }}
              >
                {m.name}
              </div>
            )}
            <div
              style={{
                display: "flex",
                gap: 12,
                fontSize: 11,
                color: "var(--ink-3)",
                flexWrap: "wrap",
              }}
            >
              {m.serial_no && <span className="mono">SN {m.serial_no}</span>}
              {m.warranty_expiry && (
                <span>Warranty {fmtDate(m.warranty_expiry)}</span>
              )}
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
