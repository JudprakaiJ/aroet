import Link from "next/link";
import { CodeBadge } from "@/components/primitives/code-badge";
import { Icon } from "@/components/icons";
import type { CustomerListItem } from "./queries";

export function CustomerListRow({ c }: { c: CustomerListItem }) {
  const loc = [c.city, c.country].filter(Boolean).join(", ");
  return (
    <Link
      href={`/customers/${encodeURIComponent(c.code)}`}
      className="case-row"
      style={{ textDecoration: "none", color: "inherit" }}
    >
      <div className="left">
        <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4, flexWrap: "wrap" }}>
          <CodeBadge>{c.code}</CodeBadge>
          {loc && (
            <span style={{ fontSize: 11, color: "var(--ink-3)" }}>{loc}</span>
          )}
        </div>
        <div
          className="truncate"
          style={{
            fontSize: 13.5,
            fontWeight: 600,
            color: "var(--ink)",
            lineHeight: 1.3,
            letterSpacing: "-0.005em",
            marginBottom: 6,
          }}
        >
          {c.name}
        </div>
        <div
          style={{
            display: "flex",
            gap: 10,
            alignItems: "center",
            color: "var(--ink-3)",
            fontSize: 11,
          }}
        >
          {c.contact_name && (
            <span className="truncate" style={{ maxWidth: 160 }}>
              <Icon name="user" size={11} /> {c.contact_name}
            </span>
          )}
          <span style={{ marginLeft: "auto", display: "flex", gap: 8 }}>
            <span className="chip">
              <Icon name="cube" size={11} /> {c.machines_count}
            </span>
            <span className="chip">
              <Icon name="folder" size={11} /> {c.cases_count}
            </span>
          </span>
        </div>
      </div>
    </Link>
  );
}
