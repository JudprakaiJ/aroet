"use client";

import { useCallback, useTransition } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Icon } from "@/components/icons";
import type { PayPeriodPreset } from "@/lib/pay-period";

const PRESETS: { id: PayPeriodPreset; label: string }[] = [
  { id: "month", label: "Full month" },
  { id: "h1_1_15", label: "1–15" },
  { id: "h2_16_end", label: "16–end" },
  { id: "h1_1_20", label: "1–20" },
  { id: "h2_21_end", label: "21–end" },
];

type Props = {
  preset: PayPeriodPreset;
  year: number;
  month: number;
  engineer: string;
  engineers: { code: string; full_name: string | null }[];
  canPickEngineer: boolean;
  periodLabel: string;
};

export function PeriodPicker({
  preset,
  year,
  month,
  engineer,
  engineers,
  canPickEngineer,
  periodLabel,
}: Props) {
  const router = useRouter();
  const params = useSearchParams();
  const [pending, startTransition] = useTransition();

  const push = useCallback(
    (next: Record<string, string | null>) => {
      const sp = new URLSearchParams(params?.toString() ?? "");
      for (const [k, v] of Object.entries(next)) {
        if (v === null || v === "") sp.delete(k);
        else sp.set(k, v);
      }
      const str = sp.toString();
      startTransition(() => {
        router.replace(str ? `/workforce?${str}` : "/workforce");
      });
    },
    [params, router]
  );

  const navMonth = (delta: number) => {
    let y = year;
    let m = month + delta;
    if (m < 1) {
      m = 12;
      y--;
    } else if (m > 12) {
      m = 1;
      y++;
    }
    push({ year: String(y), month: String(m) });
  };

  return (
    <div
      style={{
        display: "flex",
        gap: 10,
        alignItems: "center",
        flexWrap: "wrap",
        padding: "0 14px 8px",
      }}
    >
      <div style={{ display: "flex", gap: 4, alignItems: "center" }}>
        <button
          type="button"
          className="iconbtn tap"
          onClick={() => navMonth(-1)}
          disabled={pending}
          aria-label="Previous month"
        >
          <Icon name="back" size={14} />
        </button>
        <span style={{ fontSize: 13, fontWeight: 600, color: "var(--ink)", minWidth: 130, textAlign: "center" }}>
          {periodLabel}
        </span>
        <button
          type="button"
          className="iconbtn tap"
          onClick={() => navMonth(1)}
          disabled={pending}
          aria-label="Next month"
        >
          <Icon name="chevron" size={14} />
        </button>
      </div>

      <div style={{ display: "flex", gap: 4, flexWrap: "wrap" }}>
        {PRESETS.map((p) => (
          <button
            key={p.id}
            type="button"
            className="fchip"
            data-on={preset === p.id || undefined}
            onClick={() => push({ preset: p.id === "h2_21_end" ? null : p.id })}
            disabled={pending}
          >
            {p.label}
          </button>
        ))}
      </div>

      {canPickEngineer && (
        <div style={{ marginLeft: "auto", display: "flex", gap: 6, alignItems: "center" }}>
          <span className="kicker">Engineer</span>
          <select
            className="field"
            value={engineer}
            onChange={(e) => push({ engineer: e.target.value === "JKH" ? null : e.target.value })}
            disabled={pending}
            style={{ minWidth: 160, padding: "4px 8px" }}
          >
            {engineers.map((e) => (
              <option key={e.code} value={e.code}>
                {e.code}
                {e.full_name ? ` — ${e.full_name}` : ""}
              </option>
            ))}
          </select>
        </div>
      )}
    </div>
  );
}
