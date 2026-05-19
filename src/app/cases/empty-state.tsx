import Link from "next/link";
import { Icon } from "@/components/icons";

type Props = {
  q: string;
  hasFilters: boolean;
};

export function EmptyState({ q, hasFilters }: Props) {
  const message = q
    ? `Nothing matches "${q}". Try clearing the search or filters.`
    : hasFilters
      ? "Try adjusting status, year, or service type."
      : "No cases yet — create one to get started.";
  return (
    <div className="card" style={{ margin: "12px 14px", padding: 28, textAlign: "center" }}>
      <div
        style={{
          width: 48,
          height: 48,
          borderRadius: 12,
          background: "var(--surface-2)",
          color: "var(--ink-3)",
          display: "inline-flex",
          alignItems: "center",
          justifyContent: "center",
          marginBottom: 10,
        }}
      >
        <Icon name="search" size={22} />
      </div>
      <div style={{ fontSize: 14, fontWeight: 600, color: "var(--ink)", marginBottom: 4 }}>
        No cases match
      </div>
      <div
        className="sub"
        style={{
          textTransform: "none",
          letterSpacing: 0,
          fontSize: 12,
          color: "var(--ink-3)",
          marginBottom: 12,
        }}
      >
        {message}
      </div>
      {hasFilters && (
        <Link href="/cases" className="btn btn-secondary btn-sm" style={{ textDecoration: "none" }}>
          Reset filters
        </Link>
      )}
    </div>
  );
}
