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
import AddSessionButton from "./add-session";

export const dynamic = "force-dynamic";

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

  const [machineRes, engineersRes, sessionsRes, referencesRes, adminLogRes, allMachinesRes, activeEngineersRes, caseMachinesRes] = await Promise.all([
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
      .order("machine_no"),
    supabase
      .from("engineers")
      .select("code, full_name, role")
      .eq("is_active", true)
      .order("code"),
    supabase
      .from("case_machines")
      .select("machine_no, is_primary")
      .eq("so_number", so_number),
  ]);

  const machine = machineRes.data;
  const engineers = (engineersRes.data ?? []) as any[];
  const sessions = (sessionsRes.data ?? []) as any[];
  const references = (referencesRes.data ?? []) as any[];
  const adminLog = (adminLogRes.data ?? []) as any[];
  const allMachines = allMachinesRes.data ?? [];
  const activeEngineers = (activeEngineersRes.data ?? []) as any[];
  const caseMachines = (caseMachinesRes.data ?? []) as any[];

  // Build machines for this case (junction + legacy single)
  const caseMachineList: { machine_no: string; is_primary?: boolean }[] = [];
  if (caseMachines.length > 0) {
    caseMachines.forEach((m) => caseMachineList.push({ machine_no: m.machine_no, is_primary: m.is_primary }));
  } else if (c.machine_no) {
    caseMachineList.push({ machine_no: c.machine_no, is_primary: true });
  }

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
    <div className="max-w-5xl mx-auto px-6 py-8">
      <div className="mb-4">
        <Link href="/cases" className="text-[13px] font-medium hover:underline" style={{ color: "#C8102E" }}>
          ← Back to cases
        </Link>
      </div>

      {/* Header */}
      <div className="bg-white border border-slate-200 rounded-2xl p-6 mb-5">
        <div className="flex items-start justify-between gap-3 mb-4 flex-wrap">
          <div className="flex items-center gap-2.5 flex-wrap">
            <h1 className="font-mono text-[24px] font-bold leading-none">{c.so_number}</h1>
            <span
              className="text-[11px] px-2.5 py-1 rounded-md font-semibold"
              style={{ background: s.bg, color: s.text }}
            >
              {s.label}
            </span>
            {c.source === "aroet" && (
              <span className="text-[11px] bg-purple-100 text-purple-700 px-2.5 py-1 rounded-md font-semibold">
                AROET
              </span>
            )}
            <span className="text-[13px] text-slate-500">
              {c.service_type_code} · {c.service_type_name}
            </span>
          </div>
          {c.planner_note && (
            <ReparseButton so_number={so_number} hasParsed={parsedCount > 0} />
          )}
        </div>

        {c.title && (
          <div className="text-[16px] font-semibold text-slate-800 mb-4">{c.title}</div>
        )}

        <div className="grid grid-cols-2 md:grid-cols-4 gap-x-6 gap-y-3 text-[13px] pt-4 border-t border-slate-100">
          <div>
            <div className="text-slate-500 text-[11px] uppercase tracking-wider mb-1 font-semibold">Customer</div>
            <div className="font-medium text-slate-800 truncate">{c.customer_name ?? "—"}</div>
          </div>
          <div>
            <div className="text-slate-500 text-[11px] uppercase tracking-wider mb-1 font-semibold">Contact</div>
            <div className="font-medium text-slate-800 truncate">{c.contact_name ?? "—"}</div>
          </div>
          <div>
            <div className="text-slate-500 text-[11px] uppercase tracking-wider mb-1 font-semibold">Due</div>
            <div className="font-medium text-slate-800">{fmtDateLong(c.due_date)}</div>
          </div>
          <div>
            <div className="text-slate-500 text-[11px] uppercase tracking-wider mb-1 font-semibold">PO</div>
            <div className="font-medium text-slate-800 truncate">{c.customer_po ?? "—"}</div>
          </div>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-4 gap-4 mb-5">
        <div className="bg-white border border-slate-200 rounded-2xl p-5">
          <div className="text-[12px] text-slate-500 font-medium mb-1.5">Sessions</div>
          <div className="text-[28px] font-bold leading-none">{sessions.length}</div>
        </div>
        <div className="bg-white border border-slate-200 rounded-2xl p-5">
          <div className="text-[12px] text-slate-500 font-medium mb-1.5">Travel</div>
          <div className="text-[28px] font-bold leading-none" style={{ color: "#993556" }}>{fmtTime(totals.travel)}</div>
        </div>
        <div className="bg-white border border-slate-200 rounded-2xl p-5">
          <div className="text-[12px] text-slate-500 font-medium mb-1.5">Work</div>
          <div className="text-[28px] font-bold leading-none" style={{ color: "#185FA5" }}>{fmtTime(totals.work)}</div>
        </div>
        <div className="bg-white border border-slate-200 rounded-2xl p-5">
          <div className="text-[12px] text-slate-500 font-medium mb-1.5">Engineers</div>
          <div className="text-[28px] font-bold leading-none">{engineers.length}</div>
        </div>
      </div>

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
      <div className="mt-5">
        {tab === "sessions" && (
          <SessionsTab
            sessions={sessions}
            sortedDates={sortedDates}
            sessionsByDate={sessionsByDate}
            so_number={so_number}
            activeEngineers={activeEngineers}
            caseMachineList={caseMachineList}
            defaultEngineer={engineers.find((e: any) => e.is_lead)?.engineer_code}
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

function SessionsTab({ sessions, sortedDates, sessionsByDate, so_number, activeEngineers, caseMachineList, defaultEngineer }: any) {
  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <div>
          <h2 className="text-[17px] font-semibold">Sessions</h2>
          <p className="text-[13px] text-slate-500 mt-0.5">
            {sessions.length} session{sessions.length !== 1 ? "s" : ""}
          </p>
        </div>
        <AddSessionButton
          so_number={so_number}
          engineers={activeEngineers}
          machines={caseMachineList}
          defaultEngineer={defaultEngineer}
        />
      </div>

      {sessions.length === 0 && (
        <div className="bg-white border border-slate-200 rounded-2xl p-10 text-center text-[14px] text-slate-400">
          No sessions yet. Click "+ Add session" to add your first one.
        </div>
      )}

      <div className="space-y-4">
        {sortedDates.map((date: string) => {
          const daySessions = sessionsByDate.get(date) ?? [];
          const dayTravel = daySessions.reduce((a: number, s: any) => a + (s.travel_minutes ?? 0), 0);
          const dayWork = daySessions.reduce((a: number, s: any) => a + (s.work_minutes ?? 0), 0);
          const dayOffice = daySessions.reduce((a: number, s: any) => a + (s.office_minutes ?? 0), 0);
          const dayTotal = dayTravel + dayWork + dayOffice;

          return (
            <div key={date}>
              <div className="text-[13px] font-semibold text-slate-700 mb-2 flex items-center gap-3 flex-wrap">
                <span>{fmtDay(date)}</span>
                <span className="text-[12px] text-slate-400 font-normal">
                  · {fmtTime(dayTotal)} total
                  {dayTravel > 0 && <span style={{ color: "#993556", marginLeft: 8 }}>T {fmtTime(dayTravel)}</span>}
                  {dayWork > 0 && <span style={{ color: "#185FA5", marginLeft: 8 }}>W {fmtTime(dayWork)}</span>}
                  {dayOffice > 0 && <span style={{ color: "#5F5E5A", marginLeft: 8 }}>O {fmtTime(dayOffice)}</span>}
                </span>
              </div>
              <div className="space-y-2">
                {daySessions.map((s: any) => (
                  <SessionCard key={s.id} session={s} so_number={so_number} />
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function SessionsTabOld({ sessions, sortedDates, sessionsByDate, so_number }: any) {
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
      <div className="bg-white border border-slate-200 rounded-2xl p-10 text-center text-[14px] text-slate-400">
        No engineers assigned.
      </div>
    );
  }

  return (
    <div className="bg-white border border-slate-200 rounded-2xl p-6">
      <div className="flex flex-wrap gap-2">
        {engineers.map((e: any) => (
          <span
            key={e.engineer_code}
            className="bg-slate-50 border border-slate-200 px-3.5 py-2 rounded-lg text-[13px] flex items-center gap-2"
          >
            <strong className="font-mono text-[12px] font-semibold">{e.engineer_code}</strong>
            {e.engineers?.full_name && (
              <span className="text-slate-600">{e.engineers.full_name}</span>
            )}
            {e.is_lead && (
              <span
                className="text-[10px] px-1.5 py-0.5 rounded-md font-semibold"
                style={{ background: "#FAEEDA", color: "#BA7517" }}
              >
                ★ LEAD
              </span>
            )}
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
