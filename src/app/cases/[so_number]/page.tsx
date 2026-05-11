import { createClient } from "@/lib/supabase/server";
import {
  fmtDate,
  fmtDateLong,
  fmtDay,
  fmtTime,
  statusBadge,
  activityBadge,
  referenceTypeBadge,
  adminEventLabel,
} from "@/lib/format";
import Link from "next/link";
import { notFound } from "next/navigation";
import CaseTabs from "./tabs";
import ReparseButton from "./reparse-button";

export default async function CaseDetail({
  params,
  searchParams,
}: {
  params: Promise<{ so_number: string }>;
  searchParams: Promise<{ tab?: string }>;
}) {
  const { so_number } = await params;
  const { tab = "sessions" } = await searchParams;
  const supabase = await createClient();

  const { data: c, error } = await supabase
    .from("cases")
    .select("*")
    .eq("so_number", so_number)
    .single();

  if (error || !c) notFound();

  const [machineRes, engineersRes, sessionsRes, referencesRes, adminLogRes, allMachinesRes] = await Promise.all([
    c.machine_no
      ? supabase.from("machines").select("*").eq("machine_no", c.machine_no).single()
      : Promise.resolve({ data: null }),
    supabase
      .from("case_engineers")
      .select("engineer_code, is_lead, engineers(full_name, role)")
      .eq("so_number", so_number),
    supabase
      .from("sessions")
      .select("*")
      .eq("so_number", so_number)
      .order("session_date", { ascending: true })
      .order("engineer_code", { ascending: true }),
    supabase
      .from("case_references")
      .select("*")
      .eq("so_number", so_number)
      .order("recorded_at", { ascending: true }),
    supabase
      .from("admin_log")
      .select("*")
      .eq("so_number", so_number)
      .order("event_date", { ascending: false, nullsFirst: false }),
    supabase
      .from("machines")
      .select("machine_no, name, product_code, version")
      .eq("is_active", true)
      .order("machine_no"),
  ]);

  const machine = machineRes.data;
  const engineers = (engineersRes.data ?? []) as any[];
  const sessions = (sessionsRes.data ?? []) as any[];
  const references = (referencesRes.data ?? []) as any[];
  const adminLog = (adminLogRes.data ?? []) as any[];
  const allMachines = allMachinesRes.data ?? [];

  // Totals
  const totals = sessions.reduce(
    (a, s) => ({
      travel: a.travel + (s.travel_minutes ?? 0),
      work: a.work + (s.work_minutes ?? 0),
      office: a.office + (s.office_minutes ?? 0),
    }),
    { travel: 0, work: 0, office: 0 }
  );

  const parsedCount = sessions.filter((s) => s.source === "planner").length;
  const manualCount = sessions.filter((s) => s.source === "manual").length;

  // Group sessions by date
  const sessionsByDate = new Map<string, any[]>();
  for (const s of sessions) {
    const list = sessionsByDate.get(s.session_date) ?? [];
    list.push(s);
    sessionsByDate.set(s.session_date, list);
  }
  const sortedDates = Array.from(sessionsByDate.keys()).sort();

  const s = statusBadge[c.status] ?? { bg: "#F1F5F9", text: "#64748B", label: c.status };

  return (
    <div className="max-w-5xl mx-auto px-4 py-5">
      <div className="mb-3">
        <Link href="/cases" className="text-xs hover:underline" style={{ color: "#C8102E" }}>
          ← Cases
        </Link>
      </div>

      {/* Header */}
      <div className="bg-white border border-slate-200 rounded-lg p-4 mb-4">
        <div className="flex items-start justify-between gap-3 mb-3 flex-wrap">
          <div className="flex items-center gap-2 flex-wrap">
            <h1 className="font-mono text-lg font-semibold">{c.so_number}</h1>
            <span
              className="text-[10px] px-1.5 py-0.5 rounded font-medium"
              style={{ background: s.bg, color: s.text }}
            >
              {s.label}
            </span>
            {c.source === "aroet" && (
              <span className="text-[10px] bg-purple-100 text-purple-700 px-1.5 py-0.5 rounded font-medium">
                AROET
              </span>
            )}
            {c.is_locked && (
              <span className="text-[10px] bg-red-100 text-red-700 px-1.5 py-0.5 rounded">🔒 Locked</span>
            )}
            <span className="text-xs text-slate-500">
              {c.service_type_code} · {c.service_type_name}
            </span>
          </div>
        </div>

        {c.title && (
          <div className="bg-slate-50 rounded p-2.5 text-sm text-slate-700 mb-3">{c.title}</div>
        )}

        <div className="grid grid-cols-2 md:grid-cols-4 gap-x-4 gap-y-2 text-xs">
          <div>
            <div className="text-slate-500 text-[10px] mb-0.5">Customer</div>
            <div className="font-medium truncate">{c.customer_name ?? "—"}</div>
          </div>
          <div>
            <div className="text-slate-500 text-[10px] mb-0.5">Contact</div>
            <div className="font-medium truncate">{c.contact_name ?? "—"}</div>
          </div>
          <div>
            <div className="text-slate-500 text-[10px] mb-0.5">Due</div>
            <div className="font-medium">{fmtDateLong(c.due_date)}</div>
          </div>
          <div>
            <div className="text-slate-500 text-[10px] mb-0.5">PO</div>
            <div className="font-medium truncate">{c.customer_po ?? "—"}</div>
          </div>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-4 gap-3 mb-4">
        <div className="bg-white border border-slate-200 rounded-lg p-3">
          <div className="text-[10px] text-slate-500">Sessions</div>
          <div className="text-xl font-semibold mt-0.5">{sessions.length}</div>
        </div>
        <div className="bg-white border border-slate-200 rounded-lg p-3">
          <div className="text-[10px] text-slate-500">Travel</div>
          <div className="text-xl font-semibold mt-0.5">{fmtTime(totals.travel)}</div>
        </div>
        <div className="bg-white border border-slate-200 rounded-lg p-3">
          <div className="text-[10px] text-slate-500">Work</div>
          <div className="text-xl font-semibold mt-0.5">{fmtTime(totals.work)}</div>
        </div>
        <div className="bg-white border border-slate-200 rounded-lg p-3">
          <div className="text-[10px] text-slate-500">Engineers</div>
          <div className="text-xl font-semibold mt-0.5">{engineers.length}</div>
        </div>
      </div>

      {/* Re-parse banner */}
      {(parsedCount > 0 || c.planner_note) && (
        <div className="bg-green-50 border border-green-200 rounded-md p-3 mb-3 flex items-center justify-between">
          <div className="text-xs text-green-900">
            <strong>🪄 {parsedCount} sessions parsed</strong>
            {manualCount > 0 && ` · ${manualCount} manual`}
            {references.length > 0 && ` · ${references.length} references`}
            {adminLog.length > 0 && ` · ${adminLog.length} admin events`}
          </div>
          {c.planner_note && (
            <ReparseButton so_number={so_number} hasParsed={parsedCount > 0} />
          )}
        </div>
      )}

      {/* Tabs */}
      <CaseTabs
        so_number={so_number}
        activeTab={tab}
        counts={{
          sessions: sessions.length,
          references: references.length,
          admin_log: adminLog.length,
          machines: machine ? 1 : 0,
        }}
      />

      {/* Tab content */}
      <div className="mt-4">
        {tab === "sessions" && (
          <SessionsTab
            sessions={sessions}
            sortedDates={sortedDates}
            sessionsByDate={sessionsByDate}
            so_number={so_number}
          />
        )}
        {tab === "references" && <ReferencesTab references={references} />}
        {tab === "admin" && <AdminLogTab adminLog={adminLog} />}
        {tab === "machines" && <MachinesTab machine={machine} />}
        {tab === "engineers" && <EngineersTab engineers={engineers} />}
        {tab === "planner" && <PlannerNoteTab plannerNote={c.planner_note} />}
      </div>
    </div>
  );
}

