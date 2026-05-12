"use client";

import Link from "next/link";

interface Props {
  so_number: string;
  activeTab: string;
  counts: {
    sessions: number;
    references: number;
    admin_log: number;
    machines: number;
  };
}

const TABS = [
  { key: "sessions", label: "Sessions" },
  { key: "references", label: "References" },
  { key: "admin", label: "Admin log" },
  { key: "machines", label: "Machine" },
  { key: "engineers", label: "Engineers" },
  { key: "planner", label: "Planner note" },
];

export default function CaseTabs({ so_number, activeTab, counts }: Props) {
  return (
    <div className="flex gap-1 border-b border-slate-200 overflow-x-auto">
      {TABS.map((t) => {
        let count: number | null = null;
        if (t.key === "sessions") count = counts.sessions;
        else if (t.key === "references") count = counts.references;
        else if (t.key === "admin") count = counts.admin_log;
        else if (t.key === "machines") count = counts.machines;

        const active = activeTab === t.key;

        return (
          <Link
            key={t.key}
            href={`/cases/${so_number}${t.key === "sessions" ? "" : `?tab=${t.key}`}`}
            className="px-3 py-2 text-xs whitespace-nowrap transition-colors"
            style={
              active
                ? { borderBottom: "2px solid #C8102E", color: "#0f172a", fontWeight: 500, marginBottom: "-1px" }
                : { color: "#64748B" }
            }
          >
            {t.label}
            {count !== null && count > 0 && (
              <span className="ml-1.5 text-[10px] bg-slate-100 text-slate-600 px-1.5 py-0.5 rounded">
                {count}
              </span>
            )}
          </Link>
        );
      })}
    </div>
  );
}
