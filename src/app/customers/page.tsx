import { AppBar } from "@/components/app-bar";
import { DesktopTopBar } from "@/components/desktop-top";
import { getActiveSession } from "@/lib/clock/queries";
import { getNotifications } from "@/components/notifications/queries";
import { meCode } from "@/lib/auth/current-user";
import { listCustomers } from "./queries";
import { SearchBar } from "./search-bar";
import { CustomerListRow } from "./list-row";
import { DesktopCustomersTable } from "./desktop-customers-table";


export const dynamic = "force-dynamic";

export default async function CustomersPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>;
}) {
  const ME = await meCode();
  const sp = await searchParams;
  const q = sp.q ?? "";

  const [customers, activeSession, notifications] = await Promise.all([
    listCustomers({ q }),
    getActiveSession(ME),
    getNotifications(ME),
  ]);

  return (
    <>
      <AppBar
        title="Customers"
        sub={`${customers.length} result${customers.length === 1 ? "" : "s"}`}
        activeSession={activeSession}
        notifications={notifications}
      />
      <DesktopTopBar
        title="Customers"
        crumbs={[{ label: "Workspace", href: "/" }, { label: "Customers" }]}
        activeSession={activeSession}
        notifications={notifications}
      />

      {/* Mobile */}
      <div className="scroll md:hidden">
        <div style={{ padding: "0 14px 8px" }}>
          <SearchBar basePath="/customers" initialQ={q} placeholder="Search code, name, city…" />
        </div>
        {customers.length === 0 ? (
          <div
            style={{
              margin: "8px 14px",
              padding: 24,
              textAlign: "center",
              color: "var(--ink-3)",
              border: "1px dashed var(--line-2)",
              borderRadius: "var(--r-lg)",
            }}
          >
            {q ? "No customers match." : "No customers yet."}
          </div>
        ) : (
          <div className="card" style={{ margin: "8px 14px 14px", overflow: "hidden" }}>
            {customers.map((c) => (
              <CustomerListRow key={c.code} c={c} />
            ))}
          </div>
        )}
      </div>

      {/* Desktop */}
      <div className="dt-body hidden md:block">
        <div className="dt-panel">
          <div
            style={{
              padding: "10px 16px",
              display: "flex",
              gap: 10,
              alignItems: "center",
              borderBottom: "1px solid var(--line-2)",
              background: "var(--surface)",
            }}
          >
            <div style={{ flex: "0 1 320px" }}>
              <SearchBar basePath="/customers" initialQ={q} placeholder="Search code, name, city…" />
            </div>
            <span style={{ fontSize: 11.5, color: "var(--ink-3)", marginLeft: "auto" }}>
              {customers.length} result{customers.length === 1 ? "" : "s"}
            </span>
          </div>
          <DesktopCustomersTable customers={customers} />
        </div>
      </div>
    </>
  );
}
