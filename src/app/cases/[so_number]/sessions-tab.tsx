"use client";

import { useMemo, useState } from "react";
import { fmtDay, fmtTime } from "@/lib/format";
import { CodeBadge } from "@/components/primitives/code-badge";
import { EmptyState } from "@/components/primitives/empty-state";
import { SessionCard } from "./session-card";
import type { CaseSession } from "./queries";

type GroupMode = "date" | "machine";

type DayGroup = {
  key: string; // session_date
  total: number;
  rows: CaseSession[];
  perMachine: { machine_no: string; minutes: number }[];
};

type MachineGroup = {
  key: string; // machine_no or "—"
  machine_no: string | null;
  total: number;
  days: number;
  rows: CaseSession[];
};

function rowMinutes(r: CaseSession): number {
  return (r.travel_minutes ?? 0) + (r.work_minutes ?? 0) + (r.office_minutes ?? 0);
}

function groupByDate(sessions: CaseSession[]): DayGroup[] {
  const map = new Map<string, CaseSession[]>();
  for (const s of sessions) {
    const key = s.session_date ?? "unknown";
    if (!map.has(key)) map.set(key, []);
    map.get(key)!.push(s);
  }
  return Array.from(map.entries()).map(([date, rows]) => {
    const total = rows.reduce((a, r) => a + rowMinutes(r), 0);
    const byMachine = new Map<string, number>();
    for (const r of rows) {
      const k = r.machine_no ?? "—";
      byMachine.set(k, (byMachine.get(k) ?? 0) + rowMinutes(r));
    }
    const perMachine = Array.from(byMachine.entries())
      .filter(([, m]) => m > 0)
      .map(([machine_no, minutes]) => ({ machine_no, minutes }))
      .sort((a, b) => b.minutes - a.minutes);
    return { key: date, total, rows, perMachine };
  });
}

function groupByMachine(sessions: CaseSession[]): MachineGroup[] {
  const map = new Map<string, CaseSession[]>();
  for (const s of sessions) {
    const key = s.machine_no ?? "—";
    if (!map.has(key)) map.set(key, []);
    map.get(key)!.push(s);
  }
  return Array.from(map.entries())
    .map(([key, rows]) => ({
      key,
      machine_no: key === "—" ? null : key,
      total: rows.reduce((a, r) => a + rowMinutes(r), 0),
      days: new Set(rows.map((r) => r.session_date)).size,
      rows,
    }))
    .sort((a, b) => b.total - a.total);
}

export function SessionsTab({ so_number, sessions }: { so_number: string; sessions: CaseSession[] }) {
  const [mode, setMode] = useState<GroupMode>("date");
  const machineCount = useMemo(
    () => new Set(sessions.map((s) => s.machine_no).filter(Boolean)).size,
    [sessions]
  );

  if (sessions.length === 0) {
    return (
      <div style={{ margin: "8px var(--page-px)" }}>
        <EmptyState
          icon="clock"
          title="No sessions logged yet"
          body={
            <>
              Tap <span style={{ color: "var(--red)", fontWeight: 600 }}>Add session</span> above.
            </>
          }
          compact
        />
      </div>
    );
  }

  return (
    <div style={{ padding: "0 14px 24px" }}>
      {machineCount > 1 && (
        <div
          style={{
            display: "flex",
            gap: 6,
            alignItems: "center",
            justifyContent: "flex-end",
            marginBottom: 6,
          }}
        >
          <span className="kicker">Group by</span>
          <button
            type="button"
            className="fchip"
            data-on={mode === "date" || undefined}
            onClick={() => setMode("date")}
          >
            Date
          </button>
          <button
            type="button"
            className="fchip"
            data-on={mode === "machine" || undefined}
            onClick={() => setMode("machine")}
          >
            Machine
          </button>
        </div>
      )}

      {mode === "date"
        ? groupByDate(sessions).map((g) => (
            <DateBlock key={g.key} group={g} so_number={so_number} showPerMachine={machineCount > 1} />
          ))
        : groupByMachine(sessions).map((g) => (
            <MachineBlock key={g.key} group={g} so_number={so_number} />
          ))}
    </div>
  );
}

function DateBlock({
  group,
  so_number,
  showPerMachine,
}: {
  group: DayGroup;
  so_number: string;
  showPerMachine: boolean;
}) {
  return (
    <div style={{ marginBottom: 14 }}>
      <div className="sec-h" style={{ padding: "10px 0 6px" }}>
        <h2>{fmtDay(group.key)}</h2>
        <span className="mono" style={{ fontSize: 12, color: "var(--ink-3)", fontWeight: 600 }}>
          {fmtTime(group.total)}
        </span>
      </div>
      {showPerMachine && group.perMachine.length > 0 && (
        <div
          style={{
            display: "flex",
            gap: 6,
            flexWrap: "wrap",
            marginBottom: 6,
            paddingBottom: 6,
            fontSize: 11,
          }}
        >
          {group.perMachine.map((p) => (
            <span
              key={p.machine_no}
              className="chip"
              style={{ display: "inline-flex", alignItems: "center", gap: 4 }}
            >
              {p.machine_no === "—" ? (
                <span style={{ color: "var(--ink-4)" }}>—</span>
              ) : (
                <CodeBadge>{p.machine_no}</CodeBadge>
              )}
              <span className="mono" style={{ fontWeight: 600 }}>
                {fmtTime(p.minutes)}
              </span>
            </span>
          ))}
        </div>
      )}
      <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
        {group.rows.map((s) => (
          <SessionCard key={s.id} so_number={so_number} s={s} />
        ))}
      </div>
    </div>
  );
}

function MachineBlock({ group, so_number }: { group: MachineGroup; so_number: string }) {
  return (
    <div style={{ marginBottom: 14 }}>
      <div className="sec-h" style={{ padding: "10px 0 6px" }}>
        <h2 style={{ display: "flex", alignItems: "center", gap: 8 }}>
          {group.machine_no ? (
            <CodeBadge>{group.machine_no}</CodeBadge>
          ) : (
            <span style={{ color: "var(--ink-4)" }}>No machine</span>
          )}
          <span className="sub" style={{ textTransform: "none", letterSpacing: 0, fontSize: 11 }}>
            {group.days} day{group.days === 1 ? "" : "s"}
          </span>
        </h2>
        <span className="mono" style={{ fontSize: 12, color: "var(--ink-3)", fontWeight: 600 }}>
          {fmtTime(group.total)}
        </span>
      </div>
      <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
        {group.rows.map((s) => (
          <SessionCard key={s.id} so_number={so_number} s={s} />
        ))}
      </div>
    </div>
  );
}
