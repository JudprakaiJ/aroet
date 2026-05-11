import { createClient } from "@/lib/supabase/server";
import { fmtDate } from "@/lib/format";
import Link from "next/link";

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
    .eq("is_active", true)
    .order("machine_no", { ascending: false });

  if (filter === "unknown") query = query.is("version", null);

  const { data: machines, error } = await query.limit(200);

  const counts = await Promise.all([
    supabase.from("machines").select("*", { count: "exact", head: true }),
    supabase.from("machines").select("*", { count: "exact", head: true }).is("version", null),
  ]);

  if (error) return <div className="p-6 text-red-600">Error: {error.message}</div>;

  return (
    <div className="max-w-7xl mx-auto px-4 py-5">
      <h1 className="text-lg font-semibold text-slate-900 mb-1">Machines</h1>
      <p className="text-xs text-slate-500 mb-3">
        {filter === "unknown" ? "Machines with unknown version" : "All active machines"}
      </p>

      <div className="flex gap-2 mb-3 text-xs">
        <Link
          href="/machines"
          className="px-3 py-1.5 rounded-lg border"
          style={
            !filter
              ? { background: "#FEE2E5", color: "#C8102E", borderColor: "#FCA5AE", fontWeight: 600 }
              : { background: "white", color: "#475569", borderColor: "#E2E8F0" }
          }
        >
          All ({counts[0].count ?? 0})
        </Link>
        <Link
          href="/machines?filter=unknown"
          className="px-3 py-1.5 rounded-lg border"
          style={
            filter === "unknown"
              ? { background: "#FEE2E5", color: "#C8102E", borderColor: "#FCA5AE", fontWeight: 600 }
              : { background: "white", color: "#475569", borderColor: "#E2E8F0" }
          }
        >
          Unknown version ({counts[1].count ?? 0})
        </Link>
      </div>

      <div className="bg-white rounded-lg border border-slate-200 overflow-hidden">
        <table className="w-full text-xs">
          <thead className="bg-slate-50 text-slate-600 border-b border-slate-200">
            <tr className="text-left">
              <th className="px-3 py-2 font-medium w-32">Machine #</th>
              <th className="px-3 py-2 font-medium w-32">Product</th>
              <th className="px-3 py-2 font-medium w-16">Ver</th>
              <th className="px-3 py-2 font-medium w-28">Serial</th>
              <th className="px-3 py-2 font-medium">Customer</th>
              <th className="px-3 py-2 font-medium w-24">Warranty</th>
            </tr>
          </thead>
          <tbody>
            {(machines ?? []).map((m) => (
              <tr key={m.machine_no} className="border-b border-slate-100 hover:bg-slate-50">
                <td className="px-3 py-1.5">
                  <Link
                    href={`/machines/${encodeURIComponent(m.machine_no)}`}
                    className="font-mono text-[11px] hover:underline"
                    style={{ color: "#C8102E" }}
                  >
                    {m.machine_no}
                  </Link>
                </td>
                <td className="px-3 py-1.5 font-mono text-[10px] text-slate-600">{m.product_code ?? "—"}</td>
                <td className="px-3 py-1.5">
                  {m.version ? (
                    <span
                      className="text-[10px] px-1.5 py-0.5 rounded font-medium"
                      style={
                        m.version === "N/A"
                          ? { background: "#F1F5F9", color: "#64748B" }
                          : { background: "#EDE9FE", color: "#5B21B6" }
                      }
                    >
                      {m.version}
                    </span>
                  ) : (
                    <span className="text-[10px] text-amber-600 font-medium">unknown</span>
                  )}
                </td>
                <td className="px-3 py-1.5 font-mono text-[10px]">{m.serial_no ?? "—"}</td>
                <td className="px-3 py-1.5 truncate max-w-xs">{m.customer_name ?? "—"}</td>
                <td className="px-3 py-1.5 text-slate-500">{fmtDate(m.warranty_expiry)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
