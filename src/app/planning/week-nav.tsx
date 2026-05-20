"use client";

import { useCallback, useTransition } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Icon } from "@/components/icons";

type Props = {
  from: string;
  weeks: number;
  rangeLabel: string;
};

const WEEK_OPTIONS = [1, 2, 4];

export function WeekNav({ from, weeks, rangeLabel }: Props) {
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
        router.replace(str ? `/planning?${str}` : "/planning");
      });
    },
    [params, router]
  );

  const shiftWeeks = (deltaWeeks: number) => {
    const d = new Date(from);
    d.setDate(d.getDate() + deltaWeeks * 7);
    push({ from: d.toISOString().slice(0, 10) });
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
          onClick={() => shiftWeeks(-1)}
          disabled={pending}
          aria-label="Previous week"
        >
          <Icon name="back" size={14} />
        </button>
        <span style={{ fontSize: 13, fontWeight: 600, color: "var(--ink)", minWidth: 180, textAlign: "center" }}>
          {rangeLabel}
        </span>
        <button
          type="button"
          className="iconbtn tap"
          onClick={() => shiftWeeks(1)}
          disabled={pending}
          aria-label="Next week"
        >
          <Icon name="chevron" size={14} />
        </button>
      </div>

      <div style={{ display: "flex", gap: 4 }}>
        {WEEK_OPTIONS.map((w) => (
          <button
            key={w}
            type="button"
            className="fchip"
            data-on={weeks === w || undefined}
            onClick={() => push({ weeks: w === 1 ? null : String(w) })}
            disabled={pending}
          >
            {w}w
          </button>
        ))}
      </div>

      <button
        type="button"
        className="fchip"
        onClick={() => push({ from: null, weeks: null })}
        disabled={pending}
        style={{ marginLeft: "auto" }}
      >
        <Icon name="refresh" size={11} /> This week
      </button>
    </div>
  );
}
