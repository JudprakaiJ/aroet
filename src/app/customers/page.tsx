import { createClient } from "@/lib/supabase/server";

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
    <div className="max-w-7xl mx-auto px-4 py-5">
      <h1 className="text-lg font-semibold text-slate-900 mb-1">Customers</h1>
      <p className="text-xs text-slate-500 mb-3">{customers?.length ?? 0} customers</p>

      <div className="bg-white rounded-lg border border-slate-200 overflow-hidden">
        <table className="w-full text-xs">
          <thead className="bg-slate-50 text-slate-600 border-b border-slate-200">
            <tr className="text-left">
              <th className="px-3 py-2 font-medium w-16">Code</th>
              <th className="px-3 py-2 font-medium">Customer</th>
              <th className="px-3 py-2 font-medium w-32">City</th>
              <th className="px-3 py-2 font-medium w-24">Country</th>
              <th className="px-3 py-2 font-medium w-32">Contact</th>
              <th className="px-3 py-2 font-medium w-20 text-right">Machines</th>
              <th className="px-3 py-2 font-medium w-20 text-right">Cases</th>
            </tr>
          </thead>
          <tbody>
            {(customers ?? []).map((c) => (
              <tr key={c.code} className="border-b border-slate-100 hover:bg-slate-50">
                <td className="px-3 py-1.5 font-mono text-[10px]">{c.code}</td>
                <td className="px-3 py-1.5 truncate max-w-md">{c.name}</td>
                <td className="px-3 py-1.5 text-slate-600">{c.city ?? "—"}</td>
                <td className="px-3 py-1.5 text-slate-600">{c.country ?? "—"}</td>
                <td className="px-3 py-1.5 text-slate-600 truncate">{c.contact_name ?? "—"}</td>
                <td className="px-3 py-1.5 text-right tabular-nums">{machineMap.get(c.code) ?? 0}</td>
                <td className="px-3 py-1.5 text-right tabular-nums">{caseMap.get(c.code) ?? 0}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
