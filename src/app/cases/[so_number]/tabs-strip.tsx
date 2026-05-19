"use client";

import Link from "next/link";

type Tab = { id: string; label: string; count?: number | null };

type Props = {
  soNumber: string;
  active: string;
  tabs: Tab[];
};

export function TabsStrip({ soNumber, active, tabs }: Props) {
  return (
    <div style={{ padding: "0 14px 8px" }}>
      <div className="tabs" role="tablist">
        {tabs.map((t) => (
          <Link
            key={t.id}
            href={`/cases/${soNumber}?tab=${t.id}`}
            scroll={false}
            role="tab"
            data-active={active === t.id}
            style={{ textDecoration: "none" }}
          >
            {t.label}
            {typeof t.count === "number" && (
              <span style={{ marginLeft: 4, opacity: 0.6 }} className="mono">
                {t.count}
              </span>
            )}
          </Link>
        ))}
      </div>
    </div>
  );
}
