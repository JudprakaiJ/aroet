import { createClient } from "@/lib/supabase/server";
import { fmtTime } from "@/lib/format";

export const dynamic = "force-dynamic";

export default async function EngineersPage() {
  const supabase = await createClient();

  const { data: engineers, error } = await supabase
    .from("engineers")
    .select("code, full_name, role, is_active")
    .order("role", { ascending: false })
    .order("code");

  if (error) return <div className="p-6 text-red-600">Error: {error.message}</div>;

  const monthStart = new Date();
  monthStart.setDate(1);
  monthStart.setHours(0, 0, 0, 0);

  const { data: sessions } = await supabase
    .from("sessions")
    .select("engineer_code, travel_minutes, work_minutes, office_minutes, so_number, session_date, is_weekend")
    .gte("session_date", monthStart.toISOString().split("T")[0]);

  const totals = new Map<string, { travel: number; work: number; office: number; weekend: number; sos: Set<string> }>();
  (sessions ?? []).forEach((s) => {
    const t = totals.get(s.engineer_code) ?? {
      travel: 0,
      work: 0,
      office: 0,
      weekend: 0,
      sos: new Set<string>(),
    };
    t.travel += s.travel_minutes ?? 0;
    t.work += s.work_minutes ?? 0;
    t.office += s.office_minutes ?? 0;
    if (s.is_weekend) t.weekend += (s.work_minutes ?? 0) + (s.travel_minutes ?? 0);
    if (s.so_number) t.sos.add(s.so_number);
    totals.set(s.engineer_code, t);
  });

  const monthLabel = new Date().toLocaleDateString("en-GB", { month: "long", year: "numeric" });

  return (
    <div className="max-w-5xl mx-auto px-4 py-5">
      <h1 className="text-lg font-semibold text-slate-900 mb-1">Team</h1>
      <p className="text-xs text-slate-500 mb-3">Timesheet · {monthLabel}</p>

      <div className="bg-white rounded-lg border border-slate-200 overflow-hidden">
        <table className="w-full text-xs">
          <thead className="bg-slate-50 text-slate-600 border-b border-slate-200">
            <tr className="text-left">
              <th className="px-3 py-2 font-medium w-16">Code</th>
              <th className="px-3 py-2 font-medium">Name</th>
              <th className="px-3 py-2 font-medium w-20">Role</th>
              <th className="px-3 py-2 font-medium w-14 text-right">SOs</th>
              <th className="px-3 py-2 font-medium w-20 text-right">Travel</th>
              <th className="px-3 py-2 font-medium w-20 text-right">Work</th>
              <th className="px-3 py-2 font-medium w-20 text-right">Office</th>
              <th className="px-3 py-2 font-medium w-20 text-right">Weekend</th>
            </tr>
          </thead>
          <tbody>
            {(engineers ?? []).map((e) => {
              const t = totals.get(e.code);
              return (
                <tr key={e.code} className="border-b border-slate-100 hover:bg-slate-50">
                  <td className="px-3 py-1.5">
                    <span
                      className="font-mono text-[10px] px-1.5 py-0.5 rounded font-medium"
                      style={
                        e.role === "admin"
                          ? { background: "#FEE2E5", color: "#C8102E" }
                          : { background: "#F1F5F9", color: "#475569" }
                      }
                    >
                      {e.code}
                    </span>
                  </td>
                  <td className="px-3 py-1.5">{e.full_name}</td>
                  <td className="px-3 py-1.5 text-slate-500 capitalize">{e.role}</td>
                  <td className="px-3 py-1.5 text-right tabular-nums">{t?.sos.size ?? 0}</td>
                  <td className="px-3 py-1.5 text-right tabular-nums">{fmtTime(t?.travel ?? 0)}</td>
                  <td className="px-3 py-1.5 text-right tabular-nums">{fmtTime(t?.work ?? 0)}</td>
                  <td className="px-3 py-1.5 text-right tabular-nums text-slate-500">{fmtTime(t?.office ?? 0)}</td>
                  <td
                    className="px-3 py-1.5 text-right tabular-nums"
                    style={{ color: t?.weekend ? "#92400E" : undefined }}
                  >
                    {fmtTime(t?.weekend ?? 0)}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      <p className="text-[10px] text-slate-400 mt-3">
        Hours calculated from sessions in {monthLabel}. Weekend = Sat/Sun work + travel (potentially holiday rate).
      </p>
    </div>
  );
}
