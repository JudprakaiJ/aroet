import { createClient } from "@/lib/supabase/server";
import { fmtDate, statusBadge } from "@/lib/format";
import Link from "next/link";

export default async function Dashboard() {
  const supabase = await createClient();

  const [activeCases, totalCases, totalMachines, unknownVer, recentCases] = await Promise.all([
    supabase.from("cases").select("*", { count: "exact", head: true }).in("status", ["planned", "in_progress"]),
    supabase.from("cases").select("*", { count: "exact", head: true }),
    supabase.from("machines").select("*", { count: "exact", head: true }),
    supabase.from("machines").select("*", { count: "exact", head: true }).is("version", null),
    supabase
      .from("cases")
      .select("so_number, status, service_type_name, customer_name, machine_no, due_date")
      .in("status", ["planned", "in_progress"])
      .order("due_date", { ascending: true, nullsFirst: false })
      .limit(8),
  ]);

  const stats = [
    { label: "Active cases", value: activeCases.count ?? 0, href: "/cases", accent: true },
    { label: "Total cases", value: totalCases.count ?? 0, href: "/cases" },
    { label: "Machines", value: totalMachines.count ?? 0, href: "/machines" },
    { label: "Unknown version", value: unknownVer.count ?? 0, href: "/machines?filter=unknown" },
  ];

  return (
    <div className="max-w-7xl mx-auto px-4 py-5">
      <h1 className="text-lg font-semibold text-slate-900 mb-1">Dashboard</h1>
      <p className="text-xs text-slate-500 mb-4">A&R Optical field service overview</p>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
        {stats.map((s) => (
          <Link
            key={s.label}
            href={s.href}
            className="bg-white border border-slate-200 rounded-lg p-3 hover:border-slate-300 hover:shadow-sm transition-all"
          >
            <div className="text-xs text-slate-500">{s.label}</div>
            <div
              className="text-2xl font-semibold mt-1"
              style={{ color: s.accent ? "#C8102E" : "#0f172a" }}
            >
              {s.value.toLocaleString()}
            </div>
          </Link>
        ))}
      </div>

      <div className="bg-white border border-slate-200 rounded-lg overflow-hidden">
        <div className="px-4 py-2.5 border-b border-slate-200 flex items-center justify-between">
          <h2 className="text-sm font-semibold text-slate-900">Upcoming cases</h2>
          <Link href="/cases" className="text-xs hover:underline" style={{ color: "#C8102E" }}>
            View all →
          </Link>
        </div>
        <table className="w-full text-xs">
          <thead className="bg-slate-50 text-slate-600">
            <tr className="text-left">
              <th className="px-3 py-2 font-medium w-28">SO</th>
              <th className="px-3 py-2 font-medium w-24">Status</th>
              <th className="px-3 py-2 font-medium">Customer</th>
              <th className="px-3 py-2 font-medium w-28">Machine</th>
              <th className="px-3 py-2 font-medium w-20">Due</th>
            </tr>
          </thead>
          <tbody>
            {(recentCases.data ?? []).map((c) => {
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
                  <td className="px-3 py-1.5 truncate max-w-xs">{c.customer_name}</td>
                  <td className="px-3 py-1.5 font-mono text-[10px]">{c.machine_no ?? "—"}</td>
                  <td className="px-3 py-1.5 text-slate-500">{fmtDate(c.due_date)}</td>
                </tr>
              );
            })}
            {(recentCases.data ?? []).length === 0 && (
              <tr>
                <td colSpan={5} className="px-3 py-6 text-center text-slate-400 text-xs">
                  No upcoming cases
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
