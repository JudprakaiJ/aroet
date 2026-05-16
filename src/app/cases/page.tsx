import { createClient } from "@/lib/supabase/server";
import Link from "next/link";

export const dynamic = "force-dynamic";

type FilterKey = "all" | "active" | "overdue" | "pm" | "curative";

const SERVICE_TYPE_COLORS: Record<string, { bg: string; fg: string }> = {
  "PM": { bg: "#DDEBF7", fg: "#185FA5" },
  "Preventive": { bg: "#DDEBF7", fg: "#185FA5" },
  "Curative": { bg: "#FBEAF0", fg: "#993556" },
  "Installation": { bg: "#EAF3DE", fg: "#3B6D11" },
  "Service": { bg: "#DDEBF7", fg: "#185FA5" },
  "Training": { bg: "#FAEEDA", fg: "#6B3D04" },
  "Upgrade": { bg: "#EEEDFE", fg: "#5B21B6" },
};

const STATUS_COLORS: Record<string, { bg: string; fg: string }> = {
  planned: { bg: "#DDEBF7", fg: "#185FA5" },
  in_progress: { bg: "#FAEEDA", fg: "#6B3D04" },
  completed: { bg: "#D1FAE5", fg: "#065F46" },
  verified: { bg: "#D1FAE5", fg: "#065F46" },
  canceled: { bg: "#F1F5F9", fg: "#475569" },
};

const ENG_COLORS: Record<string, { bg: string; fg: string }> = {
  JKH: { bg: "#FCE8EB", fg: "#C8102E" },
  RKO: { bg: "#FBEAF0", fg: "#993556" },
  TCH: { bg: "#EAF3DE", fg: "#3B6D11" },
  PSU: { bg: "#DDEBF7", fg: "#185FA5" },
  PPI: { bg: "#FAEEDA", fg: "#6B3D04" },
  SPE: { bg: "#EEEDFE", fg: "#5B21B6" },
  KBU: { bg: "#FEF2D3", fg: "#854D0E" },
  RMA: { bg: "#FFE4E6", fg: "#9F1239" },
  IRO: { bg: "#E0F2FE", fg: "#075985" },
  JYE: { bg: "#F3E8FF", fg: "#6B21A8" },
};

function engColor(code: string) {
  return ENG_COLORS[code] || { bg: "#F1F5F9", fg: "#475569" };
}

function extractProjectCode(title: string | null): string | null {
  if (!title) return null;
  // Look for patterns like ZEGU99, ESSA01, RE72 — uppercase letters/digits, 2-8 chars
  const match = title.match(/\b([A-Z]{2,5}\d{1,3})\b/);
  return match ? match[1] : null;
}

