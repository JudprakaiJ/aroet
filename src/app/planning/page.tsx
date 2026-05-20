import { AppBar } from "@/components/app-bar";
import { DesktopTopBar } from "@/components/desktop-top";
import { getActiveSession } from "@/lib/clock/queries";
import { getNotifications } from "@/components/notifications/queries";
import { meCode } from "@/lib/auth/current-user";
import {
  listPlanEngineers,
  listSessionsInRange,
  listCasesBySos,
  buildDateRange,
  mondayOf,
  addDays,
} from "./queries";
import { WeekNav } from "./week-nav";
import { PlanGrid } from "./grid";
import { fmtDateLong } from "@/lib/format";


export const dynamic = "force-dynamic";

type Search = {
  from?: string;
  weeks?: string;
};

const VALID_WEEKS = new Set([1, 2, 4]);

export default async function PlanningPage({
  searchParams,
}: {
  searchParams: Promise<Search>;
}) {
  const ME = await meCode();
  const sp = await searchParams;

  const today = new Date().toISOString().slice(0, 10);
  const fromRaw = sp.from && /^\d{4}-\d{2}-\d{2}$/.test(sp.from) ? sp.from : today;
  const from = mondayOf(fromRaw);
  const weeksParsed = sp.weeks ? parseInt(sp.weeks, 10) : 1;
  const weeks = VALID_WEEKS.has(weeksParsed) ? weeksParsed : 1;
  const totalDays = weeks * 7;
  const to = addDays(from, totalDays - 1);
  const days = buildDateRange(from, totalDays);

  const [engineers, sessions, activeSession, notifications] = await Promise.all([
    listPlanEngineers(),
    listSessionsInRange(from, to),
    getActiveSession(ME),
    getNotifications(ME),
  ]);

  const sos = Array.from(
    new Set(sessions.map((s) => s.so_number).filter((s): s is string => Boolean(s)))
  );
  const cases = await listCasesBySos(sos);

  const rangeLabel = `${fmtDateLong(from)} → ${fmtDateLong(to)}`;

  return (
    <>
      <AppBar
        title="Plan"
        sub={`${engineers.length} engineer${engineers.length === 1 ? "" : "s"} · ${weeks}w`}
        activeSession={activeSession}
        notifications={notifications}
      />
      <DesktopTopBar
        title="Plan"
        crumbs={[{ label: "Workspace", href: "/" }, { label: "Plan" }]}
        activeSession={activeSession}
        notifications={notifications}
      />
      <div className="scroll">
        <WeekNav from={from} weeks={weeks} rangeLabel={rangeLabel} />

        <PlanGrid engineers={engineers} days={days} sessions={sessions} caseInfo={cases} />

        <div style={{ height: 40 }} />
      </div>
    </>
  );
}
