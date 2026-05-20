import Link from "next/link";
import { AppBar } from "@/components/app-bar";
import { DesktopTopBar } from "@/components/desktop-top";
import { getActiveSession } from "@/lib/clock/queries";
import { getNotifications } from "@/components/notifications/queries";
import { currentUser, isApprover, meCode } from "@/lib/auth/current-user";
import { Icon } from "@/components/icons";
import { listChecklistTemplatesAdmin } from "./queries";
import { NewTemplateForm } from "./new-template-form";


export const dynamic = "force-dynamic";

export default async function ChecklistsAdminPage() {
  const ME = await meCode();
  const [templates, activeSession, notifications, me] = await Promise.all([
    listChecklistTemplatesAdmin(),
    getActiveSession(ME),
    getNotifications(ME),
    currentUser(),
  ]);
  const isAdmin = !!me && isApprover(me.role);

  return (
    <>
      <AppBar
        title="Checklists"
        sub={`${templates.length} template${templates.length === 1 ? "" : "s"}`}
        activeSession={activeSession}
        notifications={notifications}
      />
      <DesktopTopBar
        title="Checklists"
        crumbs={[
          { label: "Workspace", href: "/" },
          { label: "Admin" },
          { label: "Checklists" },
        ]}
        activeSession={activeSession}
        notifications={notifications}
      />
      <div className="scroll">
        <div style={{ padding: "0 14px 12px" }}>
          <div className="kicker">PM checklist templates by machine type</div>
        </div>

        {!isAdmin && (
          <div
            className="card"
            style={{
              margin: "0 14px 12px",
              padding: 12,
              background: "var(--warn-soft)",
              color: "var(--warn)",
              borderColor: "rgba(217,119,6,.3)",
              fontSize: 12,
            }}
          >
            Read-only view — admin role required to edit or add templates.
          </div>
        )}

        {isAdmin && (
          <div style={{ padding: "0 14px 14px" }}>
            <NewTemplateForm />
          </div>
        )}

        <div style={{ padding: "0 14px 24px" }}>
          {templates.length === 0 ? (
            <div
              style={{
                padding: 24,
                textAlign: "center",
                color: "var(--ink-3)",
                border: "1px dashed var(--line-2)",
                borderRadius: "var(--r-lg)",
              }}
            >
              No templates yet.
            </div>
          ) : (
            <div className="card" style={{ overflow: "hidden" }}>
              {templates.map((t, i) => (
                <Link
                  key={t.id}
                  href={`/admin/checklists/${t.id}`}
                  style={{
                    display: "block",
                    padding: "12px 14px",
                    borderTop: i === 0 ? "none" : "1px solid var(--line-2)",
                    textDecoration: "none",
                    color: "inherit",
                  }}
                >
                  <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap", marginBottom: 4 }}>
                    <span className="chip mono" style={{ fontSize: 11, fontWeight: 600 }}>
                      {t.machine_type}
                      {t.version ? ` · ${t.version}` : ""}
                    </span>
                    {!t.is_active && (
                      <span className="chip chip-soft" style={{ fontSize: 10, color: "var(--ink-3)" }}>
                        Inactive
                      </span>
                    )}
                    <span style={{ marginLeft: "auto", color: "var(--ink-4)" }}>
                      <Icon name="chevron" size={12} />
                    </span>
                  </div>
                  <div style={{ fontSize: 14, fontWeight: 600, color: "var(--ink)", marginBottom: 4 }}>
                    {t.name}
                  </div>
                  <div
                    style={{
                      display: "flex",
                      gap: 12,
                      fontSize: 11,
                      color: "var(--ink-3)",
                      flexWrap: "wrap",
                    }}
                  >
                    <span>{t.sections_count} sections</span>
                    <span>{t.items_count} items</span>
                    <span>{t.case_uses_count} case use{t.case_uses_count === 1 ? "" : "s"}</span>
                    {t.source && <span style={{ marginLeft: "auto" }}>{t.source}</span>}
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>
      </div>
    </>
  );
}
