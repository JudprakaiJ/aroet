import Link from "next/link";
import { StatusPill } from "@/components/primitives/status-pill";
import { ServiceChip } from "@/components/primitives/service-chip";
import { Avatar } from "@/components/primitives/avatar";
import { CodeBadge } from "@/components/primitives/code-badge";
import { Icon } from "@/components/icons";
import { countryFlag, countryLabel } from "@/lib/country";
import { DetailActions } from "./detail-actions";
import type {
  CaseDetail,
  CaseAggregates,
  LiteCustomer,
  LiteMachine,
  LiteEngineer,
  PlanRangeEntry,
} from "./queries";

type Props = {
  c: CaseDetail;
  aggregates: CaseAggregates;
  customers: LiteCustomer[];
  allMachines: LiteMachine[];
  engineers: LiteEngineer[];
  planRanges: PlanRangeEntry[];
};

export function CaseHero({
  c,
  aggregates,
  customers,
  allMachines,
  engineers,
  planRanges,
}: Props) {
  const flag = countryFlag(c.customer_country);
  const countryName = countryLabel(c.customer_country);
  const machineCount = c.machines.length;
  const plan = summarizePlan(planRanges);

  return (
    <div className="page-px" style={{ paddingBottom: 12 }}>
      <div className="case-card-v2">
        {/* HEADER */}
        <div className="cc-header">
          <span className="cc-so">{c.so_number}</span>
          <StatusPill s={c.status} />
          {c.service_type_code && <ServiceChip typ={c.service_type_code} />}
          {c.project_code && (
            <span style={{ marginLeft: "auto" }}>
              <CodeBadge>{c.project_code}</CodeBadge>
            </span>
          )}
        </div>

        {/* CUSTOMER */}
        <div className="cc-customer">
          {flag && (
            <span
              style={{ fontSize: 22, lineHeight: 1, flex: "none" }}
              title={countryName}
              aria-label={countryName}
            >
              {flag}
            </span>
          )}
          <div style={{ flex: 1, minWidth: 0 }}>
            <div className="cc-customer-name">
              {c.customer_code ? (
                <Link
                  href={`/customers/${encodeURIComponent(c.customer_code)}`}
                  style={{ color: "inherit", textDecoration: "none" }}
                >
                  {c.customer_name ?? "—"}
                </Link>
              ) : (
                c.customer_name ?? "—"
              )}
            </div>
            {(c.customer_city || c.customer_country) && (
              <div className="cc-customer-sub">
                {[titleCase(c.customer_city ?? ""), countryName].filter(Boolean).join(" · ")}
              </div>
            )}
          </div>
        </div>

        <div className="cc-divider" />

        {/* SUBJECT */}
        <div
          className="cc-subject"
          style={{ WebkitLineClamp: 4 }}
        >
          {c.title || "Untitled"}
        </div>

        {/* MACHINES */}
        <div className="cc-section">
          <div className="cc-section-label">
            Machines <span className="cc-section-count">({machineCount})</span>
          </div>
          {machineCount === 0 ? (
            <div className="cc-empty-line">No machines attached</div>
          ) : (
            <div className="cc-machine-list">
              {c.machines.map((m) => (
                <Link
                  key={m.machine_no}
                  href={`/machines/${encodeURIComponent(m.machine_no)}`}
                  style={{ textDecoration: "none", color: "inherit" }}
                >
                  <div className="cc-machine-row">
                    <CodeBadge>{m.machine_no}</CodeBadge>
                    {m.product_code && <span className="cc-machine-type">{m.product_code}</span>}
                    <span style={{ flex: 1 }} />
                    {m.serial_no && (
                      <span className="cc-machine-sn">
                        SN <span className="mono">{m.serial_no}</span>
                      </span>
                    )}
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>

        {/* PLAN + HOURS */}
        <div className="cc-meta-grid">
          <div className="cc-meta">
            <div className="cc-meta-label">
              <Icon name="calendar" size={11} /> Planned
            </div>
            <div className="cc-meta-value">
              {plan.lines.length > 0 ? (
                plan.lines.map((line, i) => (
                  <span key={i} className="cc-meta-line">
                    {line}
                  </span>
                ))
              ) : (
                <span className="cc-meta-line cc-empty-inline">Not planned</span>
              )}
              {plan.dayCount > 0 && (
                <span className="cc-meta-line cc-meta-sub">
                  {plan.dayCount} day{plan.dayCount === 1 ? "" : "s"}
                  {plan.engineers.length > 0 && ` · ${plan.engineers.join(", ")}`}
                </span>
              )}
            </div>
          </div>
          <div className="cc-meta">
            <div className="cc-meta-label">
              <Icon name="clock" size={11} /> Hours
            </div>
            <div className="cc-meta-value">
              <span className="cc-meta-line mono">
                {aggregates.hours_logged > 0 ? `${aggregates.hours_logged}h` : "—"}
              </span>
              <span className="cc-meta-line cc-meta-sub">
                {aggregates.sessions_count} session{aggregates.sessions_count === 1 ? "" : "s"}
              </span>
            </div>
          </div>
        </div>

        <div className="cc-divider" />

        {/* TEAM */}
        {c.assignees.length > 0 ? (
          <div className="cc-team">
            <span className="kicker">Team</span>
            <div style={{ display: "flex", gap: 4, flexWrap: "wrap" }}>
              {c.assignees.map((a) => (
                <span
                  key={a.engineer_code}
                  style={{ position: "relative", display: "inline-flex" }}
                  title={a.is_lead ? `${a.engineer_code} (lead)` : a.engineer_code}
                >
                  <Avatar code={a.engineer_code} />
                  {a.is_lead && <span className="cc-lead-star">★</span>}
                </span>
              ))}
            </div>
          </div>
        ) : (
          <div className="cc-team">
            <span className="kicker">Team</span>
            <span className="cc-empty-inline">Not assigned</span>
          </div>
        )}
      </div>

      {/* ACTIONS (outside the info card) */}
      <div style={{ marginTop: 12 }}>
        <DetailActions
          c={c}
          customers={customers}
          allMachines={allMachines}
          engineers={engineers}
          planRanges={planRanges}
          sessionsCount={aggregates.sessions_count}
        />
      </div>
    </div>
  );
}

function titleCase(s: string): string {
  return s.toLowerCase().replace(/\b\w/g, (c) => c.toUpperCase());
}

function summarizePlan(
  ranges: PlanRangeEntry[]
): { lines: string[]; dayCount: number; engineers: string[] } {
  if (ranges.length === 0) return { lines: [], dayCount: 0, engineers: [] };
  const lines = ranges.map(formatRange);
  let dayCount = 0;
  for (const r of ranges) {
    dayCount += daysBetween(r.date_from, r.date_to);
  }
  const engineers = Array.from(new Set(ranges.map((r) => r.engineer_code)));
  return { lines, dayCount, engineers };
}

function formatRange(r: PlanRangeEntry): string {
  const from = new Date(r.date_from + "T00:00:00Z");
  const to = new Date(r.date_to + "T00:00:00Z");
  const fDay = from.getUTCDate();
  const tDay = to.getUTCDate();
  const fMonth = from.toLocaleDateString("en-GB", { month: "short", timeZone: "UTC" });
  const tMonth = to.toLocaleDateString("en-GB", { month: "short", timeZone: "UTC" });
  if (r.date_from === r.date_to) return `${fDay} ${fMonth}`;
  if (fMonth === tMonth) return `${fDay}–${tDay} ${fMonth}`;
  return `${fDay} ${fMonth} – ${tDay} ${tMonth}`;
}

function daysBetween(from: string, to: string): number {
  const fd = new Date(from + "T00:00:00Z");
  const td = new Date(to + "T00:00:00Z");
  return Math.max(1, Math.round((td.getTime() - fd.getTime()) / (24 * 60 * 60 * 1000)) + 1);
}
