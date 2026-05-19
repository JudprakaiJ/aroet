"use client";

import { useTransition } from "react";
import { Avatar } from "@/components/primitives/avatar";
import { TypeBlock } from "@/components/primitives/type-block";
import { Icon } from "@/components/icons";
import { activityBadge, fmtTime } from "@/lib/format";
import { deleteSession } from "./session-actions";
import type { CaseSession } from "./queries";

type Props = {
  so_number: string;
  s: CaseSession;
};

const APPROVAL_CHIPS: Record<string, { className: string; label: string }> = {
  draft:     { className: "chip",          label: "Draft" },
  submitted: { className: "chip chip-warn", label: "Submitted" },
  approved:  { className: "chip chip-ok",   label: "Approved" },
  returned:  { className: "chip chip-danger", label: "Returned" },
};

export function SessionCard({ so_number, s }: Props) {
  const [pending, startTransition] = useTransition();
  const total = (s.travel_minutes ?? 0) + (s.work_minutes ?? 0) + (s.office_minutes ?? 0);
  const activity = s.activity_type ? activityBadge[s.activity_type] : undefined;
  const chip = APPROVAL_CHIPS[s.approval_status ?? "draft"];

  const onDelete = () => {
    if (s.approval_status === "approved") return;
    if (!confirm("Delete this session?")) return;
    startTransition(async () => {
      await deleteSession(s.id, so_number);
    });
  };

  return (
    <div className="card" style={{ padding: 10, display: "flex", gap: 10, alignItems: "stretch" }}>
      <TypeBlock t={s.type_code ?? "T"} style={{ minWidth: 28, padding: "4px 6px", alignSelf: "flex-start" }} />
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ display: "flex", gap: 6, alignItems: "baseline" }}>
          <Avatar code={s.engineer_code} size={20} />
          {activity && (
            <span className="chip" style={{ background: activity.bg, color: activity.text, borderColor: "transparent" }}>
              {activity.label}
            </span>
          )}
          <span className="mono" style={{ marginLeft: "auto", fontSize: 11, color: "var(--ink-2)", fontWeight: 600 }}>
            {fmtTime(total)}
          </span>
        </div>
        {s.work_done && (
          <div style={{ fontSize: 13, marginTop: 4, color: "var(--ink-2)", lineHeight: 1.4 }}>
            {s.work_done}
          </div>
        )}
        <div style={{ display: "flex", gap: 6, alignItems: "center", marginTop: 6, flexWrap: "wrap" }}>
          {(s.travel_minutes ?? 0) > 0 && (
            <span className="chip"><Icon name="car" size={11} /> {fmtTime(s.travel_minutes)}</span>
          )}
          {(s.work_minutes ?? 0) > 0 && (
            <span className="chip"><Icon name="wrench" size={11} /> {fmtTime(s.work_minutes)}</span>
          )}
          {(s.office_minutes ?? 0) > 0 && (
            <span className="chip"><Icon name="doc" size={11} /> {fmtTime(s.office_minutes)}</span>
          )}
          {(s.break_minutes ?? 0) > 0 && (
            <span className="chip chip-slate">break {fmtTime(s.break_minutes)}</span>
          )}
          {chip && <span className={chip.className}>{chip.label}</span>}
          {s.source === "planner" && <span className="chip chip-slate">planner</span>}
          <button
            type="button"
            className="btn btn-ghost btn-sm"
            style={{ marginLeft: "auto", minHeight: 28, padding: "0 8px", fontSize: 11, color: "var(--ink-3)" }}
            disabled={pending || s.approval_status === "approved"}
            onClick={onDelete}
            aria-label="delete session"
          >
            <Icon name="x" size={12} />
          </button>
        </div>
      </div>
    </div>
  );
}
