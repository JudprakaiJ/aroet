"use client";

import { useState, useTransition, useMemo } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { assignSession, deleteSessionFromGrid } from "./actions";

interface Engineer {
  code: string;
  full_name: string;
  role: string;
  is_active: boolean;
}

interface Session {
  id: number;
  so_number: string;
  machine_no?: string | null;
  engineer_code: string;
  session_date: string;
  type_code?: string | null;
  activity_type: string;
  travel_minutes: number;
  work_minutes: number;
  office_minutes: number;
  work_done?: string | null;
}

interface Case {
  so_number: string;
  project_code?: string | null;
  service_type_code?: string | null;
  customer_name?: string | null;
  title?: string | null;
}

const TYPE_COLORS: Record<string, { bg: string; fg: string; chipBg: string; label: string }> = {
  T: { bg: "#C0DD97", fg: "#173404", chipBg: "rgba(23,52,4,0.15)", label: "In-country" },
  V: { bg: "#639922", fg: "#ffffff", chipBg: "rgba(255,255,255,0.2)", label: "Overseas" },
  A: { bg: "#D3D1C7", fg: "#2C2C2A", chipBg: "rgba(0,0,0,0.1)", label: "TBD" },
  PERS: { bg: "#85B7EB", fg: "#042C53", chipBg: "rgba(255,255,255,0.35)", label: "Personal" },
  AL: { bg: "#AFA9EC", fg: "#26215C", chipBg: "rgba(255,255,255,0.35)", label: "Annual" },
  SICK: { bg: "#444441", fg: "#ffffff", chipBg: "rgba(255,255,255,0.2)", label: "Sick" },
  WFH: { bg: "#E5DBA3", fg: "#6B3D04", chipBg: "rgba(255,255,255,0.4)", label: "Work from home" },
  OFF: { bg: "#F1EFE8", fg: "#2C2C2A", chipBg: "rgba(0,0,0,0.1)", label: "Office" },
};

const LEAVE_TYPES = new Set(["AL", "SICK", "PERS", "WFH", "OFF"]);

const TYPE_OPTIONS = ["T", "V", "A", "PERS", "AL", "SICK", "WFH", "OFF"] as const;

function isWeekend(dateIso: string) {
  const d = new Date(dateIso);
  const day = d.getDay();
  return day === 0 || day === 6;
}

function dayLabel(dateIso: string) {
  return new Date(dateIso).getDate().toString();
}

function dayOfWeekShort(dateIso: string) {
  return ["S", "M", "T", "W", "T", "F", "S"][new Date(dateIso).getDay()];
}

function isSundayBeforeMonday(dateIso: string) {
  // Returns true if next day is Monday (so add separator after Sunday)
  return new Date(dateIso).getDay() === 0;
}

function buildDateRange(fromIso: string, toIso: string): string[] {
  const result: string[] = [];
  const from = new Date(fromIso);
  const to = new Date(toIso);
  while (from <= to) {
    result.push(from.toISOString().split("T")[0]);
    from.setDate(from.getDate() + 1);
  }
  return result;
}

function fmtDateLong(iso: string) {
  return new Date(iso).toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" });
}

