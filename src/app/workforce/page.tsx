import { AppBar } from "@/components/app-bar";
import { DesktopTopBar } from "@/components/desktop-top";
import { getActiveSession } from "@/lib/clock/queries";
import { getNotifications } from "@/components/notifications/queries";
import { getDemoRole } from "@/app/me/role-actions";
import { computePayPeriod, type PayPeriodPreset } from "@/lib/pay-period";
import { listActiveEngineers, getHoursSessions, aggregateTotals } from "./queries";
import { PeriodPicker } from "./period-picker";
import { TotalsCard } from "./totals-card";
import { HoursSection } from "./hours-section";

const ME = "JKH";

export const dynamic = "force-dynamic";

type Search = {
  preset?: string;
  year?: string;
  month?: string;
  engineer?: string;
};

const VALID_PRESETS: PayPeriodPreset[] = [
  "month",
  "h1_1_15",
  "h2_16_end",
  "h1_1_20",
  "h2_21_end",
];

export default async function WorkforcePage({
  searchParams,
}: {
  searchParams: Promise<Search>;
}) {
  const sp = await searchParams;

  const now = new Date();
  const today = new Date(now.toLocaleString("en-US", { timeZone: "Asia/Bangkok" }));
  const presetRaw = sp.preset as PayPeriodPreset | undefined;
  const preset: PayPeriodPreset = presetRaw && VALID_PRESETS.includes(presetRaw) ? presetRaw : "h2_21_end";
  const year = sp.year ? parseInt(sp.year, 10) : today.getFullYear();
  const month = sp.month ? parseInt(sp.month, 10) : today.getMonth() + 1;
  const period = computePayPeriod(preset, year, month);

  const [role, engineers] = await Promise.all([getDemoRole(), listActiveEngineers()]);
  const canPickEngineer = role === "admin";
  const requestedEngineer = sp.engineer ?? ME;
  const engineer =
    canPickEngineer && engineers.some((e) => e.code === requestedEngineer)
      ? requestedEngineer
      : ME;

  const [sessions, activeSession, notifications] = await Promise.all([
    getHoursSessions(engineer, period.start, period.end),
    getActiveSession(ME),
    getNotifications(ME),
  ]);

  const totals = aggregateTotals(sessions);
  const engineerName =
    engineers.find((e) => e.code === engineer)?.full_name ?? engineer;

  return (
    <>
      <AppBar
        title="Hours"
        sub={`${engineer} · ${period.label}`}
        activeSession={activeSession}
        notifications={notifications}
      />
      <DesktopTopBar
        title="Hours"
        crumbs={[{ label: "Workspace", href: "/" }, { label: "Hours" }]}
        activeSession={activeSession}
        notifications={notifications}
      />
      <div className="scroll">
        <PeriodPicker
          preset={preset}
          year={year}
          month={month}
          engineer={engineer}
          engineers={engineers}
          canPickEngineer={canPickEngineer}
          periodLabel={period.label}
        />

        <div style={{ padding: "0 14px 8px" }}>
          <div className="kicker" style={{ marginBottom: 4 }}>
            {engineerName}
          </div>
          <div style={{ fontSize: 13, color: "var(--ink-3)" }}>
            {sessions.length} session{sessions.length === 1 ? "" : "s"} ·{" "}
            <span className="mono">{period.start}</span> →{" "}
            <span className="mono">{period.end}</span>
          </div>
        </div>

        <TotalsCard totals={totals} />
        <HoursSection
          sessions={sessions}
          start={period.start}
          end={period.end}
          engineerCode={engineer}
        />

        <div style={{ height: 40 }} />
      </div>
    </>
  );
}
