"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { approveSession, returnSession, bulkApproveSessions } from "./actions";
import { detectOverlaps, type SessionForOverlap } from "./lib";

interface Session {
  id: number;
  so_number: string;
  machine_no?: string | null;
  engineer_code: string;
  session_date: string;
  travel_minutes: number;
  work_minutes: number;
  office_minutes: number;
  break_minutes: number;
  activity_type: string;
  work_done?: string | null;
  is_weekend: boolean;
  approval_status: string;
  source: string;
  created_at: string;
}

interface Engineer {
  code: string;
  full_name: string;
  role: string;
}

interface Case {
  so_number: string;
  customer_name?: string | null;
  title?: string | null;
  service_type_name?: string | null;
  machine_no?: string | null;
}

const ENGINEER_COLORS: Record<string, { bg: string; fg: string }> = {
  JKH: { bg: "#FCE8EB", fg: "#C8102E" },
  PSU: { bg: "#EEEDFE", fg: "#26215C" },
  RKO: { bg: "#FAEEDA", fg: "#412402" },
  TCH: { bg: "#E1F5EE", fg: "#04342C" },
  RMA: { bg: "#FAECE7", fg: "#4A1B0C" },
  IRO: { bg: "#E6F1FB", fg: "#0C447C" },
  KBU: { bg: "#FBEAF0", fg: "#4B1528" },
  JYE: { bg: "#EAF3DE", fg: "#173404" },
};

function colorForEngineer(code: string) {
  return ENGINEER_COLORS[code] || { bg: "#F1EFE8", fg: "#2C2C2A" };
}

function fmtMin(min: number) {
  const h = Math.floor(min / 60);
  const m = min % 60;
  return m === 0 ? `${h}h` : `${h}h ${m}m`;
}

function fmtDate(d: string) {
  const date = new Date(d);
  return `${date.getDate().toString().padStart(2, "0")}/${(date.getMonth() + 1).toString().padStart(2, "0")}`;
}

function dayOfWeek(d: string) {
  const date = new Date(d);
  return ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"][date.getDay()];
}

function dominantActivity(s: Session): string {
  const t = s.travel_minutes || 0;
  const w = s.work_minutes || 0;
  const o = s.office_minutes || 0;
  if (w >= t && w >= o) return s.activity_type || "field";
  if (t >= o) return "travel";
  return "office";
}

function activityChip(activity: string): { label: string; bg: string; fg: string } {
  const map: Record<string, { label: string; bg: string; fg: string }> = {
    field: { label: "Field", bg: "#E6F1FB", fg: "#0C447C" },
    travel: { label: "Travel", bg: "#FBEAF0", fg: "#4B1528" },
    remote: { label: "Remote", bg: "#EEEDFE", fg: "#26215C" },
    training: { label: "Training", bg: "#FAEEDA", fg: "#412402" },
    upgrade: { label: "Upgrade", bg: "#EAF3DE", fg: "#173404" },
    office: { label: "Office", bg: "#F1EFE8", fg: "#2C2C2A" },
  };
  return map[activity] || map.field;
}

