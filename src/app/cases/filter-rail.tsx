"use client";

import { useCallback, useEffect, useRef, useState, useTransition } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Icon } from "@/components/icons";
import { SERVICE_TYPES } from "@/lib/service-types";

type Scope = "mine" | "team" | "all";
type Status = "open" | "verified" | "all";

type Props = {
  years: string[];
  initial: {
    q: string;
    scope: Scope;
    status: Status;
    year: string | null;
    type: string | null;
  };
};

const SCOPES: { id: Scope; label: string }[] = [
  { id: "mine", label: "Mine" },
  { id: "team", label: "Team" },
  { id: "all", label: "All" },
];

const STATUSES: { id: Status; label: string }[] = [
  { id: "open", label: "Open" },
  { id: "verified", label: "Verified" },
  { id: "all", label: "All status" },
];

export function FilterRail({ years, initial }: Props) {
  const router = useRouter();
  const params = useSearchParams();
  const [pending, startTransition] = useTransition();
  const [q, setQ] = useState(initial.q);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

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

  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    if (q === initial.q) return;
    debounceRef.current = setTimeout(() => {
      push({ q: q || null });
    }, 300);
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [q]);

  return (
    <div style={{ background: "var(--bg)" }}>
      <div style={{ padding: "0 14px 8px" }}>
        <div style={{ position: "relative" }}>
          <span
            style={{
              position: "absolute",
              left: 10,
              top: "50%",
              transform: "translateY(-50%)",
              color: "var(--ink-4)",
              display: "inline-flex",
            }}
          >
            <Icon name="search" size={16} />
          </span>
          <input
            type="search"
            placeholder="Search SO, title, customer, project…"
            value={q}
            onChange={(e) => setQ(e.target.value)}
            className="field"
            style={{ paddingLeft: 34 }}
          />
        </div>
      </div>

      <div className="chiprail">
        {SCOPES.map((s) => (
          <button
            key={s.id}
            type="button"
            className="fchip"
            data-on={initial.scope === s.id || undefined}
            onClick={() => push({ scope: s.id === "mine" ? null : s.id })}
            disabled={pending}
          >
            {s.label}
          </button>
        ))}
        <span style={{ width: 8, flex: "none" }} />
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
        <span style={{ width: 8, flex: "none" }} />
        {years.slice(0, 6).map((y) => (
          <button
            key={y}
            type="button"
            className="fchip"
            data-on={initial.year === y || undefined}
            onClick={() => push({ year: initial.year === y ? null : y })}
            disabled={pending}
          >
            {y}
          </button>
        ))}
        <span style={{ width: 8, flex: "none" }} />
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
      </div>
    </div>
  );
}
