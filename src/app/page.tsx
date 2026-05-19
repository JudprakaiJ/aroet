import { createClient } from "@/lib/supabase/server";
import Link from "next/link";
import { StatusPill } from "@/components/status-pill";
import { CodeBadge } from "@/components/code-badge";
import {
  Inbox,
  Plus,
  Folder,
  Clock,
  Calendar,
  Building,
  Cube,
  Chevron,
} from "@/components/icons";

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

function fmtDueShort(d?: string | null) {
  if (!d) return "—";
  return new Date(d).toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

function isoToday() {
  return new Date().toISOString().slice(0, 10);
}

function isoMonthsAgo(months: number) {
  const d = new Date();
  d.setMonth(d.getMonth() - months);
  return d.toISOString().slice(0, 10);
}

const SERVICE_SHORT: Record<string, string> = {
  "Preventive Maintenance": "PM",
  "Curative maintenance": "Curative",
  "Curative maintenance under Warranty": "Curative",
  "Installation": "Install",
  "Upgrade installation": "Upgrade",
  "Service Agreement": "SA",
  "Service Promotion": "Promo",
  "Customer Training": "Training",
  "Internal Training": "Training",
};

const SERVICE_CHIP_TONE: Record<string, string> = {
  PM: "bg-[#DDEBF7] text-[#185FA5] border-[#BFD6F0]",
  Curative: "bg-[#FBEAF0] text-[#993556] border-[#F0D0DC]",
  Install: "bg-[#EAF3DE] text-[#3B6D11] border-[#D6E5BD]",
  Upgrade: "bg-[#EEEDFE] text-[#5B21B6] border-[#DAD7F8]",
  SA: "bg-[#FAEEDA] text-[#6B3D04] border-[#EDD9B6]",
  Promo: "bg-[#FAEEDA] text-[#6B3D04] border-[#EDD9B6]",
  Training: "bg-[#FAEEDA] text-[#6B3D04] border-[#EDD9B6]",
};

function shortService(name?: string | null): { label: string; tone: string } | null {
  if (!name) return null;
  const label = SERVICE_SHORT[name] ?? name.split(" ")[0];
  const tone = SERVICE_CHIP_TONE[label] ?? "bg-surface-2 text-ink-3 border-line";
  return { label, tone };
}

export default async function Dashboard() {
  const supabase = await createClient();
  const today = isoToday();
  const oneMonthAgo = isoMonthsAgo(1);

  const [activeCases, overdueCases, recentCases, sessionStats, totalCases, pendingApproval] =
    await Promise.all([
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
        .select(
          "so_number, status, service_type_name, customer_name, machine_no, due_date, title"
        )
        .in("status", ["planned", "in_progress"])
        .order("due_date", { ascending: true, nullsFirst: false })
        .limit(6),
      supabase
        .from("sessions")
        .select("work_minutes, travel_minutes, office_minutes")
        .gte("session_date", oneMonthAgo),
      supabase.from("cases").select("*", { count: "exact", head: true }),
      supabase
        .from("sessions")
        .select("*", { count: "exact", head: true })
        .eq("approval_status", "submitted"),
    ]);

  let totalMin = 0;
  for (const s of sessionStats.data ?? []) {
    totalMin += (s.work_minutes ?? 0) + (s.travel_minutes ?? 0) + (s.office_minutes ?? 0);
  }
  const totalHours = Math.round(totalMin / 60);
  const pending = pendingApproval.count ?? 0;
  const overdue = overdueCases.count ?? 0;

  return (
    <div className="max-w-7xl mx-auto px-4 md:px-6 py-5 md:py-8">
      {/* Greeting */}
      <div className="flex items-start justify-between gap-3 mb-5 md:mb-7">
        <div className="min-w-0">
          <div className="ar-kicker mb-1">{fmtDateLong(today)}</div>
          <h1 className="text-[22px] md:text-[28px] font-bold text-ink leading-tight m-0">
            {greeting()}
          </h1>
        </div>
        <Link
          href="/cases/new"
          className="ar-btn ar-btn-primary ar-btn-sm md:!min-h-[44px] md:!px-4 shrink-0"
        >
          <Plus size={16} strokeWidth={2.4} />
          <span className="hidden sm:inline">New case</span>
        </Link>
      </div>

      {/* Pending approval banner (admin) */}
      {pending > 0 && (
        <Link
          href="/workforce?tab=queue"
          className="ar-card flex items-center gap-3 p-3 mb-4 md:mb-5"
          style={{ borderColor: "rgba(200,16,46,.28)", background: "var(--color-red-50)" }}
        >
          <div
            className="w-[38px] h-[38px] rounded-[10px] inline-flex items-center justify-center text-white shrink-0"
            style={{ background: "var(--color-red)" }}
          >
            <Inbox size={20} />
          </div>
          <div className="flex-1 min-w-0">
            <div className="text-[14px] font-semibold text-ink">
              {pending} session{pending === 1 ? "" : "s"} pending approval
            </div>
            <div className="text-[12px] text-ink-3">Review and approve in the workforce queue.</div>
          </div>
          <Chevron size={18} className="text-ink-3 shrink-0" />
        </Link>
      )}

      {/* Stats grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4 mb-5 md:mb-7">
        <StatCard label="Active cases" value={activeCases.count ?? 0} href="/cases?filter=active" />
        <StatCard
          label="Overdue"
          value={overdue}
          href="/cases?filter=overdue"
          accent={overdue > 0 ? "var(--color-red)" : undefined}
          subtitle={overdue ? "need attention" : "all on track"}
        />
        <StatCard
          label="Hours · 30d"
          value={`${totalHours}h`}
          href="/workforce?tab=hours"
          subtitle="logged activity"
        />
        <StatCard
          label="Pending"
          value={pending}
          href="/workforce?tab=queue"
          accent={pending > 0 ? "var(--color-warn)" : undefined}
          subtitle="sessions to review"
        />
      </div>

      {/* Main grid */}
      <div className="grid lg:grid-cols-3 gap-4 md:gap-5">
        {/* Upcoming cases */}
        <section className="ar-card p-4 md:p-5 lg:col-span-2">
          <div className="flex items-center justify-between mb-3 md:mb-4">
            <div>
              <h2 className="text-[15px] md:text-[16px] font-semibold text-ink m-0">Upcoming cases</h2>
              <p className="text-[12px] text-ink-3 mt-0.5 m-0">Sorted by due date</p>
            </div>
            <Link
              href="/cases"
              className="text-[12.5px] font-semibold hover:underline"
              style={{ color: "var(--color-red)" }}
            >
              View all →
            </Link>
          </div>

          {(recentCases.data ?? []).length === 0 ? (
            <div className="text-center py-10 text-ink-4 text-[13px]">No upcoming cases</div>
          ) : (
            <div className="flex flex-col gap-2">
              {(recentCases.data ?? []).map((c) => {
                const isOverdue = c.due_date && c.due_date < today;
                const svc = shortService(c.service_type_name);
                return (
                  <Link
                    key={c.so_number}
                    href={`/cases/${c.so_number}`}
                    className="block rounded-xl px-3 py-3 transition-colors hover:bg-hover"
                    style={{
                      background: isOverdue ? "var(--color-red-50)" : "var(--color-surface-2)",
                      borderLeft: isOverdue
                        ? "3px solid var(--color-red)"
                        : "3px solid transparent",
                    }}
                  >
                    <div className="flex items-center gap-2 mb-1 flex-wrap">
                      <span
                        className="font-mono text-[13px] font-semibold"
                        style={{ color: isOverdue ? "var(--color-red)" : "var(--color-ink)" }}
                      >
                        {c.so_number}
                      </span>
                      <StatusPill status={c.status} />
                      {isOverdue && (
                        <span className="ar-chip ar-chip-red">Overdue</span>
                      )}
                      {svc && (
                        <span className={`ar-chip ${svc.tone}`}>{svc.label}</span>
                      )}
                      {c.due_date && (
                        <span className="font-mono text-[11px] text-ink-3 ml-auto">
                          Due {fmtDueShort(c.due_date)}
                        </span>
                      )}
                    </div>
                    <div className="text-[14px] font-medium text-ink-2 truncate">
                      {c.title || c.machine_no || c.so_number}
                    </div>
                    <div className="text-[12px] text-ink-3 flex items-center gap-x-3 gap-y-1 flex-wrap mt-1">
                      {c.customer_name && (
                        <span className="inline-flex items-center gap-1">
                          <Building size={12} />
                          <span className="truncate max-w-[280px]">{c.customer_name}</span>
                        </span>
                      )}
                      {c.machine_no && (
                        <CodeBadge icon={<Cube size={11} />}>{c.machine_no}</CodeBadge>
                      )}
                    </div>
                  </Link>
                );
              })}
            </div>
          )}
        </section>

        {/* Quick actions */}
        <section className="ar-card p-4 md:p-5">
          <h2 className="text-[15px] md:text-[16px] font-semibold text-ink m-0">Quick actions</h2>
          <p className="text-[12px] text-ink-3 mt-0.5 mb-3 m-0">Common tasks</p>

          <div className="flex flex-col gap-2">
            <QuickLink
              href="/cases/new"
              icon={<Plus size={18} strokeWidth={2.4} />}
              iconBg="var(--color-red)"
              title="Create case"
              subtitle="SO + customer + machines"
            />
            <QuickLink
              href="/workforce"
              icon={<Calendar size={18} />}
              iconBg="#185FA5"
              title="Workforce"
              subtitle="Plan · Hours · Queue"
            />
            <QuickLink
              href="/cases"
              icon={<Folder size={18} />}
              iconBg="#3B6D11"
              title="Browse cases"
              subtitle={`All ${(totalCases.count ?? 0).toLocaleString()} cases`}
            />
            <QuickLink
              href="/engineers"
              icon={<Clock size={18} />}
              iconBg="#5B21B6"
              title="Team timesheet"
              subtitle="This month per engineer"
            />
          </div>
        </section>
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
      className="ar-card ar-card-hover block p-4 md:p-5"
    >
      <div className="text-[12px] md:text-[13px] text-ink-3 font-semibold uppercase tracking-wide mb-1.5">
        {label}
      </div>
      <div
        className="text-[26px] md:text-[32px] font-bold leading-none tnum"
        style={{ color: accent ?? "var(--color-ink)" }}
      >
        {typeof value === "number" ? value.toLocaleString() : value}
      </div>
      {subtitle && (
        <div className="text-[11.5px] text-ink-4 mt-1.5">{subtitle}</div>
      )}
    </Link>
  );
}

function QuickLink({
  href,
  icon,
  iconBg,
  title,
  subtitle,
}: {
  href: string;
  icon: React.ReactNode;
  iconBg: string;
  title: string;
  subtitle: string;
}) {
  return (
    <Link
      href={href}
      className="flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-hover transition-colors"
      style={{ background: "var(--color-surface-2)" }}
    >
      <div
        className="w-9 h-9 rounded-lg flex items-center justify-center text-white shrink-0"
        style={{ background: iconBg }}
      >
        {icon}
      </div>
      <div className="flex-1 min-w-0">
        <div className="text-[14px] font-semibold text-ink truncate">{title}</div>
        <div className="text-[12px] text-ink-3 truncate">{subtitle}</div>
      </div>
    </Link>
  );
}
