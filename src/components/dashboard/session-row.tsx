import { TypeBlock } from "@/components/primitives/type-block";
import { activityBadge, fmtTime } from "@/lib/format";
import type { DashboardSession } from "@/app/dashboard/queries";

const APPROVAL_CHIPS: Record<string, { className: string; label: string }> = {
  draft:     { className: "chip",          label: "Draft" },
  submitted: { className: "chip chip-warn", label: "Submitted · awaiting" },
  approved:  { className: "chip chip-ok",   label: "Approved" },
};

export function SessionRow({ s }: { s: DashboardSession }) {
  const activity = s.activity_type ? activityBadge[s.activity_type] : undefined;
  const chip = APPROVAL_CHIPS[s.approval_status];
  return (
    <div
      className="card"
      style={{ padding: 10, marginBottom: 6, display: "flex", gap: 10, alignItems: "center" }}
    >
      <TypeBlock t={s.type_code ?? "T"} style={{ minWidth: 28, padding: "4px 6px" }} />
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ display: "flex", gap: 6, alignItems: "baseline" }}>
          {activity && (
            <span
              className="chip"
              style={{ background: activity.bg, color: activity.text, borderColor: "transparent" }}
            >
              {activity.label}
            </span>
          )}
          {s.so_number && (
            <span className="mono" style={{ fontSize: 11, color: "var(--ink)", fontWeight: 500 }}>
              {s.so_number}
            </span>
          )}
          <span
            className="mono"
            style={{ marginLeft: "auto", fontSize: 11, color: "var(--ink-2)", fontWeight: 600 }}
          >
            {fmtTime(s.total_minutes)}
          </span>
        </div>
        <div className="truncate" style={{ fontSize: 13, marginTop: 2, color: "var(--ink-2)" }}>
          {s.customer_name || s.work_done || "—"}
        </div>
        {chip && (
          <span className={chip.className} style={{ marginTop: 4, padding: "2px 6px" }}>
            {chip.label}
          </span>
        )}
      </div>
    </div>
  );
}
