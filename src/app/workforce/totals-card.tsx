import { fmtTime } from "@/lib/format";
import type { HoursTotals } from "./queries";

export function TotalsCard({ totals }: { totals: HoursTotals }) {
  const stats = [
    { label: "Work",   value: fmtTime(totals.work) },
    { label: "Travel", value: fmtTime(totals.travel) },
    { label: "Office", value: fmtTime(totals.office) },
    { label: "Break",  value: fmtTime(totals.break) },
    { label: "Days",   value: String(totals.daysWorked) },
    { label: "Total",  value: fmtTime(totals.totalMinutes), strong: true },
  ];

  return (
    <div style={{ padding: "0 14px 12px" }}>
      <div className="card" style={{ padding: 12 }}>
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(110px, 1fr))",
            gap: 10,
            marginBottom: 10,
          }}
        >
          {stats.map((s) => (
            <Stat key={s.label} label={s.label} value={s.value} strong={s.strong} />
          ))}
        </div>
        <div
          style={{
            display: "flex",
            gap: 8,
            paddingTop: 10,
            borderTop: "1px solid var(--line-2)",
            flexWrap: "wrap",
          }}
        >
          <ApprovalCount label="Draft"     count={totals.draft}     color="var(--ink-3)"  bg="var(--surface-2)" />
          <ApprovalCount label="Submitted" count={totals.submitted} color="var(--info)"   bg="var(--info-soft)" />
          <ApprovalCount label="Approved"  count={totals.approved}  color="var(--ok)"     bg="var(--ok-soft)" />
          <ApprovalCount label="Returned"  count={totals.returned}  color="var(--danger)" bg="var(--danger-soft)" />
        </div>
      </div>
    </div>
  );
}

function Stat({ label, value, strong }: { label: string; value: string; strong?: boolean }) {
  return (
    <div>
      <div className="kicker" style={{ marginBottom: 2 }}>
        {label}
      </div>
      <div
        className="mono"
        style={{
          fontSize: strong ? 20 : 16,
          fontWeight: 700,
          color: strong ? "var(--red)" : "var(--ink)",
          letterSpacing: "-0.01em",
        }}
      >
        {value}
      </div>
    </div>
  );
}

function ApprovalCount({
  label,
  count,
  color,
  bg,
}: {
  label: string;
  count: number;
  color: string;
  bg: string;
}) {
  return (
    <span
      className="chip"
      style={{ background: bg, color, fontSize: 11, fontWeight: 600, gap: 4 }}
    >
      {label}
      <span className="mono" style={{ opacity: 0.7 }}>
        {count}
      </span>
    </span>
  );
}
