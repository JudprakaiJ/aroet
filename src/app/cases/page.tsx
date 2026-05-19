import { createClient } from "@/lib/supabase/server";
import Link from "next/link";
import { Avatar } from "@/components/avatar";
import { StatusPill } from "@/components/status-pill";
import { CodeBadge } from "@/components/code-badge";
import { Search, Plus, Building, Cube, Calendar, Star } from "@/components/icons";

export const dynamic = "force-dynamic";

type FilterKey = "all" | "active" | "overdue" | "pm" | "curative";

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

function fmtDueShort(d?: string | null) {
  if (!d) return "—";
  return new Date(d).toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

function extractProjectCode(title: string | null): string | null {
  if (!title) return null;
  const match = title.match(/\b([A-Z]{2,5}\d{1,3})\b/);
  return match ? match[1] : null;
}

export default async function CasesPage({
  searchParams,
}: {
  searchParams: Promise<{ filter?: FilterKey; q?: string }>;
}) {
  const { filter = "all", q = "" } = await searchParams;
  const supabase = await createClient();
  const today = new Date().toISOString().split("T")[0];

  let query = supabase
    .from("cases")
    .select(
      "so_number, source, status, service_type_code, service_type_name, customer_name, machine_no, due_date, title"
    );

  if (filter === "active") {
    query = query.in("status", ["planned", "in_progress"]);
  } else if (filter === "overdue") {
    query = query.in("status", ["planned", "in_progress"]).lt("due_date", today);
  } else if (filter === "pm") {
    query = query.eq("service_type_code", "7507");
  } else if (filter === "curative") {
    query = query.in("service_type_code", ["7505", "7515"]);
  }

  if (q) {
    query = query.or(
      `so_number.ilike.%${q}%,customer_name.ilike.%${q}%,machine_no.ilike.%${q}%,title.ilike.%${q}%`
    );
  }

  const { data: cases, error } = await query
    .order("created_at", { ascending: false })
    .limit(50);

  const soNumbers = (cases ?? []).map((c) => c.so_number);
  const { data: engineerAssignments } =
    soNumbers.length > 0
      ? await supabase
          .from("case_engineers")
          .select("so_number, engineer_code, is_lead")
          .in("so_number", soNumbers)
      : { data: [] };

  const engMap = new Map<string, { lead?: string; others: string[] }>();
  for (const a of engineerAssignments ?? []) {
    if (!engMap.has(a.so_number)) engMap.set(a.so_number, { others: [] });
    const entry = engMap.get(a.so_number)!;
    if (a.is_lead) entry.lead = a.engineer_code;
    else entry.others.push(a.engineer_code);
  }

  const [allCount, activeCount, overdueCount, pmCount, curativeCount] = await Promise.all([
    supabase.from("cases").select("*", { count: "exact", head: true }),
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
      .select("*", { count: "exact", head: true })
      .eq("service_type_code", "7507"),
    supabase
      .from("cases")
      .select("*", { count: "exact", head: true })
      .in("service_type_code", ["7505", "7515"]),
  ]);

  if (error) {
    return (
      <div className="max-w-7xl mx-auto px-4 md:px-6 py-8">
        <div className="ar-card p-5 text-danger">Error: {error.message}</div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 md:px-6 py-5 md:py-8">
      {/* Header */}
      <div className="flex items-start justify-between gap-3 mb-3 md:mb-4">
        <div className="min-w-0">
          <h1 className="text-[22px] md:text-[28px] font-bold text-ink leading-tight m-0">Cases</h1>
          <p className="text-[12.5px] md:text-[13px] text-ink-3 mt-1 m-0">
            {(allCount.count ?? 0).toLocaleString()} total
            {" · "}
            {(activeCount.count ?? 0).toLocaleString()} active
            {" · "}
            <span className={overdueCount.count ? "text-red font-semibold" : ""}>
              {(overdueCount.count ?? 0).toLocaleString()} overdue
            </span>
          </p>
        </div>
        <Link
          href="/cases/new"
          className="ar-btn ar-btn-primary ar-btn-sm md:!min-h-[44px] md:!px-4 shrink-0"
        >
          <Plus size={16} strokeWidth={2.4} />
          <span className="hidden sm:inline">New case</span>
        </Link>
      </div>

      {/* Search + filters */}
      <form className="mb-4 md:mb-5">
        <div className="relative mb-3">
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-ink-4 pointer-events-none">
            <Search size={16} />
          </span>
          <input
            name="q"
            defaultValue={q}
            placeholder="Search SO, customer, machine, title…"
            className="ar-field !pl-10"
          />
          {filter !== "all" && <input type="hidden" name="filter" value={filter} />}
        </div>

        <div className="ar-chiprail -mx-1 px-1">
          <FilterChip
            href={`/cases${q ? `?q=${encodeURIComponent(q)}` : ""}`}
            label="All"
            count={allCount.count}
            active={filter === "all"}
          />
          <FilterChip
            href={`/cases?filter=active${q ? `&q=${encodeURIComponent(q)}` : ""}`}
            label="Active"
            count={activeCount.count}
            active={filter === "active"}
          />
          <FilterChip
            href={`/cases?filter=overdue${q ? `&q=${encodeURIComponent(q)}` : ""}`}
            label="Overdue"
            count={overdueCount.count}
            active={filter === "overdue"}
          />
          <FilterChip
            href={`/cases?filter=pm${q ? `&q=${encodeURIComponent(q)}` : ""}`}
            label="PM"
            count={pmCount.count}
            active={filter === "pm"}
          />
          <FilterChip
            href={`/cases?filter=curative${q ? `&q=${encodeURIComponent(q)}` : ""}`}
            label="Curative"
            count={curativeCount.count}
            active={filter === "curative"}
          />
        </div>
      </form>

      {/* Result count */}
      <div className="flex items-center justify-between mb-3">
        <span className="ar-kicker">{(cases ?? []).length} result{(cases ?? []).length === 1 ? "" : "s"}</span>
        {(q || filter !== "all") && (
          <Link href="/cases" className="ar-btn ar-btn-ghost ar-btn-sm">
            Reset
          </Link>
        )}
      </div>

      {/* Case cards */}
      {(cases ?? []).length === 0 ? (
        <div className="ar-card py-16 text-center text-ink-4">
          <Search size={28} className="inline-block mb-3 text-ink-5" />
          <div className="text-[14px] font-medium text-ink-3 mb-1">No cases match</div>
          <div className="text-[12.5px]">
            {q ? `Nothing matches "${q}".` : "Try adjusting filters."}
          </div>
        </div>
      ) : (
        <div className="flex flex-col gap-2.5">
          {(cases ?? []).map((c) => {
            const isOverdue =
              c.status !== "completed" &&
              c.status !== "verified" &&
              c.due_date &&
              c.due_date < today;
            const engs = engMap.get(c.so_number) ?? { others: [] };
            const projectCode = extractProjectCode(c.title);
            const svc = shortService(c.service_type_name);
            return (
              <Link
                key={c.so_number}
                href={`/cases/${c.so_number}`}
                className="ar-card ar-card-hover block p-3.5 md:p-4"
                style={{
                  borderLeft: isOverdue ? "3px solid var(--color-red)" : undefined,
                }}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1.5 mb-1.5 flex-wrap">
                      <span
                        className="font-mono text-[14px] md:text-[15px] font-bold"
                        style={{ color: isOverdue ? "var(--color-red)" : "var(--color-ink)" }}
                      >
                        {c.so_number}
                      </span>
                      <StatusPill status={c.status} />
                      {isOverdue && <span className="ar-chip ar-chip-red">Overdue</span>}
                      {svc && <span className={`ar-chip ${svc.tone}`}>{svc.label}</span>}
                      {projectCode && <CodeBadge>{projectCode}</CodeBadge>}
                    </div>
                    <div className="text-[14px] md:text-[15px] font-semibold text-ink mb-1.5 truncate">
                      {c.title || c.machine_no || c.so_number}
                    </div>
                    <div className="text-[12.5px] text-ink-3 flex items-center gap-x-3 gap-y-1 flex-wrap">
                      {c.customer_name && (
                        <span className="inline-flex items-center gap-1 min-w-0">
                          <Building size={12} />
                          <span className="truncate max-w-[260px]">{c.customer_name}</span>
                        </span>
                      )}
                      {c.machine_no && (
                        <CodeBadge icon={<Cube size={11} />}>{c.machine_no}</CodeBadge>
                      )}
                      {c.due_date && (
                        <span className="inline-flex items-center gap-1 font-mono">
                          <Calendar size={11} />
                          {fmtDueShort(c.due_date)}
                        </span>
                      )}
                    </div>
                  </div>

                  {(engs.lead || engs.others.length > 0) && (
                    <div className="flex items-center -space-x-1.5 shrink-0">
                      {engs.lead && <LeadAvatar code={engs.lead} />}
                      {engs.others.slice(0, 3).map((code) => (
                        <span key={code} className="ring-2 ring-surface rounded-full">
                          <Avatar code={code} size={28} />
                        </span>
                      ))}
                      {engs.others.length > 3 && (
                        <span className="inline-flex items-center justify-center w-7 h-7 rounded-full text-[10px] font-semibold bg-surface-2 text-ink-3 ring-2 ring-surface">
                          +{engs.others.length - 3}
                        </span>
                      )}
                    </div>
                  )}
                </div>
              </Link>
            );
          })}
        </div>
      )}

      {(cases ?? []).length === 50 && (
        <div className="text-center text-[12.5px] text-ink-4 mt-5">
          Showing first 50 results · refine the search to narrow further.
        </div>
      )}
    </div>
  );
}

function FilterChip({
  href,
  label,
  count,
  active,
}: {
  href: string;
  label: string;
  count?: number | null;
  active?: boolean;
}) {
  return (
    <Link href={href} className="ar-fchip" data-on={active}>
      {label}
      {count !== null && count !== undefined && (
        <span className="ar-fchip-cnt">{count}</span>
      )}
    </Link>
  );
}

function LeadAvatar({ code }: { code: string }) {
  return (
    <span className="relative ring-2 ring-surface rounded-full">
      <Avatar code={code} size={28} />
      <span
        className="absolute -top-1 -right-1 w-3.5 h-3.5 rounded-full inline-flex items-center justify-center text-[8px]"
        style={{ background: "#FAEEDA", color: "#6B3D04" }}
        title="Lead"
      >
        <Star size={8} strokeWidth={2.4} />
      </span>
    </span>
  );
}
