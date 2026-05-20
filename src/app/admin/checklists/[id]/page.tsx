import { notFound } from "next/navigation";
import Link from "next/link";
import { AppBar } from "@/components/app-bar";
import { DesktopTopBar } from "@/components/desktop-top";
import { getActiveSession } from "@/lib/clock/queries";
import { getNotifications } from "@/components/notifications/queries";
import { currentUser, isApprover, meCode } from "@/lib/auth/current-user";
import { getChecklistTemplateForEdit } from "../queries";
import { Editor } from "./editor";


export const dynamic = "force-dynamic";

export default async function ChecklistTemplateEditPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const ME = await meCode();
  const { id: rawId } = await params;
  const id = Number(rawId);
  if (!Number.isFinite(id) || id <= 0) notFound();

  const [template, activeSession, notifications, me] = await Promise.all([
    getChecklistTemplateForEdit(id),
    getActiveSession(ME),
    getNotifications(ME),
    currentUser(),
  ]);
  if (!template) notFound();
  const isAdmin = !!me && isApprover(me.role);

  const totalItems = template.sections.reduce((a, s) => a + s.items.length, 0);

  return (
    <>
      <AppBar
        title={template.name}
        sub={`${template.machine_type}${template.version ? ` · ${template.version}` : ""}`}
        leftIcon="back"
        activeSession={activeSession}
        notifications={notifications}
      />
      <DesktopTopBar
        title={template.name}
        crumbs={[
          { label: "Workspace", href: "/" },
          { label: "Admin" },
          { label: "Checklists", href: "/admin/checklists" },
          { label: template.machine_type + (template.version ? ` · ${template.version}` : "") },
        ]}
        activeSession={activeSession}
        notifications={notifications}
      />
      <div className="scroll">
        <div style={{ padding: "0 14px 8px", display: "flex", gap: 12, flexWrap: "wrap", fontSize: 12, color: "var(--ink-3)" }}>
          <span>
            <strong style={{ color: "var(--ink)" }}>{template.sections.length}</strong> sections
          </span>
          <span>
            <strong style={{ color: "var(--ink)" }}>{totalItems}</strong> items
          </span>
          <span>
            <strong style={{ color: "var(--ink)" }}>{template.case_uses_count}</strong> case use{template.case_uses_count === 1 ? "" : "s"}
          </span>
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
            Read-only view —{" "}
            <Link href="/me" style={{ color: "inherit", textDecoration: "underline" }}>
              switch to Admin
            </Link>{" "}
            to edit.
          </div>
        )}

        <Editor template={template} admin={isAdmin} />

        <div style={{ height: 60 }} />
      </div>
    </>
  );
}
