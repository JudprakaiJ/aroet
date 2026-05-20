"use client";

import { useCallback, useEffect, useRef, useState, useTransition } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Icon } from "@/components/icons";

type Props = {
  basePath: string;
  initialQ: string;
  placeholder?: string;
};

export function SearchBar({ basePath, initialQ, placeholder = "Search…" }: Props) {
  const router = useRouter();
  const params = useSearchParams();
  const [, startTransition] = useTransition();
  const [q, setQ] = useState(initialQ);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const push = useCallback(
    (next: string) => {
      const sp = new URLSearchParams(params?.toString() ?? "");
      if (next) sp.set("q", next);
      else sp.delete("q");
      const str = sp.toString();
      startTransition(() => {
        router.replace(str ? `${basePath}?${str}` : basePath);
      });
    },
    [params, router, basePath]
  );

  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    if (q === initialQ) return;
    debounceRef.current = setTimeout(() => push(q), 300);
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
        placeholder={placeholder}
        value={q}
        onChange={(e) => setQ(e.target.value)}
        className="field"
        style={{ paddingLeft: 34 }}
      />
    </div>
  );
}
