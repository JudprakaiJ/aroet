import Link from "next/link";
import { Avatar } from "@/components/primitives/avatar";
import { StatusPill } from "@/components/primitives/status-pill";
import { ServiceChip } from "@/components/primitives/service-chip";
import { TypeBlock } from "@/components/primitives/type-block";
import { Icon } from "@/components/icons";
import { fmtTime } from "@/lib/format";
import type {
  ApprovalTeaserRow,
  DashboardKpis,
  RecentCaseRow,
} from "@/app/dashboard/queries";

type Props = {
  kpis: DashboardKpis;
  approvals: ApprovalTeaserRow[];
  recent: RecentCaseRow[];
};

export function DesktopDashboard({ kpis, approvals, recent }: Props) {
  return (
    <div>
      <div className="kpi-grid">
        <KpiCard
          accent
          label="Pending approvals"
          value={kpis.pending_approvals}
          delta={
            kpis.pending_approvals > 0
              ? { tone: "down", text: "Review needed" }
              : { tone: "neutral", text: "All clear" }
          }
        />
        <KpiCard
          label="Open cases"
          value={kpis.open_cases}
          delta={{
            tone: "neutral",
            text: `${kpis.in_progress_cases} in progress`,
          }}
        />
        <KpiCard
          label="Hours · week"
          value={`${kpis.hours_this_week.toFixed(1)}h`}
          delta={{ tone: "up", text: "Mon → today" }}
        />
        <KpiCard
          label="Sessions today"
          value={kpis.sessions_today}
          delta={{ tone: "neutral", text: "Across team" }}
        />
      </div>

      <div className="dt-cols">
        <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
          <div className="dt-panel">
            <div className="dt-panel-h">
              <h3>Approval queue · top {Math.min(5, approvals.length)}</h3>
              <Link href="/workforce/queue" className="dt-pill ghost">
                Open queue →
              </Link>
            </div>
            {approvals.length === 0 ? (
              <div style={{ padding: 18, fontSize: 12, color: "var(--ink-3)", textAlign: "center" }}>
                No sessions awaiting approval.
              </div>
            ) : (
              <table className="dt-table">
                <thead>
                  <tr>
                    <th>Engineer</th>
                    <th>Date</th>
                    <th>Case</th>
                    <th>Type</th>
                    <th className="num">Hours</th>
                  </tr>
                </thead>
                <tbody>
                  {approvals.map((s) => (
                    <tr key={s.id}>
                      <td>
                        <Avatar code={s.engineer_code} />
                      </td>
                      <td className="mono">{s.session_date ?? "—"}</td>
                      <td>
                        {s.so_number ? (
                          <Link href={`/cases/${s.so_number}`} className="mono" style={{ color: "var(--ink)", textDecoration: "none" }}>
                            {s.so_number}
                          </Link>
                        ) : (
                          <span style={{ color: "var(--ink-3)", fontStyle: "italic" }}>leave</span>
                        )}
                      </td>
                      <td>
                        <TypeBlock t={s.type_code ?? "T"} />
                      </td>
                      <td className="num">
                        <span className="mono">{fmtTime(s.total_minutes)}</span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>

          <div className="dt-panel">
            <div className="dt-panel-h">
              <h3>Recent cases</h3>
              <Link href="/cases" className="dt-pill ghost">
                All cases →
              </Link>
            </div>
            {recent.length === 0 ? (
              <div style={{ padding: 18, fontSize: 12, color: "var(--ink-3)", textAlign: "center" }}>
                No cases yet.
              </div>
            ) : (
              <table className="dt-table">
                <thead>
                  <tr>
                    <th>SO</th>
                    <th>Title</th>
                    <th>Customer</th>
                    <th>Service</th>
                    <th>Status</th>
                    <th>Lead</th>
                    <th className="num">Hours</th>
                  </tr>
                </thead>
                <tbody>
                  {recent.map((c) => (
                    <tr key={c.so_number}>
                      <td className="mono">
                        <Link href={`/cases/${c.so_number}`} style={{ color: "var(--ink)", textDecoration: "none" }}>
                          {c.so_number}
                        </Link>
                      </td>
                      <td className="truncate" style={{ color: "var(--ink)", fontWeight: 500 }}>
                        {c.title ?? "Untitled"}
                      </td>
                      <td className="truncate" style={{ maxWidth: 140 }}>
                        {c.customer_name ?? "—"}
                      </td>
                      <td>
                        {c.service_type_code && <ServiceChip typ={c.service_type_code} />}
                      </td>
                      <td>
                        <StatusPill s={c.status} />
                      </td>
                      <td>{c.lead ? <Avatar code={c.lead} /> : <span style={{ color: "var(--ink-4)" }}>—</span>}</td>
                      <td className="num">{c.hours_logged > 0 ? `${c.hours_logged}h` : "—"}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
          <div className="dt-panel">
            <div className="dt-panel-h">
              <h3>Activity feed</h3>
              <span className="meta">Live feed lands Phase 3</span>
            </div>
            <div style={{ padding: 22, textAlign: "center", color: "var(--ink-3)" }}>
              <div
                style={{
                  display: "inline-flex",
                  width: 40,
                  height: 40,
                  borderRadius: 10,
                  background: "var(--surface-2)",
                  alignItems: "center",
                  justifyContent: "center",
                  marginBottom: 8,
                }}
              >
                <Icon name="history" size={18} />
              </div>
              <div style={{ fontSize: 12, fontWeight: 500 }}>
                Will stream from session_approval_log + cases.updated_at
              </div>
            </div>
          </div>

          <div className="dt-panel">
            <div className="dt-panel-h">
              <h3>Plan · this week</h3>
              <Link href="/planning" className="dt-pill ghost">
                Full grid →
              </Link>
            </div>
            <div style={{ padding: 22, textAlign: "center", color: "var(--ink-3)" }}>
              <div
                style={{
                  display: "inline-flex",
                  width: 40,
                  height: 40,
                  borderRadius: 10,
                  background: "var(--surface-2)",
                  alignItems: "center",
                  justifyContent: "center",
                  marginBottom: 8,
                }}
              >
                <Icon name="calendar" size={18} />
              </div>
              <div style={{ fontSize: 12, fontWeight: 500 }}>
                Plan grid lands in Phase 2c
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function KpiCard({
  label,
  value,
  delta,
  accent,
}: {
  label: string;
  value: number | string;
  delta?: { tone: "up" | "down" | "neutral"; text: string };
  accent?: boolean;
}) {
  return (
    <div className={`kpi-card${accent ? " accent" : ""}`}>
      <div className="label">{label}</div>
      <div className="num" style={accent ? { color: "var(--red)" } : undefined}>
        {value}
      </div>
      {delta && (
        <div className={`delta ${delta.tone}`}>
          {delta.tone === "up" && <Icon name="trending-up" size={11} />}
          {delta.tone === "down" && <Icon name="alert" size={11} />}
          {delta.text}
        </div>
      )}
    </div>
  );
}
