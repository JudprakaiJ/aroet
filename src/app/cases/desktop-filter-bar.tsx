"use client";

import { useCallback, useTransition } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { Icon } from "@/components/icons";
import { SERVICE_TYPES } from "@/lib/service-types";

type Scope = "mine" | "team" | "all";
type Status = "open" | "verified" | "all";

type Props = {
  years: string[];
  initial: {
    scope: Scope;
    status: Status;
    year: string | null;
    type: string | null;
  };
};

const STATUSES: { id: Status; label: string }[] = [
  { id: "open", label: "Open" },
  { id: "verified", label: "Verified" },
  { id: "all", label: "All" },
];

const SCOPES: { id: Scope; label: string }[] = [
  { id: "mine", label: "Mine" },
  { id: "team", label: "Team" },
  { id: "all", label: "All team" },
];

export function DesktopFilterBar({ years, initial }: Props) {
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
        router.replace(str ? `/cases?${str}` : "/cases");
      });
    },
    [params, router]
  );

  return (
    <>
      <div className="dt-filters">
        <span className="lbl">Status</span>
        {STATUSES.map((s) => (
          <button
            key={s.id}
            type="button"
            className="fchip"
            data-on={initial.status === s.id || undefined}
            onClick={() => push({ status: s.id === "open" ? null : s.id })}
            disabled={pending}
          >
            {s.label}
          </button>
        ))}

        <span className="lbl" style={{ marginLeft: 14 }}>
          Year
        </span>
        {["all", ...years.slice(0, 5)].map((y) => (
          <button
            key={y}
            type="button"
            className="fchip"
            data-on={(initial.year ?? "all") === y || undefined}
            onClick={() => push({ year: y === "all" ? null : y })}
            disabled={pending}
          >
            {y === "all" ? "All" : y}
          </button>
        ))}

        <span className="lbl" style={{ marginLeft: 14 }}>
          Type
        </span>
        {SERVICE_TYPES.slice(0, 5).map((t) => (
          <button
            key={t.code}
            type="button"
            className="fchip"
            data-on={initial.type === t.code || undefined}
            onClick={() => push({ type: initial.type === t.code ? null : t.code })}
            disabled={pending}
          >
            {t.short}
          </button>
        ))}

        <div style={{ marginLeft: "auto", display: "flex", gap: 6 }}>
          <Link href="/cases/new" className="dt-pill primary">
            <Icon name="plus" size={12} /> New case
          </Link>
        </div>
      </div>

      <div
        style={{
          padding: "10px 16px",
          borderBottom: "1px solid var(--line-2)",
          display: "flex",
          gap: 10,
          alignItems: "center",
          background: "var(--surface)",
        }}
      >
        <span style={{ fontSize: 11.5, color: "var(--ink-3)", fontWeight: 500, marginLeft: "auto" }}>
          <div className="dt-rep-controls" style={{ padding: 0, background: "transparent", border: "none" }}>
            <div className="group">
              {SCOPES.map((s) => (
                <button
                  key={s.id}
                  type="button"
                  data-on={initial.scope === s.id || undefined}
                  onClick={() => push({ scope: s.id === "mine" ? null : s.id })}
                >
                  {s.label}
                </button>
              ))}
            </div>
          </div>
        </span>
      </div>
    </>
  );
}
