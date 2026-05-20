import { fmtDay, fmtTime } from "@/lib/format";
import { SessionCard } from "./session-card";
import type { CaseSession } from "./queries";

function groupByDate(sessions: CaseSession[]): { date: string; total: number; rows: CaseSession[] }[] {
  const map = new Map<string, CaseSession[]>();
  for (const s of sessions) {
    const key = s.session_date ?? "unknown";
    if (!map.has(key)) map.set(key, []);
    map.get(key)!.push(s);
  }
  return Array.from(map.entries()).map(([date, rows]) => ({
    date,
    rows,
    total: rows.reduce(
      (a, r) => a + (r.travel_minutes ?? 0) + (r.work_minutes ?? 0) + (r.office_minutes ?? 0),
      0
    ),
  }));
}

export function SessionsTab({ so_number, sessions }: { so_number: string; sessions: CaseSession[] }) {
  if (sessions.length === 0) {
    return (
      <div className="card" style={{ margin: "8px 14px", padding: 18, textAlign: "center" }}>
        <div
          className="sub"
          style={{ textTransform: "none", letterSpacing: 0, fontSize: 13, color: "var(--ink-3)" }}
        >
          No sessions logged yet. Tap <span style={{ color: "var(--red)", fontWeight: 600 }}>Add session</span> above.
        </div>
      </div>
    );
  }
  const groups = groupByDate(sessions);
  return (
    <div style={{ padding: "0 14px 24px" }}>
      {groups.map((g) => (
        <div key={g.date} style={{ marginBottom: 14 }}>
          <div
            className="sec-h"
            style={{ padding: "10px 0 6px" }}
          >
            <h2>{fmtDay(g.date)}</h2>
            <span
              className="mono"
              style={{ fontSize: 12, color: "var(--ink-3)", fontWeight: 600 }}
            >
              {fmtTime(g.total)}
            </span>
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
            {g.rows.map((s) => (
              <SessionCard key={s.id} so_number={so_number} s={s} />
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
