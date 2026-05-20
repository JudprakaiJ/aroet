import Link from "next/link";
import { CodeBadge } from "@/components/primitives/code-badge";
import { Icon } from "@/components/icons";
import { fmtDate } from "@/lib/format";
import type { MachineListItem } from "./queries";

export function MachineListRow({ m }: { m: MachineListItem }) {
  return (
    <Link
      href={`/machines/${encodeURIComponent(m.machine_no)}`}
      className="case-row"
      style={{ textDecoration: "none", color: "inherit" }}
    >
      <div className="left">
        <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4, flexWrap: "wrap" }}>
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
            style={{
              fontSize: 13.5,
              fontWeight: 600,
              color: "var(--ink)",
              lineHeight: 1.3,
              letterSpacing: "-0.005em",
              marginBottom: 4,
            }}
          >
            {m.name}
          </div>
        )}
        <div
          style={{
            display: "flex",
            gap: 10,
            alignItems: "center",
            color: "var(--ink-3)",
            fontSize: 11,
            flexWrap: "wrap",
          }}
        >
          {m.customer_name && (
            <span className="truncate" style={{ maxWidth: 180 }}>
              <Icon name="building" size={11} /> {m.customer_name}
            </span>
          )}
          {m.serial_no && (
            <span className="mono">SN {m.serial_no}</span>
          )}
          {m.warranty_expiry && (
            <span style={{ marginLeft: "auto" }} className="mono">
              <Icon name="calendar" size={11} /> {fmtDate(m.warranty_expiry)}
            </span>
          )}
        </div>
      </div>
    </Link>
  );
}
