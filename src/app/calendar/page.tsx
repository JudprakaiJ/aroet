import { createClient } from "@/lib/supabase/server";
import { statusBadge } from "@/lib/format";
import Link from "next/link";

export default async function CalendarPage({
  searchParams,
}: {
  searchParams: Promise<{ y?: string; m?: string }>;
}) {
  const { y, m } = await searchParams;
  const now = new Date();
  const year = y ? parseInt(y) : now.getFullYear();
  const month = m ? parseInt(m) - 1 : now.getMonth();

  const monthStart = new Date(year, month, 1);
  const monthEnd = new Date(year, month + 1, 0);

  const supabase = await createClient();

  const { data: cases } = await supabase
    .from("cases")
    .select("so_number, status, customer_name, machine_no, due_date, service_type_code")
    .gte("due_date", monthStart.toISOString().split("T")[0])
    .lte("due_date", monthEnd.toISOString().split("T")[0])
    .in("status", ["planned", "in_progress"])
    .order("due_date", { ascending: true });

  // Build day grid
  const casesByDay = new Map<string, any[]>();
  (cases ?? []).forEach((c) => {
    if (!c.due_date) return;
    const list = casesByDay.get(c.due_date) ?? [];
    list.push(c);
    casesByDay.set(c.due_date, list);
  });

  // Calendar cells — start on Monday
  const firstDayOfWeek = (monthStart.getDay() + 6) % 7; // Mon=0..Sun=6
  const daysInMonth = monthEnd.getDate();
  const cells: ({ date: string; day: number; isCurrentMonth: boolean } | null)[] = [];

  // Padding before
  for (let i = 0; i < firstDayOfWeek; i++) cells.push(null);

  for (let d = 1; d <= daysInMonth; d++) {
    const dateStr = new Date(year, month, d).toISOString().split("T")[0];
    cells.push({ date: dateStr, day: d, isCurrentMonth: true });
  }

  // Pad to multiple of 7
  while (cells.length % 7 !== 0) cells.push(null);

  const monthLabel = monthStart.toLocaleDateString("en-GB", { month: "long", year: "numeric" });
  const prevMonth = new Date(year, month - 1, 1);
  const nextMonth = new Date(year, month + 1, 1);
  const today = new Date().toISOString().split("T")[0];

  return (
    <div className="max-w-7xl mx-auto px-4 py-5">
      <div className="flex items-center justify-between mb-3">
        <div>
          <h1 className="text-lg font-semibold text-slate-900">Calendar</h1>
          <p className="text-xs text-slate-500">{cases?.length ?? 0} cases due in {monthLabel}</p>
        </div>
        <div className="flex items-center gap-2">
          <Link
            href={`/calendar?y=${prevMonth.getFullYear()}&m=${prevMonth.getMonth() + 1}`}
            className="text-xs px-3 py-1.5 rounded border border-slate-300"
          >
            ← Prev
          </Link>
          <span className="text-sm font-medium px-3">{monthLabel}</span>
          <Link
            href={`/calendar?y=${nextMonth.getFullYear()}&m=${nextMonth.getMonth() + 1}`}
            className="text-xs px-3 py-1.5 rounded border border-slate-300"
          >
            Next →
          </Link>
        </div>
      </div>

      <div className="bg-white border border-slate-200 rounded-lg overflow-hidden">
        <div className="grid grid-cols-7 bg-slate-50 border-b border-slate-200">
          {["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"].map((d) => (
            <div key={d} className="px-2 py-1.5 text-[10px] font-medium text-slate-600 text-center">
              {d}
            </div>
          ))}
        </div>
        <div className="grid grid-cols-7">
          {cells.map((cell, idx) => {
            if (!cell) {
              return <div key={idx} className="min-h-[80px] border-r border-b border-slate-100 bg-slate-50/50"></div>;
            }
            const dayCases = casesByDay.get(cell.date) ?? [];
            const isToday = cell.date === today;
            const dow = new Date(cell.date).getDay();
            const isWeekend = dow === 0 || dow === 6;

            return (
              <div
                key={idx}
                className="min-h-[80px] border-r border-b border-slate-100 p-1"
                style={{ background: isWeekend ? "#FAFAFA" : "white" }}
              >
                <div
                  className="text-[10px] font-medium mb-1"
                  style={isToday ? { color: "#C8102E", fontWeight: 700 } : { color: "#475569" }}
                >
                  {isToday ? `${cell.day} •` : cell.day}
                </div>
                <div className="space-y-0.5">
                  {dayCases.slice(0, 3).map((c) => {
                    const s = statusBadge[c.status];
                    return (
                      <Link
                        key={c.so_number}
                        href={`/cases/${c.so_number}`}
                        className="block text-[9px] px-1 py-0.5 rounded truncate hover:underline"
                        style={{ background: s?.bg, color: s?.text }}
                        title={`${c.so_number} — ${c.customer_name}`}
                      >
                        {c.machine_no ?? c.so_number.replace("SO", "")}
                      </Link>
                    );
                  })}
                  {dayCases.length > 3 && (
                    <div className="text-[9px] text-slate-500 px-1">+ {dayCases.length - 3} more</div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
