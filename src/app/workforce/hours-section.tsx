"use client";

import { useState } from "react";
import Link from "next/link";
import { TypeBlock } from "@/components/primitives/type-block";
import { CodeBadge } from "@/components/primitives/code-badge";
import { Icon } from "@/components/icons";
import { fmtDay, fmtTime } from "@/lib/format";
import { daysInRange } from "@/lib/pay-period";
import { SessionEditSheet } from "./session-edit-sheet";
import type { HoursSession } from "./queries";

type ApprovalKey = "draft" | "submitted" | "approved" | "returned";

const APPROVAL_LABEL: Record<ApprovalKey, string> = {
  draft: "Draft",
  submitted: "Submitted",
  approved: "Approved",
  returned: "Returned",
};

const APPROVAL_COLOR: Record<ApprovalKey, { bg: string; fg: string }> = {
  draft: { bg: "var(--surface-2)", fg: "var(--ink-3)" },
  submitted: { bg: "var(--info-soft)", fg: "var(--info)" },
  approved: { bg: "var(--ok-soft)", fg: "var(--ok)" },
  returned: { bg: "var(--danger-soft)", fg: "var(--danger)" },
};

type Props = {
  sessions: HoursSession[];
  start: string;
  end: string;
  engineerCode: string;
};

export function HoursSection({ sessions, start, end, engineerCode }: Props) {
  const days = daysInRange(start, end);
  const byDay = new Map<string, HoursSession[]>();
  for (const s of sessions) {
    const arr = byDay.get(s.session_date) ?? [];
    arr.push(s);
    byDay.set(s.session_date, arr);
  }

  const [editingSession, setEditingSession] = useState<HoursSession | null>(null);
  const [creatingForDate, setCreatingForDate] = useState<string | null>(null);
  const sheetOpen = editingSession !== null || creatingForDate !== null;

  const openEdit = (s: HoursSession) => {
    setCreatingForDate(null);
    setEditingSession(s);
  };
  const openCreate = (forDate: string) => {
    setEditingSession(null);
    setCreatingForDate(forDate);
  };
  const close = () => {
    setEditingSession(null);
    setCreatingForDate(null);
  };

  const today = new Date().toLocaleDateString("en-CA", { timeZone: "Asia/Bangkok" });

  return (
    <>
      <div
        style={{
          padding: "0 14px 8px",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          gap: 8,
        }}
      >
        <div className="kicker">Day-by-day</div>
        <button
          type="button"
          className="dt-pill primary"
          onClick={() => openCreate(today)}
        >
          <Icon name="plus" size={12} /> Add session
        </button>
      </div>

      <div className="card" style={{ overflow: "hidden", margin: "0 14px" }}>
        <div style={{ overflow: "auto", maxHeight: "calc(100vh - 360px)" }}>
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
                <th></th>
              </tr>
            </thead>
            <tbody>
              {days.map((d) => {
                const rows = byDay.get(d) ?? [];
                if (rows.length === 0) {
                  return <EmptyRow key={d} date={d} onAdd={() => openCreate(d)} />;
                }
                return rows.map((s, i) => (
                  <tr
                    key={s.id}
                    data-weekend={s.is_weekend || undefined}
                    style={{ cursor: "pointer" }}
                    onClick={() => openEdit(s)}
                  >
                    <td
                      className="mono"
                      style={{
                        fontSize: 11.5,
                        color: i === 0 ? "var(--ink)" : "var(--ink-4)",
                      }}
                    >
                      {i === 0 ? fmtDay(d) : ""}
                    </td>
                    <td>
                      {s.type_code ? (
                        <TypeBlock t={s.type_code} />
                      ) : (
                        <span style={{ color: "var(--ink-4)" }}>—</span>
                      )}
                    </td>
                    <td
                      className="mono"
                      style={{ fontSize: 11.5 }}
                      onClick={(e) => {
                        if (s.so_number) e.stopPropagation();
                      }}
                    >
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
                      <ApprovalChip
                        status={s.approval_status}
                        approvedBy={s.approved_by}
                        approvedAt={s.approved_at}
                        returnReason={s.return_reason}
                      />
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
                    <td style={{ color: "var(--ink-4)" }}>
                      <Icon name="chevron" size={12} />
                    </td>
                  </tr>
                ));
              })}
            </tbody>
          </table>
        </div>
      </div>

      <SessionEditSheet
        open={sheetOpen}
        onClose={close}
        session={editingSession}
        defaultDate={creatingForDate ?? today}
        engineerCode={engineerCode}
      />
    </>
  );
}

function ApprovalChip({
  status,
  approvedBy,
  approvedAt,
  returnReason,
}: {
  status: string | null;
  approvedBy?: string | null;
  approvedAt?: string | null;
  returnReason?: string | null;
}) {
  const key = (status ?? "draft") as ApprovalKey;
  const color = APPROVAL_COLOR[key] ?? APPROVAL_COLOR.draft;
  const tooltipParts: string[] = [];
  if (status === "approved" && approvedBy) {
    tooltipParts.push(`Approved by ${approvedBy}`);
    if (approvedAt) {
      const d = new Date(approvedAt).toLocaleString("en-GB", {
        day: "2-digit",
        month: "short",
        year: "2-digit",
        hour: "2-digit",
        minute: "2-digit",
      });
      tooltipParts.push(`on ${d}`);
    }
  }
  if (status === "returned" && returnReason) {
    tooltipParts.push(`Reason: ${returnReason}`);
  }
  const tooltip = tooltipParts.length > 0 ? tooltipParts.join(" ") : undefined;
  return (
    <span
      className="chip"
      title={tooltip}
      style={{ background: color.bg, color: color.fg, fontSize: 10, fontWeight: 600 }}
    >
      {APPROVAL_LABEL[key] ?? status ?? "—"}
    </span>
  );
}

function EmptyRow({ date, onAdd }: { date: string; onAdd: () => void }) {
  const d = new Date(date);
  const weekend = d.getDay() === 0 || d.getDay() === 6;
  return (
    <tr data-weekend={weekend || undefined} style={{ cursor: "pointer" }} onClick={onAdd}>
      <td
        className="mono"
        style={{ fontSize: 11.5, color: weekend ? "var(--red)" : "var(--ink-4)" }}
      >
        {fmtDay(date)}
      </td>
      <td
        colSpan={9}
        style={{ color: "var(--ink-4)", fontSize: 11.5, fontStyle: "italic" }}
      >
        {weekend ? (
          <span>
            <Icon name="dot" size={8} /> Weekend
          </span>
        ) : (
          <span>
            <Icon name="plus" size={11} /> Add session
          </span>
        )}
      </td>
    </tr>
  );
}
