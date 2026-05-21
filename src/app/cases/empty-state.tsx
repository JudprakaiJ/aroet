import Link from "next/link";
import { EmptyState as Primitive } from "@/components/primitives/empty-state";

type Props = {
  q: string;
  hasFilters: boolean;
};

export function EmptyState({ q, hasFilters }: Props) {
  const title = q || hasFilters ? "No cases match" : "No cases yet";
  const message = q
    ? `Nothing matches "${q}". Try clearing the search or filters.`
    : hasFilters
      ? "Try adjusting status, year, or service type."
      : "Create one to get started.";
  return (
    <div style={{ margin: "12px var(--page-px)" }}>
      <Primitive
        icon="search"
        title={title}
        body={message}
        action={
          hasFilters ? (
            <Link href="/cases" className="btn btn-secondary btn-sm" style={{ textDecoration: "none" }}>
              Reset filters
            </Link>
          ) : undefined
        }
      />
    </div>
  );
}
