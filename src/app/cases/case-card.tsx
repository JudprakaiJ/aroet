import Link from "next/link";
import { Avatar } from "@/components/primitives/avatar";
import { StatusPill } from "@/components/primitives/status-pill";
import { ServiceChip } from "@/components/primitives/service-chip";
import { CodeBadge } from "@/components/primitives/code-badge";
import { Icon } from "@/components/icons";
import { countryFlag, countryLabel } from "@/lib/country";
import type { CaseListItem } from "./queries";

export function CaseCard({ c }: { c: CaseListItem }) {
  const flag = countryFlag(c.customer_country);
  const countryName = countryLabel(c.customer_country);
  const machineCount = c.machines.length;
  const plannedSummary = summarizePlannedDates(c.planned_dates);
  return (
    <Link
      href={`/cases/${c.so_number}`}
      style={{ textDecoration: "none", color: "inherit", display: "block" }}
    >
      <div className="case-card-v2">
        {/* HEADER — SO + status + service + project */}
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

        {/* CUSTOMER — flag + name + city */}
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
            <div className="cc-customer-name">{c.customer_name ?? "—"}</div>
            {(c.customer_city || c.customer_country) && (
              <div className="cc-customer-sub">
                {[titleCase(c.customer_city ?? ""), countryName]
                  .filter(Boolean)
                  .join(" · ")}
              </div>
            )}
          </div>
        </div>

        <div className="cc-divider" />

        {/* SUBJECT */}
        <div className="cc-subject">{c.title || "Untitled"}</div>

        {/* MACHINES — proper list with serial numbers */}
        <div className="cc-section">
          <div className="cc-section-label">
            Machines <span className="cc-section-count">({machineCount})</span>
          </div>
          {machineCount === 0 ? (
            <div className="cc-empty-line">No machines attached</div>
          ) : (
            <div className="cc-machine-list">
              {c.machines.map((m) => (
                <div key={m.machine_no} className="cc-machine-row">
                  <CodeBadge>{m.machine_no}</CodeBadge>
                  {m.product_code && (
                    <span className="cc-machine-type">{m.product_code}</span>
                  )}
                  <span style={{ flex: 1 }} />
                  {m.serial_no && (
                    <span className="cc-machine-sn" title={`Serial ${m.serial_no}`}>
                      SN <span className="mono">{m.serial_no}</span>
                    </span>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* PLANNED + HOURS */}
        <div className="cc-meta-grid">
          <div className="cc-meta">
            <div className="cc-meta-label">
              <Icon name="calendar" size={11} /> Planned
            </div>
            <div className="cc-meta-value">
              {plannedSummary.lines.length > 0
                ? plannedSummary.lines.map((line, i) => (
                    <span key={i} className="cc-meta-line">
                      {line}
                    </span>
                  ))
                : <span className="cc-meta-line cc-empty-inline">Not planned</span>}
            </div>
          </div>
          <div className="cc-meta">
            <div className="cc-meta-label">
              <Icon name="clock" size={11} /> Hours
            </div>
            <div className="cc-meta-value">
              <span className="cc-meta-line mono">
                {c.hours_logged > 0 ? `${c.hours_logged}h` : "—"}
              </span>
              {plannedSummary.dayCount > 0 && (
                <span className="cc-meta-line cc-meta-sub">
                  over {plannedSummary.dayCount} day{plannedSummary.dayCount === 1 ? "" : "s"}
                </span>
              )}
            </div>
          </div>
        </div>

        <div className="cc-divider" />

        {/* TEAM */}
        <div className="cc-team">
          <span className="kicker">Team</span>
          {c.assignees.length === 0 ? (
            <span className="cc-empty-inline">Not assigned</span>
          ) : (
            <div style={{ display: "flex", gap: 4, flexWrap: "wrap" }}>
              {c.assignees.slice(0, 5).map((a) => (
                <span
                  key={a}
                  style={{ position: "relative", display: "inline-flex" }}
                  title={a === c.lead ? `${a} (lead)` : a}
                >
                  <Avatar code={a} />
                  {a === c.lead && (
                    <span className="cc-lead-star">★</span>
                  )}
                </span>
              ))}
              {c.assignees.length > 5 && (
                <span className="chip chip-slate" style={{ alignSelf: "center" }}>
                  +{c.assignees.length - 5}
                </span>
              )}
            </div>
          )}
        </div>
      </div>
    </Link>
  );
}

function titleCase(s: string): string {
  return s.toLowerCase().replace(/\b\w/g, (c) => c.toUpperCase());
}

/**
 * Collapse a list of YYYY-MM-DD dates into contiguous-run "lines":
 *   ["2025-05-19","2025-05-20","2025-05-21","2025-05-24","2025-05-25"]
 *   → ["19–21 May", "24–25 May"]
 * Holidays / gaps in the middle stay as separate ranges, not merged.
 */
function summarizePlannedDates(dates: string[]): {
  lines: string[];
  dayCount: number;
} {
  if (dates.length === 0) return { lines: [], dayCount: 0 };
  const sorted = Array.from(new Set(dates)).sort();
  const runs: string[][] = [];
  let current: string[] = [sorted[0]];
  for (let i = 1; i < sorted.length; i++) {
    const prev = new Date(current[current.length - 1] + "T00:00:00Z");
    const next = new Date(sorted[i] + "T00:00:00Z");
    const oneDay = 24 * 60 * 60 * 1000;
    if (next.getTime() - prev.getTime() === oneDay) {
      current.push(sorted[i]);
    } else {
      runs.push(current);
      current = [sorted[i]];
    }
  }
  runs.push(current);
  return {
    lines: runs.map(formatRun),
    dayCount: sorted.length,
  };
}

function formatRun(run: string[]): string {
  const first = new Date(run[0] + "T00:00:00Z");
  const last = new Date(run[run.length - 1] + "T00:00:00Z");
  const fDay = first.getUTCDate();
  const lDay = last.getUTCDate();
  const fMonth = first.toLocaleDateString("en-GB", { month: "short", timeZone: "UTC" });
  const lMonth = last.toLocaleDateString("en-GB", { month: "short", timeZone: "UTC" });
  if (run.length === 1) {
    return `${fDay} ${fMonth}`;
  }
  if (fMonth === lMonth) {
    return `${fDay}–${lDay} ${fMonth}`;
  }
  return `${fDay} ${fMonth} – ${lDay} ${lMonth}`;
}
