"use client";

import { useCallback, useEffect, useRef, useState, useTransition } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Icon } from "@/components/icons";

type Props = {
  initialQ: string;
};

export function MachineFilterBar({ initialQ }: Props) {
  const router = useRouter();
  const params = useSearchParams();
  const [pending, startTransition] = useTransition();
  const [q, setQ] = useState(initialQ);
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
        router.replace(str ? `/machines?${str}` : "/machines");
      });
    },
    [params, router]
  );

  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    if (q === initialQ) return;
    debounceRef.current = setTimeout(() => push({ q: q || null }), 300);
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [q]);

  return (
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
        placeholder="Search machine, serial, customer…"
        value={q}
        onChange={(e) => setQ(e.target.value)}
        className="field"
        style={{ paddingLeft: 34 }}
        disabled={pending}
      />
    </div>
  );
}
