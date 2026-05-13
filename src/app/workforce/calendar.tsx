"use client";

import { useMemo, useState, useTransition, Fragment } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { daysInRange, dayLabel, type PayPeriodPreset, type PayPeriod } from "@/lib/pay-period";
import { approveSession, returnSession, submitSession } from "./actions";

interface Engineer {
  code: string;
  name: string | null;
  role: string | null;
}

interface Session {
  id: string; // uuid
  so_number: string;
  session_date: string;
  engineer_code: string;
  activity_type: string;
  travel_minutes: number | null;
  break_minutes: number | null;
  work_minutes: number | null;
  office_minutes: number | null;
  is_holiday: boolean | null;
  is_weekend: boolean | null;
  approval_status: string | null;
  work_done: string | null;
  is_shared?: boolean | null;
  shared_with_so?: string[] | null;
}

interface Case {
  so_number: string;
  title: string | null;
  service_type: string | null;
  customer_code: string | null;
  machine_no: string | null;
}

interface Props {
  engineers: Engineer[];
  sessions: Session[];
  cases: Case[];
  period: PayPeriod;
  preset: PayPeriodPreset;
  year: number;
  month: number;
  filterEngineer?: string;
}

// Activity color tokens
const ACTIVITY_COLORS: Record<string, string> = {
  field: "#185FA5",
  travel: "#993556",
  remote: "#5B21B6",
  training: "#BA7517",
  upgrade: "#3B6D11",
  office: "#5F5E5A",
};

const STATUS_COLORS: Record<string, { bg: string; fg: string; label: string }> = {
  draft: { bg: "#F1F5F9", fg: "#475569", label: "Draft" },
  submitted: { bg: "#FAEEDA", fg: "#6B3D04", label: "Submitted" },
  approved: { bg: "#D1FAE5", fg: "#065F46", label: "Approved" },
  returned: { bg: "#FBEAF0", fg: "#993556", label: "Returned" },
};

