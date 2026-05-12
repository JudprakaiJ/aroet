import { createClient } from "@/lib/supabase/server";
import { fmtDate, fmtDateLong, statusBadge } from "@/lib/format";
import Link from "next/link";
import { notFound } from "next/navigation";

export const dynamic = "force-dynamic";

export default async function MachineDetail({
  params,
}: {
  params: Promise<{ machine_no: string }>;
}) {
  const { machine_no } = await params;
  const decoded = decodeURIComponent(machine_no);
  const supabase = await createClient();

  const { data: m, error } = await supabase.from("machines").select("*").eq("machine_no", decoded).single();
  if (error || !m) notFound();

  const { data: cases } = await supabase
    .from("cases")
    .select("so_number, status, service_type_name, service_type_code, due_date, close_date, customer_name")
    .eq("machine_no", decoded)
    .order("created_at", { ascending: false });

  const pmCount = (cases ?? []).filter((c) => c.service_type_code === "7507").length;
  const curativeCount = (cases ?? []).filter((c) => ["7505", "7515"].includes(c.service_type_code ?? "")).length;

  return (
    <div className="max-w-5xl mx-auto px-4 py-5">
      <div className="mb-3">
        <Link href="/machines" className="text-xs hover:underline" style={{ color: "#C8102E" }}>
          ← Machines
        </Link>
      </div>

      <div className="bg-white border border-slate-200 rounded-lg p-4 mb-4">
        <div className="flex items-start justify-between mb-3">
          <div>
            <h1 className="font-mono text-lg font-semibold">{m.machine_no}</h1>
            <p className="text-xs text-slate-500 mt-0.5">{m.name ?? "—"}</p>
          </div>
          {m.version && m.version !== "N/A" && (
            <span
              className="text-[11px] px-2 py-1 rounded font-medium"
              style={{ background: "#EDE9FE", color: "#5B21B6" }}
            >
              {m.version}
            </span>
          )}
          {!m.version && (
            <span className="text-[11px] px-2 py-1 rounded font-medium bg-amber-100 text-amber-800">
              Unknown version
            </span>
          )}
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-x-4 gap-y-2 text-xs">
          <div>
            <div className="text-slate-500 text-[10px] mb-0.5">Product code</div>
            <div className="font-mono">{m.product_code ?? "—"}</div>
          </div>
          <div>
            <div className="text-slate-500 text-[10px] mb-0.5">Serial</div>
            <div className="font-mono">{m.serial_no ?? "—"}</div>
          </div>
          <div>
            <div className="text-slate-500 text-[10px] mb-0.5">Customer</div>
            <div className="truncate">{m.customer_name ?? "—"}</div>
          </div>
          <div>
            <div className="text-slate-500 text-[10px] mb-0.5">Warranty</div>
            <div>{fmtDateLong(m.warranty_expiry)}</div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-3 mb-4">
        <div className="bg-white border border-slate-200 rounded-lg p-3">
          <div className="text-[10px] text-slate-500">Total cases</div>
          <div className="text-xl font-semibold mt-0.5">{cases?.length ?? 0}</div>
        </div>
        <div className="bg-white border border-slate-200 rounded-lg p-3">
          <div className="text-[10px] text-slate-500">PM</div>
          <div className="text-xl font-semibold mt-0.5">{pmCount}</div>
        </div>
        <div className="bg-white border border-slate-200 rounded-lg p-3">
          <div className="text-[10px] text-slate-500">Curative</div>
          <div className="text-xl font-semibold mt-0.5">{curativeCount}</div>
        </div>
      </div>

      <div className="bg-white border border-slate-200 rounded-lg overflow-hidden">
        <div className="px-4 py-2.5 border-b border-slate-200">
          <h2 className="text-sm font-semibold">Service history</h2>
        </div>
        {(cases?.length ?? 0) > 0 ? (
          <table className="w-full text-xs">
            <thead className="bg-slate-50 text-slate-600">
              <tr className="text-left">
                <th className="px-3 py-2 font-medium w-28">SO</th>
                <th className="px-3 py-2 font-medium w-24">Status</th>
                <th className="px-3 py-2 font-medium">Type</th>
                <th className="px-3 py-2 font-medium w-20">Due</th>
                <th className="px-3 py-2 font-medium w-20">Closed</th>
              </tr>
            </thead>
            <tbody>
              {(cases ?? []).map((c) => {
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
                    <td className="px-3 py-1.5 text-slate-500">{fmtDate(c.due_date)}</td>
                    <td className="px-3 py-1.5 text-slate-500">{fmtDate(c.close_date)}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        ) : (
          <div className="px-4 py-8 text-center text-xs text-slate-400">No service history.</div>
        )}
      </div>
    </div>
  );
}