function SessionsTab({ sessions, sortedDates, sessionsByDate, so_number }: any) {
  if (sessions.length === 0) {
    return (
      <div className="bg-white border border-slate-200 rounded-lg p-8 text-center text-sm text-slate-400">
        No sessions yet. Sessions parsed from Planner Note appear here automatically.
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {sortedDates.map((date: string) => {
        const daySessions = sessionsByDate.get(date) ?? [];
        const dayTravel = daySessions.reduce((a: number, s: any) => a + (s.travel_minutes ?? 0), 0);
        const dayWork = daySessions.reduce((a: number, s: any) => a + (s.work_minutes ?? 0), 0);

        return (
          <div key={date}>
            <div className="text-xs font-medium text-slate-600 mb-2 flex items-center gap-2">
              <span>{fmtDay(date)}</span>
              <span className="text-[10px] text-slate-400 font-normal">
                · {daySessions.length} engineer{daySessions.length > 1 ? "s" : ""} · {fmtTime(dayTravel)} travel · {fmtTime(dayWork)} work
              </span>
            </div>
            <div className="space-y-1.5">
              {daySessions.map((s: any) => (
                <SessionCard key={s.id} session={s} so_number={so_number} />
              ))}
            </div>
          </div>
        );
      })}
    </div>
  );
}

function SessionCard({ session, so_number }: any) {
  const isManual = session.source === "manual";
  const isSwitch = !!session.switched_to_so;
  const hasWarning = !!session.parse_warning;
  const activity = activityBadge[session.activity_type] ?? activityBadge.field;

  return (
    <div
      className="bg-white border rounded-md p-3"
      style={{
        borderColor: isSwitch ? "#F0997B" : isManual ? "#CECBF6" : "#E2E8F0",
        borderStyle: isManual ? "dashed" : "solid",
      }}
    >
      <div className="flex items-start gap-3">
        <div
          className="w-7 h-7 rounded-full flex items-center justify-center text-[10px] font-medium flex-shrink-0"
          style={{ background: "#E6F1FB", color: "#185FA5" }}
        >
          {session.engineer_code}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1.5 flex-wrap mb-1">
            <span
              className="text-[10px] px-1.5 py-0.5 rounded font-medium"
              style={{ background: activity.bg, color: activity.text }}
            >
              {activity.icon} {activity.label}
            </span>
            {session.travel_minutes > 0 && (
              <span className="text-[10px] bg-slate-100 text-slate-600 px-1.5 py-0.5 rounded">
                T {fmtTime(session.travel_minutes)}
              </span>
            )}
            {session.break_minutes > 0 && (
              <span className="text-[10px] bg-pink-50 text-pink-700 px-1.5 py-0.5 rounded">
                B {fmtTime(session.break_minutes)}
              </span>
            )}
            {session.work_minutes > 0 && (
              <span className="text-[10px] bg-blue-50 text-blue-700 px-1.5 py-0.5 rounded">
                W {fmtTime(session.work_minutes)}
              </span>
            )}
            {session.office_minutes > 0 && (
              <span className="text-[10px] bg-slate-100 text-slate-600 px-1.5 py-0.5 rounded">
                AR {fmtTime(session.office_minutes)}
              </span>
            )}
            {session.is_weekend && (
              <span className="text-[10px] bg-amber-50 text-amber-700 px-1.5 py-0.5 rounded">
                Weekend
              </span>
            )}
            {isManual ? (
              <span className="text-[10px] bg-purple-100 text-purple-700 px-1.5 py-0.5 rounded">
                ✋ manual
              </span>
            ) : (
              <span className="text-[10px] bg-green-100 text-green-700 px-1.5 py-0.5 rounded">
                🪄 parsed
              </span>
            )}
          </div>

          {isSwitch && (
            <div className="text-[11px] text-amber-700 mb-1">
              🔄 Switched to{" "}
              <Link href={`/cases/${session.switched_to_so}`} className="underline">
                {session.switched_to_so}
              </Link>{" "}
              mid-day
            </div>
          )}

          {hasWarning && (
            <div className="text-[11px] text-amber-700 mb-1">
              ⚠ {session.parse_warning}
            </div>
          )}

          {session.work_done && (
            <div className="text-xs text-slate-600 whitespace-pre-wrap">{session.work_done}</div>
          )}
        </div>
      </div>
    </div>
  );
}

function ReferencesTab({ references }: any) {
  if (references.length === 0) {
    return (
      <div className="bg-white border border-slate-200 rounded-lg p-8 text-center text-sm text-slate-400">
        No references yet. CS, GI, GT, Invoice numbers from planner appear here.
      </div>
    );
  }

  return (
    <div className="space-y-1.5">
      {references.map((r: any) => {
        const badge = referenceTypeBadge[r.type] ?? referenceTypeBadge.OTHER;
        return (
          <div key={r.id} className="bg-white border border-slate-200 rounded-md p-3">
            <div className="flex items-center gap-2.5">
              <span
                className="text-[10px] px-2 py-0.5 rounded font-medium"
                style={{ background: badge.bg, color: badge.text }}
              >
                {badge.label}
              </span>
              <span className="font-mono text-sm font-medium">{r.reference_no}</span>
              {r.status && (
                <span className="text-[10px] bg-green-100 text-green-700 px-1.5 py-0.5 rounded">
                  {r.status}
                </span>
              )}
              {r.source === "planner" && (
                <span className="text-[10px] bg-green-50 text-green-700 px-1.5 py-0.5 rounded ml-auto">
                  🪄 parsed
                </span>
              )}
            </div>
            {r.description && <div className="text-xs text-slate-600 mt-1">{r.description}</div>}
          </div>
        );
      })}
    </div>
  );
}

function AdminLogTab({ adminLog }: any) {
  if (adminLog.length === 0) {
    return (
      <div className="bg-white border border-slate-200 rounded-lg p-8 text-center text-sm text-slate-400">
        No admin events yet. Invoice, RS Report, Acceptance events appear here.
      </div>
    );
  }

  return (
    <div className="space-y-1.5">
      {adminLog.map((l: any) => (
        <div key={l.id} className="bg-white border border-slate-200 rounded-md p-3">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-xs font-medium">{adminEventLabel[l.event_type] || l.event_type}</span>
            {l.event_date && <span className="text-[11px] text-slate-500">· {fmtDate(l.event_date)}</span>}
            {l.by_engineer && (
              <span className="text-[11px] font-mono text-slate-500">· {l.by_engineer}</span>
            )}
            {l.source === "planner" && (
              <span className="text-[10px] bg-green-50 text-green-700 px-1.5 py-0.5 rounded ml-auto">
                🪄 parsed
              </span>
            )}
          </div>
          {l.description && (
            <div className="text-xs text-slate-600 mt-1 truncate">{l.description}</div>
          )}
        </div>
      ))}
    </div>
  );
}

function MachinesTab({ machine }: any) {
  if (!machine) {
    return (
      <div className="bg-white border border-slate-200 rounded-lg p-8 text-center text-sm text-slate-400">
        No machine assigned to this case.
      </div>
    );
  }

  return (
    <div className="bg-white border border-slate-200 rounded-lg p-4">
      <div className="flex items-center justify-between mb-3">
        <h2 className="text-sm font-semibold">{machine.machine_no}</h2>
        <Link
          href={`/machines/${encodeURIComponent(machine.machine_no)}`}
          className="text-[11px] hover:underline"
          style={{ color: "#C8102E" }}
        >
          View history →
        </Link>
      </div>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-x-4 gap-y-2 text-xs">
        <div>
          <div className="text-slate-500 text-[10px] mb-0.5">Product</div>
          <div className="font-mono">{machine.product_code ?? "—"}</div>
        </div>
        <div>
          <div className="text-slate-500 text-[10px] mb-0.5">Version</div>
          <div>{machine.version ?? "—"}</div>
        </div>
        <div>
          <div className="text-slate-500 text-[10px] mb-0.5">Serial</div>
          <div className="font-mono">{machine.serial_no ?? "—"}</div>
        </div>
        <div>
          <div className="text-slate-500 text-[10px] mb-0.5">Warranty</div>
          <div>{fmtDateLong(machine.warranty_expiry)}</div>
        </div>
      </div>
    </div>
  );
}

function EngineersTab({ engineers }: any) {
  if (engineers.length === 0) {
    return (
      <div className="bg-white border border-slate-200 rounded-lg p-8 text-center text-sm text-slate-400">
        No engineers assigned.
      </div>
    );
  }

  return (
    <div className="bg-white border border-slate-200 rounded-lg p-4">
      <div className="flex flex-wrap gap-2">
        {engineers.map((e: any) => (
          <span key={e.engineer_code} className="bg-slate-100 px-3 py-1 rounded text-xs">
            <strong className="font-mono">{e.engineer_code}</strong>
            {e.engineers?.full_name && (
              <span className="text-slate-500 ml-1">— {e.engineers.full_name}</span>
            )}
            {e.is_lead && <span className="ml-2 text-[10px]" style={{ color: "#C8102E" }}>★ lead</span>}
          </span>
        ))}
      </div>
    </div>
  );
}

function PlannerNoteTab({ plannerNote }: any) {
  if (!plannerNote) {
    return (
      <div className="bg-white border border-slate-200 rounded-lg p-8 text-center text-sm text-slate-400">
        No planner note for this case.
      </div>
    );
  }

  return (
    <div className="bg-white border border-slate-200 rounded-lg p-4">
      <pre className="text-xs whitespace-pre-wrap font-mono text-slate-700">{plannerNote}</pre>
    </div>
  );
}