export default function QueueClient({
  sessions,
  engineers,
  cases,
  counts,
  currentEngineer,
  currentStatus,
}: {
  sessions: Session[];
  engineers: Engineer[];
  cases: Case[];
  counts: { submitted: number; returned: number; approved: number };
  currentEngineer: string;
  currentStatus: string;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [selectedIds, setSelectedIds] = useState<Set<number>>(new Set());
  const [returnReason, setReturnReason] = useState<{ id: number; reason: string } | null>(null);

  // Build case lookup
  const caseMap = new Map<string, Case>();
  cases.forEach((c) => caseMap.set(c.so_number, c));

  // Detect overlaps
  const overlapIds = detectOverlaps(
    sessions.map((s) => ({
      id: s.id,
      engineer_code: s.engineer_code,
      session_date: s.session_date,
      travel_minutes: s.travel_minutes,
      work_minutes: s.work_minutes,
      office_minutes: s.office_minutes,
    }))
  );

  function toggleSelect(id: number) {
    const next = new Set(selectedIds);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    setSelectedIds(next);
  }

  function toggleSelectAll() {
    if (selectedIds.size === sessions.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(sessions.map((s) => s.id)));
    }
  }

  function handleApprove(id: number) {
    startTransition(async () => {
      const result = await approveSession(id);
      if (!result.success) alert(result.error);
      setSelectedIds((prev) => {
        const next = new Set(prev);
        next.delete(id);
        return next;
      });
    });
  }

  function handleReturn(id: number, reason?: string) {
    startTransition(async () => {
      const result = await returnSession(id, reason);
      if (!result.success) alert(result.error);
      setReturnReason(null);
      setSelectedIds((prev) => {
        const next = new Set(prev);
        next.delete(id);
        return next;
      });
    });
  }

  function handleBulkApprove() {
    if (selectedIds.size === 0) return;
    if (!confirm(`Approve ${selectedIds.size} session${selectedIds.size > 1 ? "s" : ""}?`)) return;
    startTransition(async () => {
      const result = await bulkApproveSessions(Array.from(selectedIds));
      if (!result.success) alert(result.error);
      setSelectedIds(new Set());
    });
  }

  // Engineer filters with counts
  const engineerCounts = new Map<string, number>();
  sessions.forEach((s) => {
    engineerCounts.set(s.engineer_code, (engineerCounts.get(s.engineer_code) ?? 0) + 1);
  });

  return (
    <div className="max-w-7xl mx-auto px-6 py-8">
      <div className="flex items-center justify-between mb-2">
        <div>
          <h1 className="text-[28px] font-bold text-slate-900 leading-tight">Approval queue</h1>
          <p className="text-[14px] text-slate-500 mt-1">
            {counts.submitted} waiting · {counts.returned} returned · {counts.approved} approved this month
          </p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={handleBulkApprove}
            disabled={selectedIds.size === 0 || pending}
            className="text-[14px] px-5 py-2.5 rounded-lg font-medium text-white disabled:opacity-50 inline-flex items-center gap-1.5"
            style={{ background: "#C8102E" }}
          >
            ✓ Approve selected ({selectedIds.size})
          </button>
        </div>
      </div>

      {/* Status + engineer filters */}
      <div className="bg-white border border-slate-200 rounded-2xl p-4 mb-5 flex gap-3 items-center flex-wrap">
        <span className="text-[12px] font-semibold uppercase tracking-wider text-slate-500">View</span>
        <Link
          href="/workforce/queue"
          className="px-3 py-1.5 rounded-lg font-medium text-[13px]"
          style={
            currentStatus === "submitted"
              ? { background: "#FCE8EB", color: "#C8102E", border: "1.5px solid #C8102E" }
              : { background: "white", color: "#1a1a1a", border: "1px solid #e2e8f0" }
          }
        >
          Submitted <span style={{ opacity: 0.7, marginLeft: 4 }}>{counts.submitted}</span>
        </Link>
        <Link
          href="/workforce/queue?status=approved"
          className="px-3 py-1.5 rounded-lg font-medium text-[13px]"
          style={
            currentStatus === "approved"
              ? { background: "#FCE8EB", color: "#C8102E", border: "1.5px solid #C8102E" }
              : { background: "white", color: "#1a1a1a", border: "1px solid #e2e8f0" }
          }
        >
          Approved
        </Link>

        <div className="w-px h-6 bg-slate-200 mx-2"></div>

        <span className="text-[12px] font-semibold uppercase tracking-wider text-slate-500">Engineer</span>
        <Link
          href={`/workforce/queue${currentStatus === "approved" ? "?status=approved" : ""}`}
          className="px-3 py-1.5 rounded-lg font-medium text-[13px]"
          style={
            currentEngineer === "all"
              ? { background: "#FCE8EB", color: "#C8102E", border: "1.5px solid #C8102E" }
              : { background: "white", color: "#1a1a1a", border: "1px solid #e2e8f0" }
          }
        >
          All
        </Link>
        {engineers
          .filter((e) => engineerCounts.has(e.code) || currentEngineer === e.code)
          .map((e) => {
            const col = colorForEngineer(e.code);
            const isActive = currentEngineer === e.code;
            const count = engineerCounts.get(e.code) ?? 0;
            return (
              <Link
                key={e.code}
                href={`/workforce/queue?engineer=${e.code}${currentStatus === "approved" ? "&status=approved" : ""}`}
                className="px-3 py-1.5 rounded-lg font-medium text-[13px]"
                style={
                  isActive
                    ? { background: col.bg, color: col.fg, border: `1.5px solid ${col.fg}` }
                    : { background: "white", color: "#1a1a1a", border: "1px solid #e2e8f0" }
                }
              >
                {e.code}
                {count > 0 && <span style={{ opacity: 0.7, marginLeft: 4 }}>{count}</span>}
              </Link>
            );
          })}
      </div>

      {/* Sessions table */}
      <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden">
        <div className="px-4 py-3 bg-slate-50 border-b border-slate-200 flex items-center gap-3 text-[11px] font-semibold uppercase tracking-wider text-slate-600">
          <input
            type="checkbox"
            checked={sessions.length > 0 && selectedIds.size === sessions.length}
            onChange={toggleSelectAll}
            className="cursor-pointer"
          />
          <div className="w-14">Date</div>
          <div className="w-14">Eng.</div>
          <div className="flex-1">Case · Machine</div>
          <div className="w-24 text-right">Hours</div>
          <div className="w-32 text-right pr-2">Action</div>
        </div>

        {sessions.length === 0 ? (
          <div className="p-10 text-center text-[14px] text-slate-400">
            {currentStatus === "submitted" ? "🎉 No sessions waiting for approval" : "No approved sessions in this month"}
          </div>
        ) : (
          sessions.map((s) => {
            const c = caseMap.get(s.so_number);
            const eCol = colorForEngineer(s.engineer_code);
            const total = s.travel_minutes + s.work_minutes + s.office_minutes;
            const overlap = overlapIds.has(s.id);
            const activity = activityChip(dominantActivity(s));
            const isSelected = selectedIds.has(s.id);

            return (
              <div
                key={s.id}
                className="px-4 py-3 border-b border-slate-100 last:border-0 flex items-center gap-3 hover:bg-slate-50/50 transition-colors"
                style={overlap ? { background: "#FFF5F5" } : undefined}
              >
                <input
                  type="checkbox"
                  checked={isSelected}
                  onChange={() => toggleSelect(s.id)}
                  className="cursor-pointer"
                />

                <div className="w-14">
                  <div className="text-[13px] font-semibold">{fmtDate(s.session_date)}</div>
                  <div className="text-[11px] text-slate-400">{dayOfWeek(s.session_date)}</div>
                </div>

                <div className="w-14">
                  <div
                    className="w-8 h-8 rounded-full flex items-center justify-center text-[11px] font-semibold"
                    style={{ background: eCol.bg, color: eCol.fg }}
                  >
                    {s.engineer_code}
                  </div>
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <Link
                      href={`/cases/${s.so_number}`}
                      className="font-mono text-[13px] font-semibold hover:underline"
                      style={{ color: "#C8102E" }}
                    >
                      {s.so_number}
                    </Link>
                    {s.machine_no && (
                      <>
                        <span className="text-slate-300">·</span>
                        <span className="font-mono text-[12px] text-slate-600">{s.machine_no}</span>
                      </>
                    )}
                    <span
                      className="text-[11px] px-2 py-0.5 rounded-md font-medium"
                      style={{ background: activity.bg, color: activity.fg }}
                    >
                      {activity.label}
                    </span>
                    {overlap && (
                      <span
                        className="text-[11px] px-2 py-0.5 rounded-md font-medium inline-flex items-center gap-1"
                        style={{ background: "#FCEBEB", color: "#501313" }}
                        title="Day total exceeds 16 hours — possible overlap"
                      >
                        ⚠ Possible overlap
                      </span>
                    )}
                  </div>
                  <div className="text-[12px] text-slate-500 mt-1 truncate">
                    {c?.customer_name || "—"} · {c?.title || s.work_done || ""}
                  </div>
                </div>

                <div className="w-24 text-right">
                  <div className="text-[14px] font-semibold">{fmtMin(total)}</div>
                  <div className="text-[10px] text-slate-400">
                    {s.travel_minutes > 0 && <span style={{ color: "#993556" }}>T{fmtMin(s.travel_minutes)} </span>}
                    {s.work_minutes > 0 && <span style={{ color: "#185FA5" }}>C{fmtMin(s.work_minutes)} </span>}
                    {s.office_minutes > 0 && <span style={{ color: "#5F5E5A" }}>AR{fmtMin(s.office_minutes)}</span>}
                  </div>
                </div>

                <div className="w-32 text-right pr-2 flex gap-1 justify-end">
                  {currentStatus === "submitted" && (
                    <>
                      <button
                        onClick={() => handleApprove(s.id)}
                        disabled={pending}
                        className="text-[12px] px-2.5 py-1.5 rounded-md font-medium"
                        style={{ background: "#EAF3DE", color: "#173404", border: "1px solid #639922" }}
                        title="Approve"
                      >
                        ✓
                      </button>
                      <button
                        onClick={() => setReturnReason({ id: s.id, reason: "" })}
                        disabled={pending}
                        className="text-[12px] px-2.5 py-1.5 rounded-md font-medium"
                        style={{ background: "#FBEAF0", color: "#4B1528", border: "1px solid #D4537E" }}
                        title="Return"
                      >
                        ↺
                      </button>
                    </>
                  )}
                  {currentStatus === "approved" && (
                    <span
                      className="text-[11px] px-2 py-1 rounded-md font-medium"
                      style={{ background: "#D1FAE5", color: "#065F46" }}
                    >
                      ✓ Approved
                    </span>
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Return reason modal */}
      {returnReason !== null && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
          style={{ background: "rgba(15,23,42,0.5)" }}
        >
          <div className="bg-white rounded-2xl p-6 max-w-md w-full shadow-xl">
            <h3 className="text-[18px] font-semibold mb-3">Return session</h3>
            <p className="text-[13px] text-slate-600 mb-3">
              Reason for returning (will be sent to engineer):
            </p>
            <textarea
              value={returnReason.reason}
              onChange={(e) => setReturnReason({ ...returnReason, reason: e.target.value })}
              placeholder="e.g. Wrong activity type, check time..."
              rows={3}
              className="w-full px-3 py-2 text-[13px] border border-slate-200 rounded-lg"
              autoFocus
            />
            <div className="flex justify-end gap-2 mt-4">
              <button
                onClick={() => setReturnReason(null)}
                className="px-4 py-2 rounded-lg text-[13px] border border-slate-300 bg-white"
              >
                Cancel
              </button>
              <button
                onClick={() => handleReturn(returnReason.id, returnReason.reason)}
                disabled={pending}
                className="px-4 py-2 rounded-lg text-[13px] text-white"
                style={{ background: "#993556" }}
              >
                ↺ Return
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
