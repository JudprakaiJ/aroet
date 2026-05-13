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
      .select("so_number, status, service_type_name, customer_name, machine_no, due_date, title")
      .in("status", ["planned", "in_progress"])
      .lt("due_date", today)
      .order("due_date", { ascending: true })
      .limit(20),
    supabase
      .from("cases")
      .select("so_number, status, service_type_name, customer_name, machine_no, due_date, title")
      .in("status", ["planned", "in_progress"])
      .gte("due_date", today)
      .lte("due_date", in30Days)
      .order("due_date", { ascending: true })
      .limit(20),
    supabase
      .from("cases")
      .select("so_number, status, service_type_name, customer_name, machine_no, due_date, title")
      .in("status", ["planned", "in_progress"])
      .gt("due_date", in30Days)
      .order("due_date", { ascending: true })
      .limit(20),
  ]);

  const groups = [
    { title: "Overdue", color: "#C8102E", bgColor: "#FFF1F2", cases: overdue.data ?? [], subtitle: "Need immediate attention" },
    { title: "Due in 30 days", color: "#BA7517", bgColor: "#FFFBEB", cases: dueSoon.data ?? [], subtitle: "Approaching deadline" },
    { title: "Planned (later)", color: "#185FA5", bgColor: "#EFF6FF", cases: planned.data ?? [], subtitle: "Future cases" },
  ];

  return (
    <div className="max-w-7xl mx-auto px-6 py-8">
      <h1 className="text-[28px] font-bold text-slate-900 leading-tight">Planning</h1>
      <p className="text-[14px] text-slate-500 mb-6 mt-1">Upcoming and overdue cases grouped by urgency</p>

      <div className="flex flex-col gap-5">
        {groups.map((g) => (
          <div key={g.title} className="bg-white border border-slate-200 rounded-2xl overflow-hidden">
            <div className="px-5 py-4 border-b border-slate-200 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <span className="inline-block w-1 h-7 rounded" style={{ background: g.color }}></span>
                <div>
                  <h2 className="text-[16px] font-semibold flex items-center gap-2">
                    {g.title}
                    <span className="text-[12px] px-2 py-0.5 rounded-md font-medium" style={{ background: g.bgColor, color: g.color }}>{g.cases.length}</span>
                  </h2>
                  <p className="text-[12px] text-slate-500 mt-0.5">{g.subtitle}</p>
                </div>
              </div>
            </div>
            {g.cases.length > 0 ? (
              <table className="w-full text-[13px]">
                <thead className="bg-slate-50 text-slate-600 border-b border-slate-100">
                  <tr className="text-left">
                    <th className="px-5 py-2.5 font-semibold text-[11px] uppercase tracking-wider w-32">SO</th>
                    <th className="px-5 py-2.5 font-semibold text-[11px] uppercase tracking-wider w-28">Status</th>
                    <th className="px-5 py-2.5 font-semibold text-[11px] uppercase tracking-wider w-44">Type</th>
                    <th className="px-5 py-2.5 font-semibold text-[11px] uppercase tracking-wider">Customer · Machine</th>
                    <th className="px-5 py-2.5 font-semibold text-[11px] uppercase tracking-wider w-28">Due</th>
                  </tr>
                </thead>
                <tbody>
                  {g.cases.map((c) => {
                    const s = statusBadge[c.status] ?? { bg: "#F1F5F9", text: "#64748B", label: c.status };
                    return (
                      <tr key={c.so_number} className="border-t border-slate-100 hover:bg-slate-50 transition-colors">
                        <td className="px-5 py-3">
                          <Link
                            href={`/cases/${c.so_number}`}
                            className="font-mono text-[13px] font-semibold hover:underline"
                            style={{ color: "#C8102E" }}
                          >
                            {c.so_number}
                          </Link>
                        </td>
                        <td className="px-5 py-3">
                          <span
                            className="text-[11px] px-2 py-1 rounded-md font-medium"
                            style={{ background: s.bg, color: s.text }}
                          >
                            {s.label}
                          </span>
                        </td>
                        <td className="px-5 py-3 text-slate-600">{c.service_type_name?.split(" ")[0] || "—"}</td>
                        <td className="px-5 py-3">
                          <div className="truncate text-slate-800">{c.customer_name}</div>
                          {c.machine_no && <div className="text-[11px] text-slate-400 font-mono mt-0.5">{c.machine_no}</div>}
                        </td>
                        <td className="px-5 py-3 text-slate-500 font-medium">{fmtDate(c.due_date)}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            ) : (
              <div className="px-5 py-8 text-center text-[13px] text-slate-400">No cases in this group</div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
