import Link from "next/link";
import { AppBar } from "@/components/app-bar";
import { DesktopTopBar } from "@/components/desktop-top";
import { Icon } from "@/components/icons";
import { CaseCard } from "./case-card";
import { EmptyState } from "./empty-state";
import { FilterRail } from "./filter-rail";
import { DesktopFilterBar } from "./desktop-filter-bar";
import { listCases, listAvailableYears, type CaseListFilters } from "./queries";
import { getActiveSession } from "@/lib/clock/queries";
import { getNotifications } from "@/components/notifications/queries";
import { meCode } from "@/lib/auth/current-user";


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
  const ME = await meCode();
  const sp = await searchParams;
  const filters: CaseListFilters = {
    q: sp.q,
    scope: sp.scope ?? "mine",
    status: sp.status ?? "open",
    year: sp.year,
    type: sp.type,
  };

  const [cases, years, activeSession, notifications] = await Promise.all([
    listCases(filters),
    listAvailableYears(),
    getActiveSession(ME),
    getNotifications(ME),
  ]);
  const hasFilters =
    Boolean(filters.q) ||
    filters.scope !== "mine" ||
    filters.status !== "open" ||
    Boolean(filters.year) ||
    Boolean(filters.type);

  const initial = {
    q: filters.q ?? "",
    scope: filters.scope ?? "mine",
    status: filters.status ?? "open",
    year: filters.year ?? null,
    type: filters.type ?? null,
  };

  return (
    <>
      <AppBar
        title="Cases"
        sub={`${cases.length} result${cases.length === 1 ? "" : "s"}`}
        activeSession={activeSession}
        notifications={notifications}
      />
      <DesktopTopBar
        title="Cases"
        crumbs={[{ label: "Workspace", href: "/" }, { label: "Cases" }]}
        activeSession={activeSession}
        notifications={notifications}
      />

      {/* Mobile content */}
      <div className="scroll md:hidden">
        <FilterRail years={years} initial={initial} />
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
          <div className="page-px stack-lg" style={{ paddingBottom: 8 }}>
            {cases.map((c) => (
              <CaseCard key={c.so_number} c={c} />
            ))}
          </div>
        )}

        <div style={{ display: "flex", justifyContent: "center", padding: "8px 14px 32px" }}>
          <Link href="/cases/new" className="btn btn-primary btn-sm" style={{ textDecoration: "none" }}>
            <Icon name="plus" size={14} /> New case
          </Link>
        </div>
      </div>

      {/* Desktop content */}
      <div className="dt-body hidden md:block">
        <div className="dt-panel" style={{ marginBottom: 14 }}>
          <DesktopFilterBar
            years={years}
            initial={{
              scope: initial.scope,
              status: initial.status,
              year: initial.year,
              type: initial.type,
            }}
          />
        </div>
        {cases.length === 0 ? (
          <EmptyState q={filters.q ?? ""} hasFilters={hasFilters} />
        ) : (
          <div className="cases-grid">
            {cases.map((c) => (
              <CaseCard key={c.so_number} c={c} />
            ))}
          </div>
        )}
      </div>
    </>
  );
}