export default function WorkforceCalendar({
  engineers,
  sessions,
  cases,
  period,
  preset,
  year,
  month,
  filterEngineer,
}: Props) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [expanded, setExpanded] = useState<Set<string>>(new Set());
  const [pending, startTransition] = useTransition();

  const days = useMemo(() => daysInRange(period.start, period.end), [period]);
  const caseMap = useMemo(() => {
    const m = new Map<string, Case>();
    cases.forEach((c) => m.set(c.so_number, c));
    return m;
  }, [cases]);

  // Deduplicate sessions: when a session is shared across multiple SOs,
  // keep only 1 row per (engineer + date + raw signature) for time aggregation purposes.
  // We pick the one with alphabetically-first SO as canonical.
  const dedupedSessions = useMemo(() => {
    const sigMap = new Map<string, Session>();
    for (const s of sessions) {
      // signature = engineer + date + minutes (treat as same shared if numbers match)
      const sig = `${s.engineer_code}|${s.session_date}|${s.travel_minutes}|${s.work_minutes}|${s.office_minutes}|${s.activity_type}`;
      const existing = sigMap.get(sig);
      if (!existing || s.so_number < existing.so_number) {
        sigMap.set(sig, s);
      }
    }
    return Array.from(sigMap.values());
  }, [sessions]);

  // Build engineer → date → sessions[] map (using DEDUPED sessions for accurate totals)
  const grid = useMemo(() => {
    const g = new Map<string, Map<string, Session[]>>();
    for (const eng of engineers) {
      g.set(eng.code, new Map());
    }
    for (const s of dedupedSessions) {
      if (!g.has(s.engineer_code)) g.set(s.engineer_code, new Map());
      const byDate = g.get(s.engineer_code)!;
      if (!byDate.has(s.session_date)) byDate.set(s.session_date, []);
      byDate.get(s.session_date)!.push(s);
    }
    return g;
  }, [engineers, dedupedSessions]);

  // Filter to visible engineers (have any sessions in period, or filterEngineer)
  const visibleEngineers = useMemo(() => {
    if (filterEngineer) return engineers.filter((e) => e.code === filterEngineer);
    // Show all engineers that have at least 1 session in period
    return engineers.filter((e) => {
      const byDate = grid.get(e.code);
      return byDate && byDate.size > 0;
    });
  }, [engineers, grid, filterEngineer]);

  const totalStats = useMemo(() => {
    let totalWork = 0;
    let totalOT = 0;
    const casesWorked = new Set<string>();
    for (const s of dedupedSessions) {
      const total = (s.travel_minutes || 0) + (s.work_minutes || 0) + (s.office_minutes || 0);
      totalWork += total;
      if (total > 480) totalOT += total - 480;
      if (s.so_number) casesWorked.add(s.so_number);
      // Also count shared_with_so as cases worked
      if (s.shared_with_so && s.shared_with_so.length > 0) {
        s.shared_with_so.forEach((so) => casesWorked.add(so));
      }
    }
    return {
      engineers: visibleEngineers.length,
      totalHours: Math.round(totalWork / 60),
      otHours: Math.round(totalOT / 60),
      cases: casesWorked.size,
    };
  }, [sessions, visibleEngineers]);

  function setPeriod(newPreset: PayPeriodPreset) {
    const sp = new URLSearchParams(searchParams);
    sp.set("preset", newPreset);
    sp.set("year", String(year));
    sp.set("month", String(month));
    router.push(`/workforce?${sp.toString()}`);
  }

  function navigateMonth(delta: number) {
    let m = month + delta;
    let y = year;
    if (m > 12) { m = 1; y++; }
    if (m < 1) { m = 12; y--; }
    const sp = new URLSearchParams(searchParams);
    sp.set("year", String(y));
    sp.set("month", String(m));
    router.push(`/workforce?${sp.toString()}`);
  }

  function toggleExpand(key: string) {
    const next = new Set(expanded);
    if (next.has(key)) next.delete(key);
    else next.add(key);
    setExpanded(next);
  }

  function handleApprove(sessionId: string) {
    startTransition(async () => {
      await approveSession(sessionId);
      router.refresh();
    });
  }

  function handleReturn(sessionId: string) {
    const reason = prompt("Reason for returning?");
    if (!reason) return;
    startTransition(async () => {
      await returnSession(sessionId, reason);
      router.refresh();
    });
  }

  function handleSubmit(sessionId: string) {
    startTransition(async () => {
      await submitSession(sessionId);
      router.refresh();
    });
  }

  return (
    <div className="max-w-7xl mx-auto px-6 py-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-2">
        <h1 className="text-[28px] font-bold text-slate-900 leading-tight">Workforce</h1>
        <button className="text-[14px] px-4 py-2.5 rounded-lg font-medium border border-slate-300 bg-white text-slate-700 hover:bg-slate-50">
          ⬇ Export CSV
        </button>
      </div>
      <p className="text-[14px] text-slate-500 mb-6">
        Track engineer hours, OT, and case assignments · {period.label}
      </p>

      {/* Filter bar */}
      <div className="bg-white border border-slate-200 rounded-2xl px-5 py-4 mb-5 flex flex-wrap gap-4 items-center">
        <div className="flex items-center gap-2">
          <button
            onClick={() => navigateMonth(-1)}
            className="w-9 h-9 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 text-base"
          >
            ‹
          </button>
          <strong className="text-[15px] font-semibold min-w-[100px] text-center">
            {["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"][month-1]} {year}
          </strong>
          <button
            onClick={() => navigateMonth(1)}
            className="w-9 h-9 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 text-base"
          >
            ›
          </button>
        </div>
        <div className="h-7 border-l border-slate-200" />
        <div className="flex gap-1.5 flex-wrap">
          {[
            { key: "month" as const, label: "This month" },
            { key: "h1_1_15" as const, label: "1—15" },
            { key: "h2_16_end" as const, label: "16—end" },
            { key: "h1_1_20" as const, label: "1—20" },
            { key: "h2_21_end" as const, label: "21—end" },
          ].map((p) => (
            <button
              key={p.key}
              onClick={() => setPeriod(p.key)}
              className="text-[13px] px-3.5 py-2 rounded-lg font-medium"
              style={
                preset === p.key
                  ? { background: "#FCE8EB", color: "#C8102E", border: "1.5px solid #C8102E" }
                  : { background: "white", color: "#1a1a1a", border: "1px solid #e2e8f0" }
              }
            >
              {p.label}
            </button>
          ))}
        </div>
        <span className="text-[13px] text-slate-500 ml-auto">
          {period.start} → {period.end}
        </span>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-5">
        <Stat label="Engineers active" value={totalStats.engineers.toString()} subtitle="with sessions" />
        <Stat label="Total hours" value={`${totalStats.totalHours}h`} subtitle={`across ${totalStats.cases} cases`} />
        <Stat label="OT hours" value={`${totalStats.otHours}h`} accent="#993556" subtitle={totalStats.totalHours > 0 ? `${Math.round((totalStats.otHours / totalStats.totalHours) * 100)}% of total` : ""} />
        <Stat label="Cases worked" value={totalStats.cases.toString()} subtitle="unique SOs" />
      </div>

      {/* Calendar table */}
      <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden">
        <div className="px-5 py-4 border-b border-slate-200 flex items-center justify-between flex-wrap gap-3">
          <div>
            <h2 className="text-[17px] font-semibold text-slate-900">Engineer activity</h2>
            <p className="text-[13px] text-slate-500 mt-0.5">Click an engineer to expand case breakdown</p>
          </div>
          <div className="flex gap-2.5 items-center text-[12px] flex-wrap">
            <Legend color={ACTIVITY_COLORS.field} label="Field" />
            <Legend color={ACTIVITY_COLORS.travel} label="Travel" />
            <Legend color={ACTIVITY_COLORS.remote} label="Remote" />
            <Legend color={ACTIVITY_COLORS.training} label="Training" />
            <Legend color={ACTIVITY_COLORS.office} label="Office" />
            <span className="inline-flex items-center gap-1 text-slate-500">
              <span className="inline-block w-3 h-3 rounded-sm border-2 border-dashed" style={{ borderColor: "#993556" }} />
              OT &gt;8h
            </span>
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full border-collapse text-[13px]">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200">
                <th className="text-left px-5 py-3 font-semibold text-slate-600 sticky left-0 bg-slate-50 min-w-[200px] text-[12px] uppercase tracking-wider">Engineer / Case</th>
                {days.map((d) => {
                  const lbl = dayLabel(d);
                  return (
                    <th
                      key={d}
                      className="px-1 py-3 font-medium min-w-[42px] text-[11px]"
                      style={{ color: lbl.isWeekend ? "#94a3b8" : "#64748b" }}
                    >
                      <div>{lbl.dow}</div>
                      <div className="text-[12px] font-bold" style={{ color: lbl.isWeekend ? "#94a3b8" : "#1a1a1a" }}>{lbl.day.toString().padStart(2, "0")}</div>
                    </th>
                  );
                })}
                <th className="text-right px-3 py-3 font-semibold text-[12px]" style={{ color: ACTIVITY_COLORS.travel }} title="Travel (T=)">ΣT</th>
                <th className="text-right px-2 py-3 font-semibold text-[12px]" style={{ color: ACTIVITY_COLORS.field }} title="Work (C=)">ΣC</th>
                <th className="text-right px-2 py-3 font-semibold text-[12px]" style={{ color: ACTIVITY_COLORS.office }} title="Office (AR=)">ΣAR</th>
                <th className="text-right px-3 py-3 font-semibold text-slate-700 text-[12px]">Total</th>
                <th className="text-right px-3 py-3 font-semibold text-slate-600 text-[12px]">OT</th>
                <th className="text-center px-4 py-3 font-semibold text-slate-600 text-[12px]">Status</th>
              </tr>
            </thead>
            <tbody>
              {visibleEngineers.map((eng) => {
                const byDate = grid.get(eng.code) || new Map<string, Session[]>();
                const allEngSessions = Array.from(byDate.values()).flat();
                let engTotal = 0;
                let engOT = 0;
                for (const s of allEngSessions) {
                  const t = (s.travel_minutes || 0) + (s.work_minutes || 0) + (s.office_minutes || 0);
                  engTotal += t;
                  if (t > 480) engOT += t - 480;
                }
                // Overall status: if any submitted/draft, show that; if all approved, approved
                const statuses = new Set(allEngSessions.map((s) => s.approval_status || "draft"));
                let overallStatus = "draft";
                if (statuses.has("draft")) overallStatus = "draft";
                else if (statuses.has("returned")) overallStatus = "returned";
                else if (statuses.has("submitted")) overallStatus = "submitted";
                else if (statuses.has("approved")) overallStatus = "approved";
                const isExpanded = expanded.has(eng.code);

                // Group sessions by SO for drill-down
                const bySO = new Map<string, Session[]>();
                for (const s of allEngSessions) {
                  const key = s.so_number || "__office__";
                  if (!bySO.has(key)) bySO.set(key, []);
                  bySO.get(key)!.push(s);
                }

                // Engineer-level T/C/AR sums
                let engT = 0, engC = 0, engAR = 0;
                for (const s of allEngSessions) {
                  engT += s.travel_minutes || 0;
                  engC += s.work_minutes || 0;
                  engAR += s.office_minutes || 0;
                }

                return (
                  <>
                    <tr key={eng.code} className="border-t border-slate-100 hover:bg-slate-50 cursor-pointer transition-colors" onClick={() => toggleExpand(eng.code)}>
                      <td className="px-5 py-3 sticky left-0 bg-white">
                        <div className="flex items-center gap-2.5">
                          <span className="text-slate-400 text-sm">{isExpanded ? "▾" : "▸"}</span>
                          <div
                            className="w-9 h-9 rounded-full flex items-center justify-center text-[11px] font-bold"
                            style={{ background: "#FCE8EB", color: "#C8102E" }}
                          >
                            {eng.code}
                          </div>
                          <div>
                            <div className="font-semibold text-[14px]">{eng.name || eng.code}</div>
                            <div className="text-[11px] text-slate-400">{bySO.size} {bySO.size === 1 ? "case" : "cases"}</div>
                          </div>
                        </div>
                      </td>
                      {days.map((d) => {
                        const dayS = byDate.get(d) || [];
                        return (
                          <td key={d} className="px-0.5 py-1.5">
                            <DayCellBar sessions={dayS} date={d} />
                          </td>
                        );
                      })}
                      <td className="px-3 py-3 text-right text-[13px] font-semibold" style={{ color: ACTIVITY_COLORS.travel }}>{fmtH(engT)}</td>
                      <td className="px-2 py-3 text-right text-[13px] font-semibold" style={{ color: ACTIVITY_COLORS.field }}>{fmtH(engC)}</td>
                      <td className="px-2 py-3 text-right text-[13px] font-semibold" style={{ color: ACTIVITY_COLORS.office }}>{fmtH(engAR)}</td>
                      <td className="px-3 py-3 text-right font-bold text-[15px]">{fmtH(engTotal)}</td>
                      <td className="px-3 py-3 text-right font-bold text-[13px]" style={{ color: engOT > 0 ? "#993556" : "#94a3b8" }}>
                        {fmtH(engOT)}
                      </td>
                      <td className="px-4 py-3 text-center">
                        <StatusBadge status={overallStatus} />
                      </td>
                    </tr>
                    {isExpanded &&
                      Array.from(bySO.entries()).map(([soKey, soSessions]) => {
                        const c = caseMap.get(soKey);
                        const isOffice = soKey === "__office__";
                        let caseTotal = 0, caseOT = 0;
                        let caseT = 0, caseC = 0, caseAR = 0;
                        for (const s of soSessions) {
                          const t = (s.travel_minutes || 0) + (s.work_minutes || 0) + (s.office_minutes || 0);
                          caseTotal += t;
                          if (t > 480) caseOT += t - 480;
                          caseT += s.travel_minutes || 0;
                          caseC += s.work_minutes || 0;
                          caseAR += s.office_minutes || 0;
                        }
                        const dominantActivity = soSessions[0]?.activity_type || "field";
                        return (
                          <Fragment key={`${eng.code}-${soKey}`}>
                            {/* Case header row */}
                            <tr className="bg-slate-50/30 border-t border-slate-100">
                              <td className="px-5 py-3 pl-12 sticky left-0 bg-slate-50/30">
                                <div className="flex items-center gap-2 flex-wrap">
                                  <span
                                    className="inline-block w-[3px] h-5 rounded"
                                    style={{ background: ACTIVITY_COLORS[dominantActivity] || "#94a3b8" }}
                                  />
                                  {!isOffice ? (
                                    <>
                                      <Link href={`/cases/${soKey}`} className="font-mono text-[13px] font-semibold hover:underline" style={{ color: "#C8102E" }}>
                                        {soKey}
                                      </Link>
                                      {c?.service_type && (
                                        <span className="text-[11px] px-2 py-0.5 rounded-md font-medium" style={{ background: "#DDEBF7", color: "#185FA5" }}>
                                          {c.service_type.split(" ")[0]}
                                        </span>
                                      )}
                                    </>
                                  ) : (
                                    <span className="text-[12px] text-slate-500 italic">Office (no SO)</span>
                                  )}
                                </div>
                                {!isOffice && c && (
                                  <div className="text-[11px] text-slate-500 ml-3 mt-1">
                                    {c.machine_no || ""}{c.machine_no && c.customer_code ? " · " : ""}{c.customer_code || ""}
                                  </div>
                                )}
                              </td>
                              {days.map((d) => {
                                const s = soSessions.find((x) => x.session_date === d);
                                const total = s
                                  ? Math.round(((s.travel_minutes || 0) + (s.work_minutes || 0) + (s.office_minutes || 0)) / 60)
                                  : 0;
                                return (
                                  <td key={d} className="px-0.5 py-2 text-center">
                                    {total > 0 ? (
                                      <span className="text-[13px] font-semibold text-slate-700">{total}</span>
                                    ) : (
                                      <span className="text-[12px] text-slate-300">—</span>
                                    )}
                                  </td>
                                );
                              })}
                              <td className="px-3 py-3 text-right text-[12px] font-medium" style={{ color: ACTIVITY_COLORS.travel }}>{fmtH(caseT)}</td>
                              <td className="px-2 py-3 text-right text-[12px] font-medium" style={{ color: ACTIVITY_COLORS.field }}>{fmtH(caseC)}</td>
                              <td className="px-2 py-3 text-right text-[12px] font-medium" style={{ color: ACTIVITY_COLORS.office }}>{fmtH(caseAR)}</td>
                              <td className="px-3 py-3 text-right text-[13px] font-semibold">{fmtH(caseTotal)}</td>
                              <td className="px-3 py-3 text-right text-[12px] font-medium" style={{ color: caseOT > 0 ? "#993556" : "#94a3b8" }}>{fmtH(caseOT)}</td>
                              <td className="px-4 py-3 text-center">
                                <div className="flex gap-1 justify-center flex-wrap">
                                  {soSessions.map((s) => (
                                    <SessionApprovalControl
                                      key={s.id}
                                      session={s}
                                      pending={pending}
                                      onApprove={() => handleApprove(s.id)}
                                      onReturn={() => handleReturn(s.id)}
                                      onSubmit={() => handleSubmit(s.id)}
                                    />
                                  ))}
                                </div>
                              </td>
                            </tr>
                            {/* Travel sub-row */}
                            {caseT > 0 && (
                              <tr className="bg-white border-t border-slate-50">
                                <td className="py-1.5 pl-16 sticky left-0 bg-white">
                                  <span className="text-[11px] font-medium" style={{ color: ACTIVITY_COLORS.travel }}>T= Travel</span>
                                </td>
                                {days.map((d) => {
                                  const ts = soSessions.find((x) => x.session_date === d && (x.travel_minutes || 0) > 0);
                                  return (
                                    <td key={d} className="py-1.5 text-center">
                                      {ts ? (
                                        <span className="text-[11px] font-medium" style={{ color: ACTIVITY_COLORS.travel }}>{fmtMinShort(ts.travel_minutes || 0)}</span>
                                      ) : null}
                                    </td>
                                  );
                                })}
                                <td className="py-1.5 px-3 text-right text-[12px] font-semibold" style={{ color: ACTIVITY_COLORS.travel }}>{fmtH(caseT)}</td>
                                <td colSpan={5}></td>
                              </tr>
                            )}
                            {/* Work sub-row */}
                            {caseC > 0 && (
                              <tr className="bg-white border-t border-slate-50">
                                <td className="py-1.5 pl-16 sticky left-0 bg-white">
                                  <span className="text-[11px] font-medium" style={{ color: ACTIVITY_COLORS.field }}>C= Work</span>
                                </td>
                                {days.map((d) => {
                                  const ws = soSessions.find((x) => x.session_date === d && (x.work_minutes || 0) > 0);
                                  return (
                                    <td key={d} className="py-1.5 text-center">
                                      {ws ? (
                                        <span className="text-[11px] font-medium" style={{ color: ACTIVITY_COLORS.field }}>{fmtMinShort(ws.work_minutes || 0)}</span>
                                      ) : null}
                                    </td>
                                  );
                                })}
                                <td></td>
                                <td className="py-1.5 px-2 text-right text-[12px] font-semibold" style={{ color: ACTIVITY_COLORS.field }}>{fmtH(caseC)}</td>
                                <td colSpan={4}></td>
                              </tr>
                            )}
                            {/* Office sub-row */}
                            {caseAR > 0 && (
                              <tr className="bg-white border-t border-slate-50">
                                <td className="py-1.5 pl-16 sticky left-0 bg-white">
                                  <span className="text-[11px] font-medium" style={{ color: ACTIVITY_COLORS.office }}>AR= Office</span>
                                </td>
                                {days.map((d) => {
                                  const os = soSessions.find((x) => x.session_date === d && (x.office_minutes || 0) > 0);
                                  return (
                                    <td key={d} className="py-1.5 text-center">
                                      {os ? (
                                        <span className="text-[11px] font-medium" style={{ color: ACTIVITY_COLORS.office }}>{fmtMinShort(os.office_minutes || 0)}</span>
                                      ) : null}
                                    </td>
                                  );
                                })}
                                <td></td>
                                <td></td>
                                <td className="py-1.5 px-2 text-right text-[12px] font-semibold" style={{ color: ACTIVITY_COLORS.office }}>{fmtH(caseAR)}</td>
                                <td colSpan={3}></td>
                              </tr>
                            )}
                          </Fragment>
                        );
                      })}
                  </>
                );
              })}
              {visibleEngineers.length === 0 && (
                <tr>
                  <td colSpan={days.length + 7} className="p-12 text-center text-slate-400 text-[13px]">
                    No sessions in this period
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

function Legend({ color, label }: { color: string; label: string }) {
  return (
    <span className="inline-flex items-center gap-1 text-slate-600">
      <span className="inline-block w-3 h-3 rounded-sm" style={{ background: color }} />
      {label}
    </span>
  );
}

function fmtH(minutes: number): string {
  if (!minutes) return "0";
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  if (h && m) return `${h}h${m.toString().padStart(2, "0")}`;
  if (h) return `${h}h`;
  return `${m}m`;
}

function fmtMinShort(minutes: number): string {
  if (!minutes) return "";
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  if (h === 0) return `${m}m`;
  if (m === 0) return `${h}h`;
  return `${h}h${m}`;
}

function Stat({ label, value, accent, subtitle }: { label: string; value: string; accent?: string; subtitle?: string }) {
  return (
    <div className="bg-white border border-slate-200 rounded-2xl p-5">
      <div className="text-[13px] text-slate-500 font-medium mb-2">{label}</div>
      <div className="text-[28px] font-bold leading-none" style={{ color: accent || "#0f172a" }}>{value}</div>
      {subtitle && <div className="text-[12px] text-slate-400 mt-1.5">{subtitle}</div>}
    </div>
  );
}

function StatusBadge({ status }: { status: string }) {
  const cfg = STATUS_COLORS[status] || STATUS_COLORS.draft;
  return (
    <span className="text-[11px] px-2 py-1 rounded-md font-medium" style={{ background: cfg.bg, color: cfg.fg }}>
      {cfg.label}
    </span>
  );
}

function DayCellBar({ sessions, date }: { sessions: Session[]; date: string }) {
  if (sessions.length === 0) {
    // Check if holiday/weekend
    const d = new Date(date);
    const isWeekendDay = d.getDay() === 0 || d.getDay() === 6;
    if (isWeekendDay) {
      return <div className="h-[28px] rounded" style={{ background: "#FAEEDA" }} />;
    }
    return <div className="h-[28px]" />;
  }

  let totalMin = 0;
  const segs: { color: string; min: number }[] = [];
  for (const s of sessions) {
    const t = s.travel_minutes || 0;
    const w = s.work_minutes || 0;
    const o = s.office_minutes || 0;
    totalMin += t + w + o;
    const baseColor = ACTIVITY_COLORS[s.activity_type] || "#185FA5";
    if (t > 0) segs.push({ color: ACTIVITY_COLORS.travel, min: t });
    if (w > 0) segs.push({ color: baseColor, min: w });
    if (o > 0) segs.push({ color: ACTIVITY_COLORS.office, min: o });
  }
  const totalH = Math.round(totalMin / 60);
  const isOT = totalMin > 480;
  const anyHoliday = sessions.some((s) => s.is_holiday || s.is_weekend);

  return (
    <div
      className="h-[28px] flex gap-0.5 rounded-md"
      style={{
        border: isOT ? "1.5px dashed #993556" : "none",
        padding: isOT ? 2 : 0,
        background: anyHoliday ? "#FAEEDA" : undefined,
      }}
      title={`${date}: ${totalH}h${isOT ? " (OT)" : ""}`}
    >
      {segs.map((seg, i) => (
        <div
          key={i}
          style={{
            background: seg.color,
            flex: seg.min,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            color: "white",
            fontWeight: 700,
            fontSize: 12,
            borderRadius: 4,
          }}
        >
          {i === segs.length - 1 ? totalH : ""}
        </div>
      ))}
    </div>
  );
}

function SessionApprovalControl({
  session,
  pending,
  onApprove,
  onReturn,
  onSubmit,
}: {
  session: Session;
  pending: boolean;
  onApprove: () => void;
  onReturn: () => void;
  onSubmit: () => void;
}) {
  const status = session.approval_status || "draft";
  if (status === "approved") {
    return (
      <span className="text-[11px] px-2 py-1 rounded-md font-medium" style={{ background: "#D1FAE5", color: "#065F46" }}>
        ✓ Approved
      </span>
    );
  }
  if (status === "submitted") {
    return (
      <span className="flex gap-1">
        <button
          disabled={pending}
          onClick={(e) => { e.stopPropagation(); onApprove(); }}
          className="text-[11px] px-2 py-1 rounded-md text-white font-medium hover:opacity-90"
          style={{ background: "#065F46" }}
          title="Approve"
        >
          ✓
        </button>
        <button
          disabled={pending}
          onClick={(e) => { e.stopPropagation(); onReturn(); }}
          className="text-[11px] px-2 py-1 rounded-md text-white font-medium hover:opacity-90"
          style={{ background: "#993556" }}
          title="Return"
        >
          ↺
        </button>
      </span>
    );
  }
  // draft or returned
  return (
    <button
      disabled={pending}
      onClick={(e) => { e.stopPropagation(); onSubmit(); }}
      className="text-[11px] px-3 py-1.5 rounded-md font-medium text-white hover:opacity-90"
      style={{ background: "#C8102E" }}
      title="Submit for approval"
    >
      Submit
    </button>
  );
}
