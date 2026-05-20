import Link from "next/link";
import { TypeBlock } from "@/components/primitives/type-block";
import { CodeBadge } from "@/components/primitives/code-badge";
import { Icon } from "@/components/icons";
import { fmtDay, fmtTime } from "@/lib/format";
import { daysInRange } from "@/lib/pay-period";
import type { HoursSession } from "./queries";

type ApprovalKey = "draft" | "submitted" | "approved" | "returned";

const APPROVAL_LABEL: Record<ApprovalKey, string> = {
  draft: "Draft",
  submitted: "Submitted",
  approved: "Approved",
  returned: "Returned",
};

const APPROVAL_COLOR: Record<ApprovalKey, { bg: string; fg: string }> = {
  draft:     { bg: "var(--surface-2)",        fg: "var(--ink-3)" },
  submitted: { bg: "var(--info-soft)",        fg: "var(--info)" },
  approved:  { bg: "var(--ok-soft)",          fg: "var(--ok)" },
  returned:  { bg: "var(--danger-soft)",      fg: "var(--danger)" },
};

function ApprovalChip({ status }: { status: string | null }) {
  const key = (status ?? "draft") as ApprovalKey;
  const color = APPROVAL_COLOR[key] ?? APPROVAL_COLOR.draft;
  return (
    <span
      className="chip"
      style={{ background: color.bg, color: color.fg, fontSize: 10, fontWeight: 600 }}
    >
      {APPROVAL_LABEL[key] ?? status ?? "—"}
    </span>
  );
}

export function HoursTable({
  sessions,
  start,
  end,
}: {
  sessions: HoursSession[];
  start: string;
  end: string;
}) {
  const days = daysInRange(start, end);
  const byDay = new Map<string, HoursSession[]>();
  for (const s of sessions) {
    const arr = byDay.get(s.session_date) ?? [];
    arr.push(s);
    byDay.set(s.session_date, arr);
  }

  return (
    <div className="card" style={{ overflow: "hidden", margin: "0 14px" }}>
      <div style={{ overflow: "auto", maxHeight: "calc(100vh - 320px)" }}>
        <table className="dt-table">
          <thead>
            <tr>
              <th>Day</th>
              <th>Type</th>
              <th>SO</th>
              <th className="num">Work</th>
              <th className="num">Travel</th>
              <th className="num">Office</th>
              <th className="num">Break</th>
              <th>Approval</th>
              <th>Source</th>
            </tr>
          </thead>
          <tbody>
            {days.map((d) => {
              const rows = byDay.get(d) ?? [];
              if (rows.length === 0) {
                return <EmptyRow key={d} date={d} />;
              }
              return rows.map((s, i) => (
                <tr key={s.id} data-weekend={s.is_weekend || undefined}>
                  <td className="mono" style={{ fontSize: 11.5, color: i === 0 ? "var(--ink)" : "var(--ink-4)" }}>
                    {i === 0 ? fmtDay(d) : ""}
                  </td>
                  <td>
                    {s.type_code ? <TypeBlock t={s.type_code} /> : <span style={{ color: "var(--ink-4)" }}>—</span>}
                  </td>
                  <td className="mono" style={{ fontSize: 11.5 }}>
                    {s.so_number ? (
                      <Link
                        href={`/cases/${encodeURIComponent(s.so_number)}`}
                        style={{ color: "var(--ink)", textDecoration: "none" }}
                      >
                        <CodeBadge>{s.so_number}</CodeBadge>
                      </Link>
                    ) : (
                      <span style={{ color: "var(--ink-4)" }}>—</span>
                    )}
                  </td>
                  <td className="num">{(s.work_minutes ?? 0) > 0 ? fmtTime(s.work_minutes) : ""}</td>
                  <td className="num">{(s.travel_minutes ?? 0) > 0 ? fmtTime(s.travel_minutes) : ""}</td>
                  <td className="num">{(s.office_minutes ?? 0) > 0 ? fmtTime(s.office_minutes) : ""}</td>
                  <td className="num">{(s.break_minutes ?? 0) > 0 ? fmtTime(s.break_minutes) : ""}</td>
                  <td>
                    <ApprovalChip status={s.approval_status} />
                  </td>
                  <td>
                    <span style={{ fontSize: 10.5, color: "var(--ink-4)" }}>
                      {s.source === "manual" ? (
                        <span title="Manual entry">✋</span>
                      ) : s.source === "planner" ? (
                        <span title="Parsed from planner">🪄</span>
                      ) : s.source === "planning" ? (
                        <span title="Planning grid">📋</span>
                      ) : (
                        s.source ?? ""
                      )}
                    </span>
                  </td>
                </tr>
              ));
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function EmptyRow({ date }: { date: string }) {
  const d = new Date(date);
  const weekend = d.getDay() === 0 || d.getDay() === 6;
  return (
    <tr data-weekend={weekend || undefined}>
      <td className="mono" style={{ fontSize: 11.5, color: weekend ? "var(--red)" : "var(--ink-4)" }}>
        {fmtDay(date)}
      </td>
      <td colSpan={8} style={{ color: "var(--ink-4)", fontSize: 11.5, fontStyle: "italic" }}>
        {weekend ? (
          <span>
            <Icon name="dot" size={8} /> Weekend
          </span>
        ) : (
          <span>— no sessions</span>
        )}
      </td>
    </tr>
  );
}
