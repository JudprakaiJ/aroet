import Link from "next/link";
import { CodeBadge } from "@/components/primitives/code-badge";
import type { CustomerListItem } from "./queries";

export function DesktopCustomersTable({ customers }: { customers: CustomerListItem[] }) {
  if (customers.length === 0) {
    return (
      <div style={{ padding: 40, textAlign: "center", color: "var(--ink-3)" }}>
        <div style={{ fontSize: 13, fontWeight: 500 }}>No customers match.</div>
      </div>
    );
  }
  return (
    <div style={{ overflow: "auto", maxHeight: "calc(100vh - 240px)" }}>
      <table className="dt-table">
        <thead>
          <tr>
            <th>Code</th>
            <th>Name</th>
            <th>City</th>
            <th>Country</th>
            <th>Primary contact</th>
            <th className="num">Machines</th>
            <th className="num">Cases</th>
          </tr>
        </thead>
        <tbody>
          {customers.map((c) => (
            <tr key={c.code}>
              <td className="mono">
                <Link
                  href={`/customers/${encodeURIComponent(c.code)}`}
                  style={{ color: "var(--ink)", textDecoration: "none" }}
                >
                  <CodeBadge>{c.code}</CodeBadge>
                </Link>
              </td>
              <td
                className="truncate"
                style={{ maxWidth: 280, color: "var(--ink)", fontWeight: 500 }}
              >
                <Link
                  href={`/customers/${encodeURIComponent(c.code)}`}
                  style={{ color: "inherit", textDecoration: "none" }}
                >
                  {c.name}
                </Link>
              </td>
              <td className="truncate" style={{ maxWidth: 140 }}>
                {c.city ?? "—"}
              </td>
              <td className="truncate" style={{ maxWidth: 120 }}>
                {c.country ?? "—"}
              </td>
              <td className="truncate" style={{ maxWidth: 180 }}>
                {c.contact_name ? (
                  <span>
                    {c.contact_name}
                    {c.contact_mobile && (
                      <span style={{ color: "var(--ink-4)", marginLeft: 6, fontSize: 11 }}>
                        {c.contact_mobile}
                      </span>
                    )}
                  </span>
                ) : (
                  <span style={{ color: "var(--ink-4)" }}>—</span>
                )}
              </td>
              <td className="num">{c.machines_count}</td>
              <td className="num">{c.cases_count}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
