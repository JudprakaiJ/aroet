import { createClient } from "@/lib/supabase/server";
import Link from "next/link";

export const dynamic = "force-dynamic";

function greeting() {
  const h = new Date().getHours();
  if (h < 12) return "Good morning";
  if (h < 17) return "Good afternoon";
  return "Good evening";
}

function fmtDateLong(d?: string | null) {
  if (!d) return "—";
  return new Date(d).toLocaleDateString("en-US", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

function isoToday() {
  return new Date().toISOString().slice(0, 10);
}

function isoMonthsAgo(months: number) {
  const d = new Date();
  d.setMonth(d.getMonth() - months);
  return d.toISOString().slice(0, 10);
}

export default async function Dashboard() {
  const supabase = await createClient();
  const today = isoToday();
  const oneMonthAgo = isoMonthsAgo(1);

  const [activeCases, overdueCases, recentCases, sessionStats, totalCases] = await Promise.all([
    supabase
      .from("cases")
      .select("*", { count: "exact", head: true })
      .in("status", ["planned", "in_progress"]),
    supabase
      .from("cases")
      .select("*", { count: "exact", head: true })
      .in("status", ["planned", "in_progress"])
      .lt("due_date", today),
    supabase
      .from("cases")
      .select("so_number, status, service_type_name, customer_name, machine_no, due_date, title")
      .in("status", ["planned", "in_progress"])
      .order("due_date", { ascending: true, nullsFirst: false })
      .limit(6),
    supabase
      .from("sessions")
      .select("work_minutes, travel_minutes, office_minutes")
      .gte("session_date", oneMonthAgo),
    supabase.from("cases").select("*", { count: "exact", head: true }),
  ]);

  // Aggregate session stats
  let totalMin = 0;
  for (const s of sessionStats.data ?? []) {
    totalMin += (s.work_minutes ?? 0) + (s.travel_minutes ?? 0) + (s.office_minutes ?? 0);
  }
  const totalHours = Math.round(totalMin / 60);

  return (
    <div className="max-w-7xl mx-auto px-6 py-8">
      {/* Greeting header */}
      <div className="flex items-center justify-between mb-7">
        <div>
          <h1 className="text-[28px] font-bold text-slate-900 leading-tight">{greeting()}</h1>
          <p className="text-[14px] text-slate-500 mt-1">{fmtDateLong(today)}</p>
        </div>
        <div className="flex gap-2">
          <Link
            href="/cases/new"
            className="text-[14px] px-5 py-2.5 rounded-lg font-medium text-white inline-flex items-center gap-2"
            style={{ background: "#C8102E" }}
          >
            <span className="text-lg leading-none">+</span> New case
          </Link>
        </div>
      </div>

      {/* Stats cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-7">
        <StatCard label="Active cases" value={activeCases.count ?? 0} href="/cases" />
        <StatCard
          label="Overdue"
          value={overdueCases.count ?? 0}
          href="/cases?filter=overdue"
          accent="#C8102E"
          subtitle={overdueCases.count ? "need attention" : "all on track"}
        />
        <StatCard
          label="Hours last 30 days"
          value={`${totalHours}h`}
          href="/workforce"
          subtitle="logged activity"
        />
        <StatCard
          label="Pending approval"
          value={0}
          href="/workforce"
          accent="#BA7517"
          subtitle="sessions to review"
        />
      </div>

      {/* Main grid: upcoming + side widgets */}
      <div className="grid lg:grid-cols-3 gap-5">
        {/* Upcoming cases - 2/3 width */}
        <div className="lg:col-span-2 bg-white border border-slate-200 rounded-2xl p-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-[17px] font-semibold text-slate-900">Upcoming cases</h2>
              <p className="text-[13px] text-slate-500 mt-0.5">Sorted by due date</p>
            </div>
            <Link href="/cases" className="text-[13px] font-medium hover:underline" style={{ color: "#C8102E" }}>
              View all →
            </Link>
          </div>

          {(recentCases.data ?? []).length === 0 && (
            <div className="text-center py-10 text-slate-400 text-[13px]">No upcoming cases</div>
          )}

          {(recentCases.data ?? []).map((c, i) => {
            const isOverdue = c.due_date && c.due_date < today;
            return (
              <Link
                key={c.so_number}
                href={`/cases/${c.so_number}`}
                className="block rounded-xl px-4 py-3.5 mb-2 transition-colors"
                style={{
                  background: isOverdue ? "#FFF1F2" : "#FAFAF9",
                  borderLeft: isOverdue ? "3px solid #C8102E" : "3px solid transparent",
                }}
              >
                <div className="flex items-center justify-between mb-1">
                  <div className="flex items-center gap-2.5">
                    <span className="font-mono text-[14px] font-semibold" style={{ color: isOverdue ? "#C8102E" : "#1a1a1a" }}>
                      {c.so_number}
                    </span>
                    {isOverdue && (
                      <span
                        className="text-[11px] px-2 py-0.5 rounded-md font-semibold"
                        style={{ background: "#FCE8EB", color: "#C8102E" }}
                      >
                        Overdue
                      </span>
                    )}
                    {c.service_type_name && (
                      <span
                        className="text-[11px] px-2 py-0.5 rounded-md font-medium"
                        style={{ background: "#DDEBF7", color: "#185FA5" }}
                      >
                        {c.service_type_name.split(" ")[0]}
                      </span>
                    )}
                  </div>
                </div>
                <div className="text-[14px] font-medium text-slate-800 mb-1 line-clamp-1">
                  {c.title || c.machine_no || c.so_number}
                </div>
                <div className="text-[12px] text-slate-500 flex items-center gap-3 flex-wrap">
                  <span>{c.customer_name || "—"}</span>
                  {c.due_date && <span>Due {c.due_date}</span>}
                </div>
              </Link>
            );
          })}
        </div>

        {/* Side: Quick actions */}
        <div className="bg-white border border-slate-200 rounded-2xl p-6">
          <h2 className="text-[17px] font-semibold text-slate-900 mb-1">Quick actions</h2>
          <p className="text-[13px] text-slate-500 mb-4">Common tasks</p>

          <div className="flex flex-col gap-2">
            <Link
              href="/cases/new"
              className="flex items-center gap-3 px-3.5 py-3 rounded-xl hover:bg-slate-50 transition-colors"
              style={{ background: "#FAFAF9" }}
            >
              <div
                className="w-9 h-9 rounded-lg flex items-center justify-center text-white text-lg"
                style={{ background: "#C8102E" }}
              >
                +
              </div>
              <div className="flex-1 min-w-0">
                <div className="text-[14px] font-medium text-slate-900">Create case</div>
                <div className="text-[12px] text-slate-500">SO + customer + machines</div>
              </div>
            </Link>

            <Link
              href="/workforce"
              className="flex items-center gap-3 px-3.5 py-3 rounded-xl hover:bg-slate-50 transition-colors"
              style={{ background: "#FAFAF9" }}
            >
              <div
                className="w-9 h-9 rounded-lg flex items-center justify-center text-white text-base font-bold"
                style={{ background: "#185FA5" }}
              >
                ⏱
              </div>
              <div className="flex-1 min-w-0">
                <div className="text-[14px] font-medium text-slate-900">View workforce</div>
                <div className="text-[12px] text-slate-500">Timesheets &amp; approval</div>
              </div>
            </Link>

            <Link
              href="/cases"
              className="flex items-center gap-3 px-3.5 py-3 rounded-xl hover:bg-slate-50 transition-colors"
              style={{ background: "#FAFAF9" }}
            >
              <div
                className="w-9 h-9 rounded-lg flex items-center justify-center text-white text-base font-bold"
                style={{ background: "#3B6D11" }}
              >
                ⚙
              </div>
              <div className="flex-1 min-w-0">
                <div className="text-[14px] font-medium text-slate-900">Browse cases</div>
                <div className="text-[12px] text-slate-500">All {totalCases.count ?? 0} cases</div>
              </div>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}

function StatCard({
  label,
  value,
  href,
  accent,
  subtitle,
}: {
  label: string;
  value: number | string;
  href: string;
  accent?: string;
  subtitle?: string;
}) {
  return (
    <Link
      href={href}
      className="bg-white border border-slate-200 rounded-2xl p-5 hover:border-slate-300 transition-all card-hover block"
    >
      <div className="text-[13px] text-slate-500 font-medium mb-2">{label}</div>
      <div className="text-[32px] font-bold leading-none" style={{ color: accent || "#0f172a" }}>
        {typeof value === "number" ? value.toLocaleString() : value}
      </div>
      {subtitle && <div className="text-[12px] text-slate-400 mt-1.5">{subtitle}</div>}
    </Link>
  );
}