export default function PlanningGrid({
  engineers,
  sessions,
  cases,
  fromDate,
  toDate,
  weeks,
}: {
  engineers: Engineer[];
  sessions: Session[];
  cases: Case[];
  fromDate: string;
  toDate: string;
  weeks: number;
}) {
  const router = useRouter();
  const [editing, setEditing] = useState<{ engineer: string; date: string } | null>(null);

  const dates = useMemo(() => buildDateRange(fromDate, toDate), [fromDate, toDate]);

  // Index sessions by engineer-date
  const sessionMap = useMemo(() => {
    const map = new Map<string, Session>();
    sessions.forEach((s) => {
      map.set(`${s.engineer_code}-${s.session_date}`, s);
    });
    return map;
  }, [sessions]);

  const caseMap = useMemo(() => {
    const map = new Map<string, Case>();
    cases.forEach((c) => map.set(c.so_number, c));
    return map;
  }, [cases]);

  function navWeeks(direction: -1 | 1) {
    const d = new Date(fromDate);
    d.setDate(d.getDate() + direction * weeks * 7);
    const newFrom = d.toISOString().split("T")[0];
    router.push(`/planning?from=${newFrom}&weeks=${weeks}`);
  }

  function changeWeeks(newWeeks: string) {
    router.push(`/planning?from=${fromDate}&weeks=${newWeeks}`);
  }

  return (
    <div className="px-6 py-6">
      <div className="flex items-center justify-between mb-3 flex-wrap gap-2">
        <div>
          <h1 className="text-[22px] font-bold leading-tight">Planning</h1>
          <p className="text-[12px] text-slate-500 mt-0.5">
            {fmtDateLong(fromDate)} → {fmtDateLong(toDate)} · {weeks} weeks · {engineers.length} engineers
          </p>
        </div>
        <div className="flex items-center gap-1.5 flex-wrap">
          <button
            onClick={() => navWeeks(-1)}
            className="text-[12px] px-2 py-1.5 rounded border border-slate-200 bg-white"
            title="Previous range"
          >
            ◀
          </button>
          <select
            value={weeks}
            onChange={(e) => changeWeeks(e.target.value)}
            className="text-[12px] px-2 py-1.5 rounded border border-slate-200 bg-white"
          >
            <option value="4">4 weeks</option>
            <option value="8">8 weeks (2mo)</option>
            <option value="12">12 weeks (3mo)</option>
          </select>
          <button
            onClick={() => navWeeks(1)}
            className="text-[12px] px-2 py-1.5 rounded border border-slate-200 bg-white"
            title="Next range"
          >
            ▶
          </button>
          <button
            onClick={() => router.refresh()}
            className="text-[12px] px-2 py-1.5 rounded border border-slate-200 bg-white"
            title="Refresh"
          >
            ↻
          </button>
        </div>
      </div>

      {/* Legend */}
      <div className="flex gap-1.5 flex-wrap mb-2 text-[10px] items-center">
        <span className="text-slate-500 font-medium mr-1">Legend:</span>
        {Object.entries(TYPE_COLORS).map(([code, c]) => (
          <span
            key={code}
            className="px-1.5 py-0.5 rounded font-semibold"
            style={{ background: c.bg, color: c.fg }}
          >
            {code}
          </span>
        ))}
        <span
          className="px-1.5 py-0.5 rounded font-semibold ml-1"
          style={{ background: "#F09595", color: "#501313" }}
        >
          Wknd
        </span>
      </div>

      {/* Grid */}
      <div className="bg-white border border-slate-200 rounded-md overflow-hidden">
        <div className="overflow-x-auto">
          <table className="border-collapse text-[9px]" style={{ tableLayout: "fixed", minWidth: "100%" }}>
            <colgroup>
              <col style={{ width: "50px" }} />
              {dates.map((d) => (
                <col key={d} style={{ width: "62px" }} />
              ))}
            </colgroup>
            <thead>
              <tr style={{ background: "#FAFAF9", borderBottom: "1.5px solid #1a1a1a" }}>
                <th
                  className="sticky left-0 z-20 text-center font-semibold text-[10px] text-slate-600 py-1.5"
                  style={{
                    background: "#FAFAF9",
                    borderRight: "1.5px solid #1a1a1a",
                  }}
                >
                  Eng
                </th>
                {dates.map((d) => {
                  const weekend = isWeekend(d);
                  const sundayBeforeMonday = isSundayBeforeMonday(d);
                  return (
                    <th
                      key={d}
                      className="text-center py-1.5 font-medium"
                      style={{
                        background: weekend ? "#F09595" : "#C0DD97",
                        color: weekend ? "#501313" : "#173404",
                        borderRight: sundayBeforeMonday
                          ? "2px solid #1a1a1a"
                          : `0.5px solid ${weekend ? "#E24B4A" : "#97C459"}`,
                        fontSize: "9px",
                      }}
                    >
                      <div>{dayLabel(d)}</div>
                      <div style={{ fontSize: "8px", opacity: 0.65 }}>{dayOfWeekShort(d)}</div>
                    </th>
                  );
                })}
              </tr>
            </thead>
            <tbody>
              {engineers.map((eng) => (
                <tr key={eng.code}>
                  <td
                    className="sticky left-0 z-10 text-center font-bold text-[11px] py-1 border-b border-slate-100"
                    style={{
                      background: "white",
                      borderRight: "1.5px solid #1a1a1a",
                    }}
                  >
                    {eng.code}
                  </td>
                  {dates.map((d) => {
                    const key = `${eng.code}-${d}`;
                    const s = sessionMap.get(key);
                    const weekend = isWeekend(d);
                    const sundayBeforeMonday = isSundayBeforeMonday(d);
                    const tc = s?.type_code || "T";
                    const colors = TYPE_COLORS[tc] || TYPE_COLORS.T;
                    const isLeave = s && LEAVE_TYPES.has(tc);
                    const caseInfo = s ? caseMap.get(s.so_number) : null;

                    if (weekend) {
                      return (
                        <td
                          key={d}
                          className="border-b border-slate-100"
                          style={{
                            background: "#F09595",
                            borderRight: sundayBeforeMonday
                              ? "2px solid #1a1a1a"
                              : "0.5px solid #E24B4A",
                            cursor: "pointer",
                          }}
                          onClick={() => setEditing({ engineer: eng.code, date: d })}
                        ></td>
                      );
                    }

                    if (!s) {
                      return (
                        <td
                          key={d}
                          className="border-b border-slate-100"
                          style={{
                            borderRight: sundayBeforeMonday
                              ? "2px solid #1a1a1a"
                              : "0.5px solid #E5E7EB",
                            cursor: "pointer",
                          }}
                          onClick={() => setEditing({ engineer: eng.code, date: d })}
                        ></td>
                      );
                    }

                    // Has a session — Option B Compact layout
                    if (isLeave) {
                      // For leave/personal/WFH/Office — center big letter
                      return (
                        <td
                          key={d}
                          className="border-b border-slate-100"
                          style={{
                            background: colors.bg,
                            borderRight: sundayBeforeMonday
                              ? "2px solid #1a1a1a"
                              : `0.5px solid ${shade(colors.bg)}`,
                            cursor: "pointer",
                            verticalAlign: "middle",
                            textAlign: "center",
                            height: "62px",
                          }}
                          onClick={() => setEditing({ engineer: eng.code, date: d })}
                          title={`${eng.code} · ${d} · ${colors.label}`}
                        >
                          <div style={{ color: colors.fg, fontSize: "13px", fontWeight: 700 }}>{tc}</div>
                        </td>
                      );
                    }

                    // Work session — Compact (Project / SO / Machine + chip)
                    return (
                      <td
                        key={d}
                        className="border-b border-slate-100"
                        style={{
                          background: colors.bg,
                          borderRight: sundayBeforeMonday
                            ? "2px solid #1a1a1a"
                            : `0.5px solid ${shade(colors.bg)}`,
                          cursor: "pointer",
                          padding: "3px",
                          verticalAlign: "top",
                          lineHeight: "1.15",
                          height: "62px",
                        }}
                        onClick={() => setEditing({ engineer: eng.code, date: d })}
                        title={`${s.so_number}${caseInfo?.title ? " · " + caseInfo.title : ""}${
                          caseInfo?.customer_name ? " · " + caseInfo.customer_name : ""
                        }`}
                      >
                        <div style={{ color: colors.fg, fontSize: "9px", fontWeight: 700 }}>
                          {caseInfo?.project_code || "—"}
                        </div>
                        <div style={{ color: colors.fg, fontSize: "8px" }}>{s.so_number}</div>
                        <div style={{ color: colors.fg, fontSize: "8px", opacity: 0.9 }}>
                          {s.machine_no || ""}
                        </div>
                        <div
                          style={{
                            marginTop: "2px",
                            display: "inline-block",
                            background: colors.chipBg,
                            padding: "0 3px",
                            borderRadius: "2px",
                          }}
                        >
                          <span style={{ color: colors.fg, fontSize: "8px", fontWeight: 700 }}>
                            {tc} · {caseInfo?.service_type_code || ""}
                          </span>
                        </div>
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <p className="text-[11px] text-slate-400 mt-3 italic text-center">
        Click cell to assign · 2px black line = week separator · Scroll horizontally for more weeks
      </p>

      {editing && (
        <AssignModal
          engineer={editing.engineer}
          date={editing.date}
          session={sessionMap.get(`${editing.engineer}-${editing.date}`)}
          cases={cases}
          onClose={() => setEditing(null)}
          onSaved={() => {
            setEditing(null);
            router.refresh();
          }}
        />
      )}
    </div>
  );
}

// Helper — slightly darker border color for cell
function shade(hex: string): string {
  // Quick lookup — known cell bgs to slight border
  const map: Record<string, string> = {
    "#C0DD97": "#97C459",
    "#639922": "#3B6D11",
    "#D3D1C7": "#B4B2A9",
    "#85B7EB": "#5994CC",
    "#AFA9EC": "#7F77DD",
    "#444441": "#2C2C2A",
    "#E5DBA3": "#BA7517",
    "#F1EFE8": "#D5D2C8",
  };
  return map[hex] || "#E5E7EB";
}

function AssignModal({
  engineer,
  date,
  session,
  cases,
  onClose,
  onSaved,
}: {
  engineer: string;
  date: string;
  session?: Session;
  cases: Case[];
  onClose: () => void;
  onSaved: () => void;
}) {
  const [pending, startTransition] = useTransition();
  const [typeCode, setTypeCode] = useState<string>(session?.type_code || "T");
  const [soNumber, setSoNumber] = useState(session?.so_number || "");
  const [notes, setNotes] = useState(session?.work_done || "");
  const [error, setError] = useState("");

  const isLeave = LEAVE_TYPES.has(typeCode);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");

    if (!isLeave && !soNumber) {
      setError("Select case/SO (or pick a leave type)");
      return;
    }

    startTransition(async () => {
      const result = await assignSession({
        engineer_code: engineer,
        session_date: date,
        type_code: typeCode,
        so_number: isLeave ? null : soNumber,
        work_done: notes,
        existing_id: session?.id,
      });
      if (result.success) onSaved();
      else setError(result.error || "Failed");
    });
  }

  function handleDelete() {
    if (!session?.id) return;
    if (!confirm("Delete this assignment?")) return;
    startTransition(async () => {
      const result = await deleteSessionFromGrid(session.id);
      if (result.success) onSaved();
      else setError(result.error || "Failed");
    });
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: "rgba(15,23,42,0.5)" }}
    >
      <div className="bg-white rounded-2xl p-6 max-w-md w-full shadow-xl">
        <div className="flex justify-between items-center mb-4 pb-3 border-b border-slate-200">
          <div>
            <h3 className="text-[16px] font-semibold">
              {session ? "Edit assignment" : "Assign session"}
            </h3>
            <p className="text-[12px] text-slate-500 mt-0.5">
              {engineer} · {fmtDateLong(date)}
            </p>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600 text-lg">
            ✕
          </button>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-2.5 mb-3 text-[12px] text-red-700">
            ⚠ {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-[12px] font-medium text-slate-700 mb-2">
              Type <span style={{ color: "#C8102E" }}>*</span>
            </label>
            <div className="grid grid-cols-4 gap-1.5">
              {TYPE_OPTIONS.map((code) => {
                const c = TYPE_COLORS[code];
                const isActive = typeCode === code;
                return (
                  <button
                    key={code}
                    type="button"
                    onClick={() => setTypeCode(code)}
                    className="text-[11px] py-2 rounded-md font-semibold leading-tight"
                    style={
                      isActive
                        ? {
                            background: c.bg,
                            color: c.fg,
                            border: `1.5px solid ${c.fg}`,
                          }
                        : {
                            background: "white",
                            color: "#1a1a1a",
                            border: "1px solid #e2e8f0",
                          }
                    }
                  >
                    <div>{code}</div>
                    <div style={{ fontSize: "9px", opacity: 0.7, fontWeight: 400 }}>
                      {c.label}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {!isLeave && (
            <div>
              <label className="block text-[12px] font-medium text-slate-700 mb-1.5">
                Case (SO) <span style={{ color: "#C8102E" }}>*</span>
              </label>
              <select
                value={soNumber}
                onChange={(e) => setSoNumber(e.target.value)}
                className="w-full px-3 py-2 text-[13px] border border-slate-200 rounded-lg"
              >
                <option value="">— Select case —</option>
                {cases.map((c) => (
                  <option key={c.so_number} value={c.so_number}>
                    {c.so_number}
                    {c.project_code ? ` · ${c.project_code}` : ""}
                    {c.customer_name ? ` · ${c.customer_name}` : ""}
                  </option>
                ))}
              </select>
            </div>
          )}

          <div>
            <label className="block text-[12px] font-medium text-slate-700 mb-1.5">
              Notes
            </label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={2}
              placeholder="Optional notes"
              className="w-full px-3 py-2 text-[13px] border border-slate-200 rounded-lg"
            />
          </div>

          <div className="flex justify-between items-center pt-3 border-t border-slate-100">
            {session ? (
              <button
                type="button"
                onClick={handleDelete}
                className="text-[12px] px-3 py-1.5 rounded border border-red-200 text-red-600 hover:bg-red-50"
              >
                🗑 Clear day
              </button>
            ) : (
              <span></span>
            )}
            <div className="flex gap-2">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 rounded-lg text-[13px] border border-slate-300 bg-white"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={pending}
                className="px-4 py-2 rounded-lg text-[13px] text-white disabled:opacity-50"
                style={{ background: "#C8102E" }}
              >
                {pending ? "Saving..." : "✓ Save"}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}
