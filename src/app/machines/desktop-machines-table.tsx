import Link from "next/link";
import { CodeBadge } from "@/components/primitives/code-badge";
import { fmtDate } from "@/lib/format";
import type { MachineListItem } from "./queries";

export function DesktopMachinesTable({ machines }: { machines: MachineListItem[] }) {
  if (machines.length === 0) {
    return (
      <div style={{ padding: 40, textAlign: "center", color: "var(--ink-3)" }}>
        <div style={{ fontSize: 13, fontWeight: 500 }}>No machines match.</div>
      </div>
    );
  }
  return (
    <div style={{ overflow: "auto", maxHeight: "calc(100vh - 240px)" }}>
      <table className="dt-table">
        <thead>
          <tr>
            <th>Machine #</th>
            <th>Name</th>
            <th>Product</th>
            <th>Serial</th>
            <th>Customer</th>
            <th>Warranty</th>
          </tr>
        </thead>
        <tbody>
          {machines.map((m) => (
            <tr key={m.machine_no}>
              <td className="mono">
                <Link
                  href={`/machines/${encodeURIComponent(m.machine_no)}`}
                  style={{ color: "var(--ink)", textDecoration: "none" }}
                >
                  <CodeBadge>{m.machine_no}</CodeBadge>
                </Link>
              </td>
              <td
                className="truncate"
                style={{ maxWidth: 220, color: "var(--ink)", fontWeight: 500 }}
              >
                <Link
                  href={`/machines/${encodeURIComponent(m.machine_no)}`}
                  style={{ color: "inherit", textDecoration: "none" }}
                >
                  {m.name ?? "—"}
                </Link>
              </td>
              <td>{m.product_code ?? "—"}</td>
              <td className="mono" style={{ fontSize: 11.5 }}>
                {m.serial_no ?? "—"}
              </td>
              <td className="truncate" style={{ maxWidth: 180 }}>
                {m.customer_code ? (
                  <Link
                    href={`/customers/${encodeURIComponent(m.customer_code)}`}
                    style={{ color: "var(--ink)", textDecoration: "none" }}
                  >
                    {m.customer_name ?? m.customer_code}
                  </Link>
                ) : (
                  m.customer_name ?? "—"
                )}
              </td>
              <td className="mono" style={{ fontSize: 11.5, color: "var(--ink-3)" }}>
                {fmtDate(m.warranty_expiry)}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
