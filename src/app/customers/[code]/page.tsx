import { notFound } from "next/navigation";
import { AppBar } from "@/components/app-bar";
import { DesktopTopBar } from "@/components/desktop-top";
import { getActiveSession } from "@/lib/clock/queries";
import { getNotifications } from "@/components/notifications/queries";
import { meCode } from "@/lib/auth/current-user";
import { CodeBadge } from "@/components/primitives/code-badge";
import { Icon } from "@/components/icons";
import { getCustomer } from "../queries";
import { TabsStrip } from "./tabs-strip";
import { ContactsPanel } from "./contacts-panel";
import { MachinesPanel } from "./machines-panel";
import { CasesPanel } from "./cases-panel";


export const dynamic = "force-dynamic";

type TabId = "machines" | "cases" | "contacts";
const TAB_IDS: TabId[] = ["machines", "cases", "contacts"];

export default async function CustomerDetailPage({
  params,
  searchParams,
}: {
  params: Promise<{ code: string }>;
  searchParams: Promise<{ tab?: string }>;
}) {
  const ME = await meCode();
  const { code } = await params;
  const decoded = decodeURIComponent(code);
  const { tab: rawTab } = await searchParams;
  const tab: TabId = (TAB_IDS as string[]).includes(rawTab ?? "") ? (rawTab as TabId) : "machines";

  const [customer, activeSession, notifications] = await Promise.all([
    getCustomer(decoded),
    getActiveSession(ME),
    getNotifications(ME),
  ]);

  if (!customer) notFound();

  const loc = [customer.city, customer.country].filter(Boolean).join(", ");

  return (
    <>
      <AppBar
        title={customer.name}
        sub={customer.code}
        leftIcon="back"
        showSync={false}
        activeSession={activeSession}
        notifications={notifications}
      />
      <DesktopTopBar
        title={customer.name}
        crumbs={[
          { label: "Workspace", href: "/" },
          { label: "Customers", href: "/customers" },
          { label: customer.code },
        ]}
        activeSession={activeSession}
        notifications={notifications}
      />
      <div className="scroll">
        <div style={{ padding: "0 14px 12px", display: "flex", flexDirection: "column", gap: 12 }}>
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
            <CodeBadge>{customer.code}</CodeBadge>
            {loc && (
              <span className="chip" style={{ fontSize: 11 }}>
                <Icon name="pin" size={11} /> {loc}
              </span>
            )}
          </div>
          <div>
            <div
              style={{
                fontSize: 20,
                fontWeight: 700,
                color: "var(--ink)",
                lineHeight: 1.25,
                letterSpacing: "-0.01em",
              }}
            >
              {customer.name}
            </div>
          </div>
          {(customer.address || customer.notes || customer.contact_name) && (
            <div className="card" style={{ padding: 12, display: "grid", gap: 10 }}>
              {customer.contact_name && (
                <div>
                  <div className="kicker" style={{ marginBottom: 4 }}>
                    Primary contact
                  </div>
                  <div style={{ fontSize: 13, color: "var(--ink)" }}>
                    {customer.contact_name}
                    {customer.contact_mobile && (
                      <span style={{ color: "var(--ink-3)", marginLeft: 8 }}>{customer.contact_mobile}</span>
                    )}
                  </div>
                </div>
              )}
              {customer.address && (
                <div>
                  <div className="kicker" style={{ marginBottom: 4 }}>
                    Address
                  </div>
                  <div style={{ fontSize: 13, color: "var(--ink)", whiteSpace: "pre-wrap" }}>
                    {customer.address}
                  </div>
                </div>
              )}
              {customer.notes && (
                <div>
                  <div className="kicker" style={{ marginBottom: 4 }}>
                    Notes
                  </div>
                  <div style={{ fontSize: 13, color: "var(--ink)", whiteSpace: "pre-wrap" }}>
                    {customer.notes}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        <TabsStrip
          code={customer.code}
          active={tab}
          tabs={[
            { id: "machines", label: "Machines", count: customer.machines.length },
            { id: "cases", label: "Cases", count: customer.cases.length },
            { id: "contacts", label: "Contacts", count: customer.contacts.length },
          ]}
        />

        {tab === "machines" && <MachinesPanel machines={customer.machines} />}
        {tab === "cases" && <CasesPanel cases={customer.cases} />}
        {tab === "contacts" && <ContactsPanel contacts={customer.contacts} />}

        <div style={{ height: 40 }} />
      </div>
    </>
  );
}
