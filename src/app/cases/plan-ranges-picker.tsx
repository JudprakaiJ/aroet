"use client";

import { useState } from "react";
import { Icon } from "@/components/icons";
import { Avatar } from "@/components/primitives/avatar";
import type { LiteEngineer, PlanRangeEntry } from "./[so_number]/queries";

const SO_TYPES = [
  { code: "T", label: "Field" },
  { code: "V", label: "Field+VAT" },
  { code: "A", label: "Admin" },
];

type Props = {
  /** Engineers eligible to plan for. Usually the case's assigned engineers. */
  engineerCodes: string[];
  engineers: LiteEngineer[];
  value: PlanRangeEntry[];
  onChange: (next: PlanRangeEntry[]) => void;
};

/**
 * Multi-range plan editor. Each row = {engineer, from, to, type}. Days off /
 * holidays are handled by adding multiple rows. Saving expands each range
 * to per-day planning sessions in the action.
 */
export function PlanRangesPicker({ engineerCodes, engineers, value, onChange }: Props) {
  const engineerMap = new Map(engineers.map((e) => [e.code, e.full_name ?? e.code]));
  const optionCodes = engineerCodes.length > 0 ? engineerCodes : engineers.map((e) => e.code);

  const addRange = () => {
    const today = bangkokToday();
    const defaultEngineer = optionCodes[0] ?? engineers[0]?.code ?? "";
    onChange([
      ...value,
      { engineer_code: defaultEngineer, date_from: today, date_to: today, type_code: "T" },
    ]);
  };

  const updateRange = (i: number, patch: Partial<PlanRangeEntry>) => {
    onChange(
      value.map((r, idx) => {
        if (idx !== i) return r;
        const merged = { ...r, ...patch };
        // Keep from ≤ to. If user pushes "from" past "to", bump "to".
        if (merged.date_from > merged.date_to) merged.date_to = merged.date_from;
        return merged;
      })
    );
  };

  const removeRange = (i: number) => {
    onChange(value.filter((_, idx) => idx !== i));
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
      {value.length === 0 && (
        <div
          style={{
            padding: 10,
            background: "var(--surface-2)",
            borderRadius: 8,
            fontSize: 12,
            color: "var(--ink-3)",
            textAlign: "center",
          }}
        >
          No plan dates yet. Add a range to schedule the engineer.
        </div>
      )}

      {value.map((r, i) => {
        const days = daysBetween(r.date_from, r.date_to);
        const engineerName = engineerMap.get(r.engineer_code) ?? r.engineer_code;
        return (
          <div
            key={i}
            className="card-flat"
            style={{ padding: 10, display: "flex", flexDirection: "column", gap: 8 }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <Avatar code={r.engineer_code} />
              <select
                className="field"
                style={{ flex: 1, minHeight: 36, fontSize: 13 }}
                value={r.engineer_code}
                onChange={(e) => updateRange(i, { engineer_code: e.target.value })}
              >
                {optionCodes.map((code) => (
                  <option key={code} value={code}>
                    {code} · {engineerMap.get(code) ?? code}
                  </option>
                ))}
                {/* Show current engineer even if not in optionCodes (eg. removed from team) */}
                {!optionCodes.includes(r.engineer_code) && (
                  <option value={r.engineer_code}>
                    {r.engineer_code} · {engineerName}
                  </option>
                )}
              </select>
              <button
                type="button"
                className="iconbtn iconbtn-sm"
                onClick={() => removeRange(i)}
                aria-label="Remove range"
                title="Remove"
              >
                <Icon name="x" size={14} />
              </button>
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 6 }}>
              <div>
                <label
                  style={{
                    display: "block",
                    fontSize: 10,
                    fontWeight: 600,
                    color: "var(--ink-3)",
                    marginBottom: 3,
                    textTransform: "uppercase",
                    letterSpacing: ".05em",
                  }}
                >
                  From
                </label>
                <input
                  type="date"
                  className="field"
                  style={{ minHeight: 36, fontSize: 13 }}
                  value={r.date_from}
                  onChange={(e) => updateRange(i, { date_from: e.target.value })}
                />
              </div>
              <div>
                <label
                  style={{
                    display: "block",
                    fontSize: 10,
                    fontWeight: 600,
                    color: "var(--ink-3)",
                    marginBottom: 3,
                    textTransform: "uppercase",
                    letterSpacing: ".05em",
                  }}
                >
                  To
                </label>
                <input
                  type="date"
                  className="field"
                  style={{ minHeight: 36, fontSize: 13 }}
                  value={r.date_to}
                  onChange={(e) => updateRange(i, { date_to: e.target.value })}
                />
              </div>
            </div>

            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: 6,
                flexWrap: "wrap",
              }}
            >
              {SO_TYPES.map((t) => (
                <button
                  key={t.code}
                  type="button"
                  className="fchip"
                  data-on={r.type_code === t.code || undefined}
                  onClick={() => updateRange(i, { type_code: t.code })}
                >
                  <span className="mono" style={{ fontWeight: 700 }}>
                    {t.code}
                  </span>
                  <span className="cnt">{t.label}</span>
                </button>
              ))}
              <span
                style={{
                  marginLeft: "auto",
                  fontSize: 11,
                  color: "var(--ink-3)",
                  fontWeight: 500,
                }}
              >
                {days} day{days === 1 ? "" : "s"}
              </span>
            </div>
          </div>
        );
      })}

      <button
        type="button"
        className="btn btn-secondary btn-sm"
        onClick={addRange}
        disabled={optionCodes.length === 0}
        style={{ alignSelf: "flex-start" }}
      >
        <Icon name="plus" size={12} /> Add range
      </button>
      {optionCodes.length === 0 && (
        <div style={{ fontSize: 11, color: "var(--ink-3)" }}>
          Assign at least one engineer first.
        </div>
      )}
    </div>
  );
}

function bangkokToday(): string {
  return new Date().toLocaleDateString("en-CA", { timeZone: "Asia/Bangkok" });
}

function daysBetween(from: string, to: string): number {
  const fd = new Date(from + "T00:00:00Z");
  const td = new Date(to + "T00:00:00Z");
  const diff = Math.round((td.getTime() - fd.getTime()) / (24 * 60 * 60 * 1000));
  return Math.max(1, diff + 1);
}
