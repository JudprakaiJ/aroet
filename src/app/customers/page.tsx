import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

export default async function CustomersPage() {
  const supabase = await createClient();
  const { data: customers, error } = await supabase
    .from("customers")
    .select("code, name, city, country, contact_name, contact_mobile")
    .order("name");

  if (error) return <div className="p-6 text-red-600">Error: {error.message}</div>;

  const { data: machineCounts } = await supabase.from("machines").select("customer_code");
  const { data: caseCounts } = await supabase.from("cases").select("customer_code");

  const machineMap = new Map<string, number>();
  (machineCounts ?? []).forEach((m: any) => {
    if (m.customer_code) machineMap.set(m.customer_code, (machineMap.get(m.customer_code) ?? 0) + 1);
  });

  const caseMap = new Map<string, number>();
  (caseCounts ?? []).forEach((c: any) => {
    if (c.customer_code) caseMap.set(c.customer_code, (caseMap.get(c.customer_code) ?? 0) + 1);
  });

  return (
    <div className="max-w-7xl mx-auto px-6 py-8">
      <h1 className="text-[28px] font-bold text-slate-900 leading-tight">Customers</h1>
      <p className="text-[14px] text-slate-500 mb-6 mt-1">{customers?.length ?? 0} customers in directory</p>

      <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden">
        <table className="w-full text-[13px]">
          <thead className="bg-slate-50 text-slate-600 border-b border-slate-200">
            <tr className="text-left">
              <th className="px-5 py-3 font-semibold text-[12px] uppercase tracking-wider w-20">Code</th>
              <th className="px-5 py-3 font-semibold text-[12px] uppercase tracking-wider">Customer</th>
              <th className="px-5 py-3 font-semibold text-[12px] uppercase tracking-wider w-36">City</th>
              <th className="px-5 py-3 font-semibold text-[12px] uppercase tracking-wider w-28">Country</th>
              <th className="px-5 py-3 font-semibold text-[12px] uppercase tracking-wider w-36">Contact</th>
              <th className="px-5 py-3 font-semibold text-[12px] uppercase tracking-wider w-24 text-right">Machines</th>
              <th className="px-5 py-3 font-semibold text-[12px] uppercase tracking-wider w-20 text-right">Cases</th>
            </tr>
          </thead>
          <tbody>
            {(customers ?? []).map((c) => (
              <tr key={c.code} className="border-b border-slate-100 hover:bg-slate-50 transition-colors">
                <td className="px-5 py-3 font-mono text-[12px] text-slate-500">{c.code}</td>
                <td className="px-5 py-3 font-medium text-slate-800">{c.name}</td>
                <td className="px-5 py-3 text-slate-600">{c.city ?? "—"}</td>
                <td className="px-5 py-3 text-slate-600">{c.country ?? "—"}</td>
                <td className="px-5 py-3 text-slate-600 truncate">{c.contact_name ?? "—"}</td>
                <td className="px-5 py-3 text-right tabular-nums font-medium">{machineMap.get(c.code) ?? 0}</td>
                <td className="px-5 py-3 text-right tabular-nums font-medium">{caseMap.get(c.code) ?? 0}</td>
              </tr>
            ))}
            {(customers ?? []).length === 0 && (
              <tr>
                <td colSpan={7} className="px-5 py-12 text-center text-slate-400 text-[13px]">No customers</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