export default async function CasesPage({
  searchParams,
}: {
  searchParams: Promise<{ filter?: FilterKey; q?: string }>;
}) {
  const { filter = "all", q = "" } = await searchParams;
  const supabase = await createClient();

  let query = supabase
    .from("cases")
    .select("so_number, source, status, service_type_code, service_type_name, customer_name, machine_no, due_date, title");

  if (filter === "active") {
    query = query.in("status", ["planned", "in_progress"]);
  } else if (filter === "overdue") {
    const today = new Date().toISOString().split("T")[0];
    query = query.in("status", ["planned", "in_progress"]).lt("due_date", today);
  } else if (filter === "pm") {
    query = query.eq("service_type_code", "7507");
  } else if (filter === "curative") {
    query = query.in("service_type_code", ["7505", "7515"]);
  }

  if (q) {
    query = query.or(`so_number.ilike.%${q}%,customer_name.ilike.%${q}%,machine_no.ilike.%${q}%,title.ilike.%${q}%`);
  }

  const { data: cases, error } = await query
    .order("created_at", { ascending: false })
    .limit(50);

  // Get engineer assignments for these cases (lead engineer + others)
  const soNumbers = (cases || []).map((c) => c.so_number);
  const { data: engineerAssignments } = soNumbers.length > 0
    ? await supabase
        .from("case_engineers")
        .select("so_number, engineer_code, is_lead")
        .in("so_number", soNumbers)
    : { data: [] };

  // Build map: so_number → { lead, others }
  const engMap = new Map<string, { lead?: string; others: string[] }>();
  for (const a of engineerAssignments || []) {
    if (!engMap.has(a.so_number)) engMap.set(a.so_number, { others: [] });
    const entry = engMap.get(a.so_number)!;
    if (a.is_lead) entry.lead = a.engineer_code;
    else entry.others.push(a.engineer_code);
  }

  if (error) {
    return <div className="p-6 text-red-600">Error: {error.message}</div>;
  }

  // Get counts for filter chips
  const today = new Date().toISOString().split("T")[0];
  const [allCount, activeCount, overdueCount, pmCount, curativeCount] = await Promise.all([
    supabase.from("cases").select("*", { count: "exact", head: true }),
    supabase.from("cases").select("*", { count: "exact", head: true }).in("status", ["planned", "in_progress"]),
    supabase.from("cases").select("*", { count: "exact", head: true }).in("status", ["planned", "in_progress"]).lt("due_date", today),
    supabase.from("cases").select("*", { count: "exact", head: true }).eq("service_type_code", "7507"),
    supabase.from("cases").select("*", { count: "exact", head: true }).in("service_type_code", ["7505", "7515"]),
  ]);

  return (
    <div className="max-w-7xl mx-auto px-6 py-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-2">
        <h1 className="text-[28px] font-bold text-slate-900 leading-tight">Cases</h1>
        <div className="flex gap-2">
          <Link
            href="/cases/new"
            className="text-[14px] px-5 py-2.5 rounded-lg font-medium text-white inline-flex items-center gap-1.5"
            style={{ background: "#C8102E" }}
          >
            <span className="text-lg leading-none">+</span> New case
          </Link>
        </div>
      </div>
      <p className="text-[14px] text-slate-500 mb-6">
        {allCount.count?.toLocaleString() || 0} cases total · {activeCount.count || 0} active · {overdueCount.count || 0} overdue
      </p>

      {/* Filter bar */}
      <div className="bg-white border border-slate-200 rounded-2xl p-4 mb-5">
        <form className="flex flex-wrap items-center gap-3">
          <div className="relative flex-1 min-w-[240px]">
            <input
              name="q"
              defaultValue={q}
              placeholder="Search SO, customer, machine, title..."
              className="w-full pl-10 pr-3 py-2.5 text-[14px] border border-slate-200 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-red-100"
            />
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">🔍</span>
            {filter !== "all" && <input type="hidden" name="filter" value={filter} />}
          </div>

          <div className="flex flex-wrap gap-1.5">
            <FilterChip href={`/cases${q ? `?q=${q}` : ""}`} label="All" count={allCount.count} active={filter === "all"} />
            <FilterChip href={`/cases?filter=active${q ? `&q=${q}` : ""}`} label="Active" count={activeCount.count} active={filter === "active"} />
            <FilterChip href={`/cases?filter=overdue${q ? `&q=${q}` : ""}`} label="Overdue" count={overdueCount.count} active={filter === "overdue"} red />
            <FilterChip href={`/cases?filter=pm${q ? `&q=${q}` : ""}`} label="PM" count={pmCount.count} active={filter === "pm"} />
            <FilterChip href={`/cases?filter=curative${q ? `&q=${q}` : ""}`} label="Curative" count={curativeCount.count} active={filter === "curative"} />
          </div>
        </form>
      </div>

      {/* Case cards */}
      <div className="flex flex-col gap-3">
        {(cases || []).length === 0 && (
          <div className="bg-white border border-slate-200 rounded-2xl py-16 text-center text-slate-400">
            No cases match your filters.
          </div>
        )}
        {(cases || []).map((c) => {
          const isOverdue = c.status !== "completed" && c.status !== "verified" && c.due_date && c.due_date < today;
          const engs = engMap.get(c.so_number) || { others: [] };
          const projectCode = extractProjectCode(c.title);
          const serviceTypeShort = c.service_type_name?.split(" ")[0] || "";
          const serviceColor = SERVICE_TYPE_COLORS[serviceTypeShort] || { bg: "#F1F5F9", fg: "#475569" };
          const statusColor = STATUS_COLORS[c.status] || { bg: "#F1F5F9", fg: "#475569" };

          return (
            <Link
              key={c.so_number}
              href={`/cases/${c.so_number}`}
              className="block bg-white border border-slate-200 rounded-2xl p-5 transition-all card-hover"
              style={{ borderLeft: isOverdue ? "4px solid #C8102E" : undefined }}
            >
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-2 flex-wrap">
                    <span
                      className="font-mono text-[16px] font-bold"
                      style={{ color: isOverdue ? "#C8102E" : "#1a1a1a" }}
                    >
                      {c.so_number}
                    </span>
                    {isOverdue && (
                      <span
                        className="text-[11px] px-2 py-1 rounded-md font-semibold"
                        style={{ background: "#FCE8EB", color: "#C8102E" }}
                      >
                        Overdue
                      </span>
                    )}
                    <span
                      className="text-[11px] px-2 py-1 rounded-md font-medium"
                      style={{ background: statusColor.bg, color: statusColor.fg }}
                    >
                      {c.status.replace("_", " ")}
                    </span>
                    {serviceTypeShort && (
                      <span
                        className="text-[11px] px-2 py-1 rounded-md font-medium"
                        style={{ background: serviceColor.bg, color: serviceColor.fg }}
                      >
                        {serviceTypeShort}
                      </span>
                    )}
                    {projectCode && (
                      <span
                        className="font-mono text-[11px] px-2 py-0.5 rounded font-medium"
                        style={{ background: "#FAEEDA", color: "#6B3D04" }}
                      >
                        {projectCode}
                      </span>
                    )}
                  </div>
                  <div className="text-[15px] font-semibold text-slate-800 mb-1.5 line-clamp-1">
                    {c.title || c.machine_no || c.so_number}
                  </div>
                  <div className="text-[13px] text-slate-500 flex items-center gap-x-4 gap-y-1 flex-wrap">
                    {c.customer_name && <span>🏢 {c.customer_name}</span>}
                    {c.machine_no && <span className="font-mono">⚙ {c.machine_no}</span>}
                    {c.due_date && <span>📅 Due {c.due_date}</span>}
                  </div>
                </div>

                {/* Engineer avatars */}
                {(engs.lead || engs.others.length > 0) && (
                  <div className="flex items-center -space-x-2 flex-shrink-0">
                    {engs.lead && <Avatar code={engs.lead} isLead />}
                    {engs.others.slice(0, 3).map((code) => (
                      <Avatar key={code} code={code} />
                    ))}
                    {engs.others.length > 3 && (
                      <div
                        className="w-9 h-9 rounded-full bg-slate-200 text-slate-600 flex items-center justify-center text-[10px] font-semibold border-2 border-white"
                      >
                        +{engs.others.length - 3}
                      </div>
                    )}
                  </div>
                )}
              </div>
            </Link>
          );
        })}
      </div>

      {(cases || []).length === 50 && (
        <div className="text-center text-[13px] text-slate-400 mt-6">
          Showing first 50 cases · use search to narrow results
        </div>
      )}
    </div>
  );
}

