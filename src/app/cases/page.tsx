import { createClient } from "@/lib/supabase/server";
import { fmtDate, statusBadge } from "@/lib/format";
import Link from "next/link";

export const dynamic = "force-dynamic";

type FilterKey = "all" | "active" | "overdue" | "pm" | "curative";

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
    .limit(100);

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

  const filters: { key: FilterKey; label: string; count: number }[] = [
    { key: "all", label: "All", count: allCount.count ?? 0 },
    { key: "active", label: "Active", count: activeCount.count ?? 0 },
    { key: "overdue", label: "Overdue", count: overdueCount.count ?? 0 },
    { key: "pm", label: "PM only", count: pmCount.count ?? 0 },
    { key: "curative", label: "Curative only", count: curativeCount.count ?? 0 },
  ];

  return (
    <div className="max-w-7xl mx-auto px-4 py-5">
      <div className="flex items-center justify-between mb-3">
        <div>
          <h1 className="text-lg font-semibold text-slate-900">Cases</h1>
          <p className="text-xs text-slate-500">{cases?.length ?? 0} shown</p>
        </div>
        <div className="flex gap-2 items-center">
          <Link
            href="/admin/bulk-reparse"
            className="text-xs px-3 py-1.5 rounded-md font-medium border border-slate-300 bg-white text-slate-700 hover:bg-slate-50"
            title="Re-run parser on all cases with planner_note"
          >
            ⚡ Bulk parse
          </Link>
          <Link
            href="/cases/new"
            className="text-xs px-3 py-1.5 rounded-md font-medium"
            style={{ background: "#C8102E", color: "white" }}
          >
            + New case
          </Link>
        </div>
      </div>

      <div className="flex gap-2 mb-4 text-xs flex-wrap">
        {filters.map((f) => (
          <Link
            key={f.key}
            href={`/cases${f.key === "all" ? "" : `?filter=${f.key}`}`}
            className="px-3 py-1.5 rounded-lg border transition-colors"
            style={
              filter === f.key
                ? { background: "#FEE2E5", color: "#C8102E", borderColor: "#FCA5AE", fontWeight: 600 }
                : { background: "white", color: "#475569", borderColor: "#E2E8F0" }
            }
          >
            {f.label} ({f.count})
          </Link>
        ))}
      </div>

      <div className="space-y-2">
        {(cases ?? []).map((c) => {
          const s = statusBadge[c.status] ?? { bg: "#F1F5F9", text: "#64748B", label: c.status };
          const isOverdue =
            c.due_date &&
            ["planned", "in_progress"].includes(c.status) &&
            new Date(c.due_date) < new Date();

          return (
            <Link
              key={c.so_number}
              href={`/cases/${c.so_number}`}
              className="block bg-white border border-slate-200 rounded-lg p-3 hover:border-slate-300 hover:shadow-sm transition-all"
              style={isOverdue ? { borderLeft: "3px solid #C8102E" } : {}}
            >
              <div className="flex items-start justify-between gap-3">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1 flex-wrap">
                    <span
                      className="font-mono text-sm font-medium"
                      style={{ color: "#C8102E" }}
                    >
                      {c.so_number}
                    </span>
                    <span
                      className="text-[10px] px-1.5 py-0.5 rounded font-medium"
                      style={{ background: s.bg, color: s.text }}
                    >
                      {s.label}
                    </span>
                    {c.source === "aroet" && (
                      <span className="text-[10px] bg-purple-100 text-purple-700 px-1.5 py-0.5 rounded font-medium">
                        AROET
                      </span>
                    )}
                    <span className="text-[10px] text-slate-500">
                      {c.service_type_code} · {c.service_type_name}
                    </span>
                  </div>
                  <div className="text-sm text-slate-800 truncate">
                    {c.title || c.customer_name}
                  </div>
                  <div className="flex gap-3 mt-1 text-[11px] text-slate-500 flex-wrap">
                    {c.machine_no && (
                      <span className="font-mono">🔧 {c.machine_no}</span>
                    )}
                    {c.title && (
                      <span className="truncate">🏢 {c.customer_name}</span>
                    )}
                  </div>
                </div>
                <div className="text-right text-[11px] text-slate-500 flex-shrink-0">
                  <div>Due {fmtDate(c.due_date)}</div>
                </div>
              </div>
            </Link>
          );
        })}
        {(cases ?? []).length === 0 && (
          <div className="text-center py-12 text-slate-400 text-sm">
            No cases match this filter
          </div>
        )}
      </div>
    </div>
  );
}
