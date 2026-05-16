import Link from "next/link";

export type WorkforceTab = "plan" | "hours" | "queue";

interface Props {
  active: WorkforceTab;
  pendingCount?: number;
}

export default function WorkforceTabs({ active, pendingCount }: Props) {
  const tabs = [
    { id: "plan" as const, label: "Plan", icon: "📋" },
    { id: "hours" as const, label: "Hours", icon: "⏱️" },
    { id: "queue" as const, label: "Queue", icon: "✅", badge: pendingCount },
  ];

  return (
    <div className="flex gap-1 border-b-2 border-slate-900 mb-5 -mx-1 px-1">
      {tabs.map((t) => {
        const isActive = t.id === active;
        return (
          <Link
            key={t.id}
            href={`/workforce?tab=${t.id}`}
            className={`
              text-[13px] px-4 py-2.5 font-medium inline-flex items-center gap-1.5
              ${
                isActive
                  ? "bg-white text-slate-900 border border-slate-200 border-b-white rounded-t-lg -mb-[2px]"
                  : "text-slate-500 hover:text-slate-900"
              }
            `}
            style={isActive ? { borderBottom: "2px solid white" } : undefined}
          >
            <span>{t.icon}</span>
            {t.label}
            {t.badge !== undefined && t.badge > 0 && (
              <span
                className="ml-1 px-1.5 py-0.5 rounded-full text-[10px] font-semibold text-white"
                style={{ background: "#C8102E" }}
              >
                {t.badge}
              </span>
            )}
          </Link>
        );
      })}
    </div>
  );
}
