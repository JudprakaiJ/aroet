import { createClient } from "@/lib/supabase/server";
import { fmtDate } from "@/lib/format";
import Link from "next/link";

export const dynamic = "force-dynamic";

export default async function MachinesPage({
  searchParams,
}: {
  searchParams: Promise<{ filter?: string }>;
}) {
  const { filter } = await searchParams;
  const supabase = await createClient();

  let query = supabase
    .from("machines")
    .select("machine_no, name, product_code, serial_no, customer_name, warranty_expiry, version")
    .order("machine_no", { ascending: false });

  if (filter === "unknown") query = query.is("version", null);

  const { data: machines, error } = await query.limit(200);

  const counts = await Promise.all([
    supabase.from("machines").select("*", { count: "exact", head: true }),
    supabase.from("machines").select("*", { count: "exact", head: true }).is("version", null),
  ]);

  if (error) return <div className="p-6 text-red-600">Error: {error.message}</div>;

  return (
    <div className="max-w-7xl mx-auto px-6 py-8">
      <h1 className="text-[28px] font-bold text-slate-900 leading-tight">Machines</h1>
      <p className="text-[14px] text-slate-500 mb-6 mt-1">
        {filter === "unknown" ? "Machines with unknown version" : `${counts[0].count ?? 0} active machines · ${counts[1].count ?? 0} with unknown version`}
      </p>

      <div className="flex gap-2 mb-5">
        <Link
          href="/machines"
          className="px-3.5 py-2 rounded-lg font-medium text-[13px]"
          style={
            !filter
              ? { background: "#FCE8EB", color: "#C8102E", border: "1.5px solid #C8102E" }
              : { background: "white", color: "#1a1a1a", border: "1px solid #e2e8f0" }
          }
        >
          All <span style={{ opacity: 0.7, marginLeft: 4 }}>{counts[0].count ?? 0}</span>
        </Link>
        <Link
          href="/machines?filter=unknown"
          className="px-3.5 py-2 rounded-lg font-medium text-[13px]"
          style={
            filter === "unknown"
              ? { background: "#FCE8EB", color: "#C8102E", border: "1.5px solid #C8102E" }
              : { background: "white", color: "#1a1a1a", border: "1px solid #e2e8f0" }
          }
        >
          Unknown version <span style={{ opacity: 0.7, marginLeft: 4 }}>{counts[1].count ?? 0}</span>
        </Link>
      </div>

      <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden">
        <table className="w-full text-[13px]">
          <thead className="bg-slate-50 text-slate-600 border-b border-slate-200">
            <tr className="text-left">
              <th className="px-5 py-3 font-semibold text-[12px] uppercase tracking-wider w-40">Machine #</th>
              <th className="px-5 py-3 font-semibold text-[12px] uppercase tracking-wider w-36">Product</th>
              <th className="px-5 py-3 font-semibold text-[12px] uppercase tracking-wider w-20">Version</th>
              <th className="px-5 py-3 font-semibold text-[12px] uppercase tracking-wider w-32">Serial</th>
              <th className="px-5 py-3 font-semibold text-[12px] uppercase tracking-wider">Customer</th>
              <th className="px-5 py-3 font-semibold text-[12px] uppercase tracking-wider w-28">Warranty</th>
            </tr>
          </thead>
          <tbody>
            {(machines ?? []).map((m) => (
              <tr key={m.machine_no} className="border-b border-slate-100 hover:bg-slate-50 transition-colors">
                <td className="px-5 py-3">
                  <Link
                    href={`/machines/${encodeURIComponent(m.machine_no)}`}
                    className="font-mono text-[13px] font-semibold hover:underline"
                    style={{ color: "#C8102E" }}
                  >
                    {m.machine_no}
                  </Link>
                </td>
                <td className="px-5 py-3 font-mono text-[12px] text-slate-600">{m.product_code ?? "—"}</td>
                <td className="px-5 py-3">
                  {m.version ? (
                    <span
                      className="text-[11px] px-2 py-1 rounded-md font-medium"
                      style={
                        m.version === "N/A"
                          ? { background: "#F1F5F9", color: "#64748B" }
                          : { background: "#EDE9FE", color: "#5B21B6" }
                      }
                    >
                      {m.version}
                    </span>
                  ) : (
                    <span className="text-[11px] px-2 py-1 rounded-md font-medium" style={{ background: "#FAEEDA", color: "#BA7517" }}>unknown</span>
                  )}
                </td>
                <td className="px-5 py-3 font-mono text-[12px]">{m.serial_no ?? "—"}</td>
                <td className="px-5 py-3 truncate max-w-xs">{m.customer_name ?? "—"}</td>
                <td className="px-5 py-3 text-slate-500">{fmtDate(m.warranty_expiry)}</td>
              </tr>
            ))}
            {(machines ?? []).length === 0 && (
              <tr><td colSpan={6} className="px-5 py-12 text-center text-slate-400 text-[13px]">No machines</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
