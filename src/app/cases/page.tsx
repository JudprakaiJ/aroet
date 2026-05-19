import Link from "next/link";
import { AppBar } from "@/components/app-bar";
import { Icon } from "@/components/icons";
import { CaseListRow } from "./list-row";
import { EmptyState } from "./empty-state";
import { FilterRail } from "./filter-rail";
import { listCases, listAvailableYears, type CaseListFilters } from "./queries";

export const dynamic = "force-dynamic";

type Search = {
  q?: string;
  scope?: "mine" | "team" | "all";
  status?: "open" | "verified" | "all";
  year?: string;
  type?: string;
};

export default async function CasesPage({
  searchParams,
}: {
  searchParams: Promise<Search>;
}) {
  const sp = await searchParams;
  const filters: CaseListFilters = {
    q: sp.q,
    scope: sp.scope ?? "mine",
    status: sp.status ?? "open",
    year: sp.year,
    type: sp.type,
  };

  const [cases, years] = await Promise.all([listCases(filters), listAvailableYears()]);
  const hasFilters =
    Boolean(filters.q) ||
    (filters.scope !== "mine") ||
    (filters.status !== "open") ||
    Boolean(filters.year) ||
    Boolean(filters.type);

  return (
    <>
      <AppBar title="Cases" sub={`${cases.length} result${cases.length === 1 ? "" : "s"}`} />
      <div className="scroll">
        <FilterRail
          years={years}
          initial={{
            q: filters.q ?? "",
            scope: filters.scope ?? "mine",
            status: filters.status ?? "open",
            year: filters.year ?? null,
            type: filters.type ?? null,
          }}
        />

        <div style={{ display: "flex", justifyContent: "flex-end", padding: "0 14px 4px" }}>
          {hasFilters && (
            <Link href="/cases" className="btn btn-ghost btn-sm">
              <Icon name="x" size={12} /> Reset
            </Link>
          )}
        </div>

        {cases.length === 0 ? (
          <EmptyState q={filters.q ?? ""} hasFilters={hasFilters} />
        ) : (
          <div className="card" style={{ margin: "8px 14px 14px", overflow: "hidden" }}>
            {cases.map((c) => (
              <CaseListRow key={c.so_number} c={c} />
            ))}
          </div>
        )}

        <div style={{ display: "flex", justifyContent: "center", padding: "8px 14px 32px" }}>
          <Link href="/cases/new" className="btn btn-primary btn-sm" style={{ textDecoration: "none" }}>
            <Icon name="plus" size={14} /> New case
          </Link>
        </div>
      </div>
    </>
  );
}
