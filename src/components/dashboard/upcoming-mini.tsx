import Link from "next/link";
import { ServiceChip } from "@/components/primitives/service-chip";
import type { DashboardCase } from "@/app/dashboard/queries";

function dayAbbrev(iso: string | null): string {
  if (!iso) return "";
  return new Date(iso).toLocaleDateString("en-GB", { weekday: "short" }).toUpperCase();
}

function dayNumber(iso: string | null): string {
  if (!iso) return "";
  return String(new Date(iso).getDate());
}

export function UpcomingMini({ items }: { items: DashboardCase[] }) {
  if (items.length === 0) {
    return (
      <div className="card" style={{ padding: 14 }}>
        <span
          className="sub"
          style={{ textTransform: "none", letterSpacing: 0, fontSize: 13 }}
        >
          Nothing scheduled past today.
        </span>
      </div>
    );
  }
  return (
    <div className="card" style={{ overflow: "hidden" }}>
      {items.map((c, i) => (
        <Link
          key={c.so_number}
          href={`/cases/${c.so_number}`}
          className="row-link"
          style={{
            display: "flex",
            alignItems: "center",
            gap: 10,
            padding: "11px 12px",
            width: "100%",
            borderBottom: i === items.length - 1 ? "none" : "1px solid var(--line-2)",
            background: "transparent",
            textAlign: "left",
            color: "inherit",
            textDecoration: "none",
          }}
        >
          <div style={{ textAlign: "center", minWidth: 42 }}>
            <div className="mono" style={{ fontSize: 10, color: "var(--ink-3)", fontWeight: 600 }}>
              {dayAbbrev(c.due_date)}
            </div>
            <div className="mono" style={{ fontSize: 18, fontWeight: 700, color: "var(--ink)", lineHeight: 1 }}>
              {dayNumber(c.due_date)}
            </div>
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div
              className="truncate"
              style={{ fontSize: 13.5, fontWeight: 600, color: "var(--ink)" }}
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
                marginTop: 1,
              }}
            >
              {c.so_number}
              {c.customer_name ? ` · ${c.customer_name}` : ""}
            </div>
          </div>
          {c.service_type_code && <ServiceChip typ={c.service_type_code} />}
        </Link>
      ))}
    </div>
  );
}
