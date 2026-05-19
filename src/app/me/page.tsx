import { AppBar } from "@/components/app-bar";
import { DesktopTopBar } from "@/components/desktop-top";
import { Avatar } from "@/components/primitives/avatar";
import { Icon, type IconName } from "@/components/icons";
import { createClient } from "@/lib/supabase/server";
import { getActiveSession } from "@/lib/clock/queries";
import { getNotifications } from "@/components/notifications/queries";
import { RoleSwitcher } from "./role-switcher";

const ME = "JKH";

export const dynamic = "force-dynamic";

const SETTINGS: { id: string; label: string; icon: IconName; note: string }[] = [
  { id: "schedule", label: "My schedule",     icon: "calendar",    note: "Coming soon" },
  { id: "reports",  label: "Service reports", icon: "doc",         note: "Sprint 7" },
  { id: "imports",  label: "Import history",  icon: "cloud",       note: "Admin tool" },
  { id: "settings", label: "Settings",        icon: "wrench",      note: "Theme + density (Phase 4)" },
];

export default async function MePage() {
  const supabase = await createClient();
  const today = new Date().toLocaleDateString("en-CA", { timeZone: "Asia/Bangkok" });
  const monthStart = today.slice(0, 7) + "-01";

  const [{ data: engineer }, { count: openCount }, { data: thisMonth }, activeSession, notifications] = await Promise.all([
    supabase.from("engineers").select("code, full_name, role, is_active").eq("code", ME).maybeSingle(),
    supabase
      .from("case_engineers")
      .select("so_number", { count: "exact", head: true })
      .eq("engineer_code", ME),
    supabase
      .from("sessions")
      .select("travel_minutes, work_minutes, office_minutes, approval_status")
      .eq("engineer_code", ME)
      .gte("session_date", monthStart),
    getActiveSession(ME),
    getNotifications(ME),
  ]);

  const monthMin = ((thisMonth ?? []) as Array<{
    travel_minutes: number | null;
    work_minutes: number | null;
    office_minutes: number | null;
    approval_status: string | null;
  }>)
    .filter((r) => r.approval_status !== "returned")
    .reduce(
      (a, r) => a + (r.travel_minutes ?? 0) + (r.work_minutes ?? 0) + (r.office_minutes ?? 0),
      0
    );
  const monthHours = Math.round((monthMin / 60) * 10) / 10;

  return (
    <>
      <AppBar
        title="Me"
        sub={engineer?.full_name ?? ME}
        activeSession={activeSession}
        notifications={notifications}
      />
      <DesktopTopBar
        title={engineer?.full_name ?? ME}
        crumbs={[{ label: "Workspace", href: "/" }, { label: "Me" }]}
        activeSession={activeSession}
        notifications={notifications}
      />
      <div className="scroll md:hidden" style={{ padding: "12px 14px 32px", display: "flex", flexDirection: "column", gap: 12 }}>
        <ProfileCard
          code={ME}
          name={engineer?.full_name ?? "—"}
          role={engineer?.role ?? "engineer"}
          monthHours={monthHours}
          casesCount={openCount ?? 0}
          isActive={Boolean(activeSession)}
        />
        <RoleSwitcher />
        <SettingsList />
      </div>
      <div className="dt-body hidden md:block">
        <div style={{ display: "grid", gridTemplateColumns: "1.5fr 1fr", gap: 14, maxWidth: 900 }}>
          <ProfileCard
            code={ME}
            name={engineer?.full_name ?? "—"}
            role={engineer?.role ?? "engineer"}
            monthHours={monthHours}
            casesCount={openCount ?? 0}
            isActive={Boolean(activeSession)}
          />
          <RoleSwitcher />
          <div style={{ gridColumn: "1 / -1" }}>
            <SettingsList />
          </div>
        </div>
      </div>
    </>
  );
}

function ProfileCard({
  code,
  name,
  role,
  monthHours,
  casesCount,
  isActive,
}: {
  code: string;
  name: string;
  role: string;
  monthHours: number;
  casesCount: number;
  isActive: boolean;
}) {
  return (
    <div className="card" style={{ padding: 16 }}>
      <div style={{ display: "flex", gap: 12, alignItems: "center", marginBottom: 12 }}>
        <Avatar code={code} size={56} />
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: 16, fontWeight: 700, color: "var(--ink)" }}>{name}</div>
          <div className="mono" style={{ fontSize: 12, color: "var(--ink-3)", marginTop: 2 }}>
            {code} · {role}
          </div>
          {isActive && (
            <span className="chip chip-red" style={{ marginTop: 4 }}>
              <Icon name="play" size={11} /> Clocked in now
            </span>
          )}
        </div>
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
        <Stat label="Cases assigned" value={casesCount} />
        <Stat label="Hours · this month" value={`${monthHours}h`} />
      </div>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: number | string }) {
  return (
    <div className="card-flat" style={{ padding: 10 }}>
      <div className="kicker">{label}</div>
      <div className="mono" style={{ fontSize: 22, fontWeight: 700, color: "var(--ink)", marginTop: 4 }}>
        {value}
      </div>
    </div>
  );
}

function SettingsList() {
  return (
    <div className="card" style={{ padding: 0, overflow: "hidden" }}>
      {SETTINGS.map((s, i) => (
        <div
          key={s.id}
          style={{
            padding: "12px 14px",
            display: "flex",
            alignItems: "center",
            gap: 12,
            borderTop: i === 0 ? "none" : "1px solid var(--line-2)",
          }}
        >
          <div
            style={{
              width: 34,
              height: 34,
              borderRadius: 8,
              background: "var(--surface-2)",
              color: "var(--ink-3)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              flex: "none",
            }}
          >
            <Icon name={s.icon} size={16} />
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: 13, fontWeight: 600, color: "var(--ink)" }}>{s.label}</div>
            <div className="sub" style={{ textTransform: "none", letterSpacing: 0, fontSize: 11.5 }}>
              {s.note}
            </div>
          </div>
          <span style={{ color: "var(--ink-4)" }}>
            <Icon name="chevron" size={14} />
          </span>
        </div>
      ))}
    </div>
  );
}
