import { createClient } from "@/lib/supabase/server";
import { fmtDate, statusBadge } from "@/lib/format";
import Link from "next/link";

export const dynamic = "force-dynamic";

export default async function PlanningPage() {
  const supabase = await createClient();
  const today = new Date().toISOString().split("T")[0];
  const in30Days = new Date(Date.now() + 30 * 86400000).toISOString().split("T")[0];

  const [overdue, dueSoon, planned] = await Promise.all([
    supabase
      .from("cases")
      .select("so_number, status, service_type_name, customer_name, machine_no, due_date")
      .in("status", ["planned", "in_progress"])
      .lt("due_date", today)
      .order("due_date", { ascending: true })
      .limit(20),
    supabase
      .from("cases")
      .select("so_number, status, service_type_name, customer_name, machine_no, due_date")
      .in("status", ["planned", "in_progress"])
      .gte("due_date", today)
      .lte("due_date", in30Days)
      .order("due_date", { ascending: true })
      .limit(20),
    supabase
      .from("cases")
      .select("so_number, status, service_type_name, customer_name, machine_no, due_date")
      .in("status", ["planned", "in_progress"])
      .gt("due_date", in30Days)
      .order("due_date", { ascending: true })
      .limit(20),
  ]);

  const groups = [
    { title: "Overdue", color: "#C8102E", cases: overdue.data ?? [] },
    { title: "Due in 30 days", color: "#92400E", cases: dueSoon.data ?? [] },
    { title: "Planned (later)", color: "#1E40AF", cases: planned.data ?? [] },
  ];

  return (
    <div className="max-w-7xl mx-auto px-4 py-5">
      <h1 className="text-lg font-semibold text-slate-900 mb-1">Planning</h1>
      <p className="text-xs text-slate-500 mb-3">Upcoming and overdue cases</p>

      <div className="space-y-4">
        {groups.map((g) => (
          <div key={g.title} className="bg-white border border-slate-200 rounded-lg overflow-hidden">
            <div className="px-4 py-2.5 border-b border-slate-200">
              <h2 className="text-sm font-semibold flex items-center gap-2">
                <span className="inline-block w-1 h-4 rounded" style={{ background: g.color }}></span>
                {g.title}
                <span className="text-[10px] text-slate-500 font-normal">({g.cases.length})</span>
              </h2>
            </div>
            {g.cases.length > 0 ? (
              <table className="w-full text-xs">
                <thead className="bg-slate-50 text-slate-600">
                  <tr className="text-left">
                    <th className="px-3 py-2 font-medium w-28">SO</th>
                    <th className="px-3 py-2 font-medium w-24">Status</th>
                    <th className="px-3 py-2 font-medium w-44">Type</th>
                    <th className="px-3 py-2 font-medium">Customer</th>
                    <th className="px-3 py-2 font-medium w-28">Machine</th>
                    <th className="px-3 py-2 font-medium w-20">Due</th>
                  </tr>
                </thead>
                <tbody>
                  {g.cases.map((c) => {
                    const s = statusBadge[c.status] ?? { bg: "#F1F5F9", text: "#64748B", label: c.status };
                    return (
                      <tr key={c.so_number} className="border-t border-slate-100 hover:bg-slate-50">
                        <td className="px-3 py-1.5">
                          <Link
                            href={`/cases/${c.so_number}`}
                            className="font-mono text-[11px] hover:underline"
                            style={{ color: "#C8102E" }}
                          >
                            {c.so_number}
                          </Link>
                        </td>
                        <td className="px-3 py-1.5">
                          <span
                            className="text-[10px] px-1.5 py-0.5 rounded font-medium"
                            style={{ background: s.bg, color: s.text }}
                          >
                            {s.label}
                          </span>
                        </td>
                        <td className="px-3 py-1.5 text-slate-600 truncate">{c.service_type_name}</td>
                        <td className="px-3 py-1.5 truncate max-w-xs">{c.customer_name}</td>
                        <td className="px-3 py-1.5 font-mono text-[10px]">{c.machine_no ?? "—"}</td>
                        <td className="px-3 py-1.5 text-slate-500">{fmtDate(c.due_date)}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            ) : (
              <div className="px-4 py-4 text-center text-xs text-slate-400">No cases</div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