function FilterChip({
  href,
  label,
  count,
  active,
  red,
}: {
  href: string;
  label: string;
  count?: number | null;
  active?: boolean;
  red?: boolean;
}) {
  const activeBg = red ? "#FCE8EB" : "#FCE8EB";
  const activeFg = red ? "#C8102E" : "#C8102E";
  const activeBorder = red ? "#C8102E" : "#C8102E";

  return (
    <Link
      href={href}
      className="text-[13px] px-3.5 py-2 rounded-lg font-medium inline-flex items-center gap-1.5"
      style={
        active
          ? { background: activeBg, color: activeFg, border: `1.5px solid ${activeBorder}` }
          : { background: "white", color: "#1a1a1a", border: "1px solid #e2e8f0" }
      }
    >
      {label}
      {count !== null && count !== undefined && (
        <span
          className="text-[11px]"
          style={{ color: active ? activeFg : (red && count > 0 ? "#C8102E" : "#94a3b8"), opacity: active ? 0.8 : 1 }}
        >
          {count}
        </span>
      )}
    </Link>
  );
}

function Avatar({ code, isLead }: { code: string; isLead?: boolean }) {
  const c = engColor(code);
  return (
    <div
      className="w-9 h-9 rounded-full flex items-center justify-center text-[11px] font-bold border-2 border-white relative"
      style={{ background: c.bg, color: c.fg }}
      title={isLead ? `${code} (Lead)` : code}
    >
      {code}
      {isLead && (
        <span
          className="absolute -top-1 -right-1 text-[10px] leading-none w-4 h-4 flex items-center justify-center rounded-full"
          style={{ background: "#FAEEDA", color: "#BA7517" }}
        >
          ★
        </span>
      )}
    </div>
  );
}
