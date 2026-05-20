import Link from "next/link";
import { TypeBlock } from "@/components/primitives/type-block";
import { Avatar } from "@/components/primitives/avatar";
import type { PlanEngineer, PlanSession, PlanCaseInfo } from "./queries";

type Props = {
  engineers: PlanEngineer[];
  days: string[];
  sessions: PlanSession[];
  caseInfo: PlanCaseInfo[];
};

function dayShort(iso: string): { dow: string; day: number; isWeekend: boolean; isMonday: boolean } {
  const d = new Date(iso);
  const day = d.getDay();
  return {
    dow: ["S", "M", "T", "W", "T", "F", "S"][day],
    day: d.getDate(),
    isWeekend: day === 0 || day === 6,
    isMonday: day === 1,
  };
}

export function PlanGrid({ engineers, days, sessions, caseInfo }: Props) {
  const caseMap = new Map<string, PlanCaseInfo>();
  for (const c of caseInfo) caseMap.set(c.so_number, c);

  // index sessions by engineer:date -> first session that day
  const cellMap = new Map<string, PlanSession>();
  for (const s of sessions) {
    const key = `${s.engineer_code}|${s.session_date}`;
    if (!cellMap.has(key)) cellMap.set(key, s);
  }

  if (engineers.length === 0) {
    return (
      <div style={{ padding: "24px 14px", textAlign: "center", color: "var(--ink-3)" }}>
        No active engineers.
      </div>
    );
  }

  return (
    <div style={{ padding: "0 14px 14px" }}>
      <div className="card" style={{ overflow: "hidden" }}>
        <div style={{ overflow: "auto", maxHeight: "calc(100vh - 320px)" }}>
          <table
            className="dt-table"
            style={{ minWidth: 700, tableLayout: "fixed", borderCollapse: "separate", borderSpacing: 0 }}
          >
            <thead>
              <tr>
                <th
                  style={{
                    position: "sticky",
                    left: 0,
                    background: "var(--surface-2)",
                    zIndex: 2,
                    width: 110,
                    minWidth: 110,
                  }}
                >
                  Engineer
                </th>
                {days.map((d) => {
                  const s = dayShort(d);
                  return (
                    <th
                      key={d}
                      style={{
                        width: 64,
                        minWidth: 64,
                        textAlign: "center",
                        background: s.isWeekend ? "var(--wknd-bg)" : undefined,
                        color: s.isWeekend ? "var(--wknd-fg)" : undefined,
                        borderLeft: s.isMonday ? "2px solid var(--ink-4)" : undefined,
                      }}
                    >
                      <div style={{ fontSize: 10, opacity: 0.7 }}>{s.dow}</div>
                      <div className="mono" style={{ fontSize: 12, fontWeight: 700 }}>
                        {s.day}
                      </div>
                    </th>
                  );
                })}
              </tr>
            </thead>
            <tbody>
              {engineers.map((eng) => (
                <tr key={eng.code}>
                  <td
                    style={{
                      position: "sticky",
                      left: 0,
                      background: "var(--surface)",
                      zIndex: 1,
                      width: 110,
                      minWidth: 110,
                    }}
                  >
                    <div style={{ display: "flex", gap: 6, alignItems: "center" }}>
                      <Avatar code={eng.code} />
                      <div style={{ minWidth: 0 }}>
                        <div className="mono" style={{ fontSize: 11.5, fontWeight: 600, color: "var(--ink)" }}>
                          {eng.code}
                        </div>
                        <div
                          className="truncate"
                          style={{ fontSize: 10, color: "var(--ink-4)", maxWidth: 70 }}
                        >
                          {eng.role ?? "engineer"}
                        </div>
                      </div>
                    </div>
                  </td>
                  {days.map((d) => {
                    const ds = dayShort(d);
                    const s = cellMap.get(`${eng.code}|${d}`);
                    return (
                      <Cell key={d} session={s} caseInfo={s?.so_number ? caseMap.get(s.so_number) : null} isWeekend={ds.isWeekend} isMonday={ds.isMonday} />
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <Legend />
      </div>
    </div>
  );
}

function Cell({
  session,
  caseInfo,
  isWeekend,
  isMonday,
}: {
  session: PlanSession | undefined;
  caseInfo: PlanCaseInfo | null | undefined;
  isWeekend: boolean;
  isMonday: boolean;
}) {
  const tdStyle = {
    padding: 4,
    width: 64,
    minWidth: 64,
    height: 56,
    background: isWeekend ? "var(--wknd-bg)" : undefined,
    borderLeft: isMonday ? "2px solid var(--ink-4)" : undefined,
    verticalAlign: "top" as const,
  };

  if (!session) {
    return <td style={tdStyle} />;
  }

  const t = session.type_code ?? "T";

  return (
    <td style={tdStyle}>
      {session.so_number ? (
        <Link
          href={`/cases/${encodeURIComponent(session.so_number)}`}
          style={{
            display: "block",
            textDecoration: "none",
            color: "inherit",
            height: "100%",
          }}
          title={caseInfo?.title ?? session.so_number}
        >
          <CellContent t={t} so={session.so_number} caseInfo={caseInfo} />
        </Link>
      ) : (
        <CellContent t={t} so={null} caseInfo={null} />
      )}
    </td>
  );
}

function CellContent({
  t,
  so,
  caseInfo,
}: {
  t: string;
  so: string | null;
  caseInfo: PlanCaseInfo | null | undefined;
}) {
  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        gap: 2,
        justifyContent: "center",
        minHeight: 48,
      }}
    >
      <TypeBlock t={t} />
      {so && (
        <div
          className="mono truncate"
          style={{ fontSize: 9.5, color: "var(--ink-4)", maxWidth: 56 }}
        >
          {caseInfo?.project_code ?? so}
        </div>
      )}
    </div>
  );
}

function Legend() {
  const items = ["T", "V", "A", "WFH", "OFF", "PERS", "AL", "SICK"];
  return (
    <div
      style={{
        padding: "8px 14px",
        display: "flex",
        gap: 8,
        flexWrap: "wrap",
        alignItems: "center",
        borderTop: "1px solid var(--line-2)",
        fontSize: 11,
        color: "var(--ink-3)",
        background: "var(--surface-2)",
      }}
    >
      <span className="kicker">Legend</span>
      {items.map((t) => (
        <TypeBlock key={t} t={t} />
      ))}
    </div>
  );
}
