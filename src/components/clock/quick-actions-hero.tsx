"use client";

import { useEffect, useState, useTransition } from "react";
import { Icon, type IconName } from "@/components/icons";
import { TypeBlock } from "@/components/primitives/type-block";
import { WhatsNextSheet } from "./whats-next-sheet";
import { ClockOutReviewSheet } from "./clock-out-review-sheet";
import { EditStartTimeSheet } from "./edit-start-time-sheet";
import { ServiceChip } from "@/components/primitives/service-chip";
import { CodeBadge } from "@/components/primitives/code-badge";
import { chainNext, takeBreak, endBreak } from "@/app/clock/actions";
import { computeElapsedMinutes, type ActiveSession } from "@/lib/clock/types";
import type { PlannedTodayRow, LastSessionRow } from "@/app/dashboard/queries";

type Props = {
  engineerCode: string;
  activeSession: ActiveSession | null;
  plannedToday?: PlannedTodayRow[];
  lastSession?: LastSessionRow | null;
};

type SheetMode = null | "pick-case" | "whats-next" | "clock-out" | "edit-time";

const BACKDATE_PRESETS = [
  { min: 0, label: "Now" },
  { min: 15, label: "15m" },
  { min: 30, label: "30m" },
  { min: 60, label: "1h" },
  { min: 120, label: "2h" },
];

const ACTIVITY_ICON: Record<string, IconName> = {
  field: "wrench",
  travel: "car",
  remote: "cloud",
  office: "doc",
  training: "clip-list",
  upgrade: "trending-up",
};

export function QuickActionsHero({
  engineerCode,
  activeSession,
  plannedToday = [],
  lastSession = null,
}: Props) {
  const [sheet, setSheet] = useState<SheetMode>(null);
  const [backdateMin, setBackdateMin] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();
  const [, setTick] = useState(0);

  const paused = Boolean(activeSession?.paused_at);
  const isActive = Boolean(activeSession);

  useEffect(() => {
    if (!isActive || paused) return;
    const id = setInterval(() => setTick((t) => t + 1), 1000);
    return () => clearInterval(id);
  }, [isActive, paused]);

  const onQuickAction = (kind: "travel" | "office") => {
    setError(null);
    startTransition(async () => {
      const r = await chainNext({ kind, backdate_minutes: isActive ? 0 : backdateMin });
      if (!r.success) setError(r.error ?? "Could not start.");
    });
  };

  const onStartCase = (so_number: string, machine_no: string | null) => {
    setError(null);
    startTransition(async () => {
      const r = await chainNext({
        kind: "case",
        so_number,
        machine_no,
        backdate_minutes: isActive ? 0 : backdateMin,
      });
      if (!r.success) setError(r.error ?? "Could not start.");
    });
  };

  const onBreak = () => {
    setError(null);
    startTransition(async () => {
      const r = paused ? await endBreak() : await takeBreak();
      if (!r.success) setError(r.error ?? "Failed.");
    });
  };

  if (!isActive) {
    return (
      <>
        <div
          className="card"
          style={{
            padding: 14,
            background: "linear-gradient(180deg, var(--red-50), var(--surface))",
            borderColor: "var(--red-line)",
            display: "flex",
            flexDirection: "column",
            gap: 12,
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <div
              style={{
                width: 36,
                height: 36,
                borderRadius: 10,
                background: "var(--red)",
                color: "#fff",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                flex: "none",
              }}
            >
              <Icon name="sparkles" size={18} />
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: 14, fontWeight: 700, color: "var(--ink)" }}>
                Ready when you are, {engineerCode}
              </div>
              <div
                style={{
                  fontSize: 11.5,
                  color: "var(--ink-3)",
                  marginTop: 1,
                }}
              >
                {backdateMin === 0
                  ? "Tap an action to clock in"
                  : `Started ${BACKDATE_PRESETS.find((p) => p.min === backdateMin)?.label ?? backdateMin + "m"} ago`}
              </div>
            </div>
          </div>

          {plannedToday.length > 0 && (
            <div className="stack" style={{ gap: 6 }}>
              {plannedToday.map((p) => (
                <SuggestionRow
                  key={p.id}
                  kind="planned"
                  so_number={p.so_number}
                  title={p.case_title}
                  customer={p.customer_name}
                  machine={p.machine_no}
                  serviceType={p.service_type_code}
                  onStart={() => onStartCase(p.so_number, p.machine_no)}
                  disabled={pending}
                />
              ))}
            </div>
          )}

          {plannedToday.length === 0 && lastSession && (
            <SuggestionRow
              kind="continue"
              so_number={lastSession.so_number}
              title={lastSession.case_title}
              customer={lastSession.customer_name}
              machine={lastSession.machine_no}
              serviceType={lastSession.service_type_code}
              hint={`Finished ${relativeTime(lastSession.clock_out_at)}`}
              onStart={() => onStartCase(lastSession.so_number, lastSession.machine_no)}
              disabled={pending}
            />
          )}

          <BackdateRow value={backdateMin} onChange={setBackdateMin} />

          <div className="quick-actions">
            <QuickButton
              icon="wrench"
              label="Case"
              onClick={() => setSheet("pick-case")}
              disabled={pending}
              tone="primary"
            />
            <QuickButton
              icon="car"
              label="Travel"
              onClick={() => onQuickAction("travel")}
              disabled={pending}
            />
            <QuickButton
              icon="doc"
              label="Office"
              onClick={() => onQuickAction("office")}
              disabled={pending}
            />
          </div>

          {error && <ErrorRow text={error} />}
        </div>

        <WhatsNextSheet
          open={sheet === "pick-case"}
          onClose={() => setSheet(null)}
          hasActive={false}
          paused={false}
          defaultStep="pick-case"
        />
      </>
    );
  }

  const session = activeSession!;
  const min = computeElapsedMinutes(session);
  const extraSec = paused
    ? 0
    : Math.floor((Date.now() - new Date(session.clock_in_at).getTime()) / 1000) % 60;
  const h = Math.floor(min / 60);
  const m = min % 60;
  const icon = ACTIVITY_ICON[session.activity_type] ?? "wrench";

  return (
    <>
      <div
        className="card"
        style={{
          padding: 14,
          background: paused
            ? "var(--surface)"
            : "linear-gradient(180deg, var(--red-50), var(--surface))",
          borderColor: paused ? "var(--line)" : "var(--red-line)",
          display: "flex",
          flexDirection: "column",
          gap: 12,
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <div
            style={{
              width: 44,
              height: 44,
              borderRadius: 12,
              background: paused ? "var(--surface-2)" : "var(--red)",
              color: paused ? "var(--ink-3)" : "#fff",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              flex: "none",
              position: "relative",
            }}
          >
            <Icon name={icon} size={20} />
            <span
              style={{
                position: "absolute",
                top: -2,
                right: -2,
                width: 10,
                height: 10,
                borderRadius: 5,
                background: paused ? "var(--ink-4)" : "var(--red)",
                border: "2px solid var(--surface)",
                animation: paused ? "none" : "pulse-presence 1.2s infinite",
              }}
            />
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 2 }}>
              <TypeBlock t={session.type_code} />
              <span
                style={{
                  fontSize: 10.5,
                  fontWeight: 700,
                  letterSpacing: ".06em",
                  color: paused ? "var(--ink-3)" : "var(--red)",
                  textTransform: "uppercase",
                }}
              >
                {paused ? "Paused" : "Clocked in"}
              </span>
            </div>
            <div className="truncate" style={{ fontSize: 14, fontWeight: 600, color: "var(--ink)" }}>
              {session.case_title ??
                session.so_number ??
                (session.activity_type === "office" ? "Office time" : "Active session")}
            </div>
            <div
              className="truncate"
              style={{ fontSize: 11.5, color: "var(--ink-3)", marginTop: 1 }}
            >
              {session.customer_name ??
                session.so_number ??
                (session.activity_type === "office" ? "Admin / reports / calls" : "—")}
            </div>
          </div>
          <button
            type="button"
            onClick={() => setSheet("edit-time")}
            className="mono"
            style={{
              fontSize: 22,
              fontWeight: 700,
              letterSpacing: "-0.02em",
              color: paused ? "var(--ink-3)" : "var(--ink)",
              flex: "none",
              background: "none",
              border: "none",
              padding: 0,
              cursor: "pointer",
            }}
            aria-label="Edit start time"
          >
            {h}:{m.toString().padStart(2, "0")}
            <span style={{ fontSize: 12, color: "var(--ink-4)", marginLeft: 2 }}>
              :{extraSec.toString().padStart(2, "0")}
            </span>
          </button>
        </div>

        <div className="quick-actions">
          <QuickButton
            icon="refresh"
            label="Switch"
            onClick={() => setSheet("whats-next")}
            disabled={pending || paused}
          />
          <QuickButton
            icon={paused ? "play" : "pause"}
            label={paused ? "Resume" : "Break"}
            onClick={onBreak}
            disabled={pending}
            tone={paused ? "primary" : undefined}
          />
          <QuickButton
            icon="check"
            label="Done"
            onClick={() => setSheet("clock-out")}
            disabled={pending}
          />
        </div>

        {error && <ErrorRow text={error} />}
      </div>

      <WhatsNextSheet
        open={sheet === "whats-next"}
        onClose={() => setSheet(null)}
        hasActive={true}
        paused={paused}
      />
      <ClockOutReviewSheet
        open={sheet === "clock-out"}
        onClose={() => setSheet(null)}
        session={session}
      />
      <EditStartTimeSheet
        open={sheet === "edit-time"}
        onClose={() => setSheet(null)}
        sessionId={session.id}
        currentClockInISO={session.clock_in_at}
      />
    </>
  );
}

function BackdateRow({ value, onChange }: { value: number; onChange: (v: number) => void }) {
  return (
    <div
      style={{
        display: "flex",
        gap: 6,
        alignItems: "center",
        flexWrap: "wrap",
        padding: "6px 10px",
        background: "var(--surface)",
        borderRadius: 10,
        border: "1px solid var(--line)",
      }}
    >
      <span className="kicker" style={{ flex: "none" }}>
        Started
      </span>
      {BACKDATE_PRESETS.map((p) => (
        <button
          key={p.min}
          type="button"
          className="fchip"
          data-on={value === p.min || undefined}
          onClick={() => onChange(p.min)}
          style={{ minHeight: 28, padding: "4px 10px" }}
        >
          {p.label}
        </button>
      ))}
      {value > 0 && (
        <span style={{ fontSize: 11, color: "var(--ink-3)", marginLeft: "auto" }}>
          ago
        </span>
      )}
    </div>
  );
}

function QuickButton({
  icon,
  label,
  onClick,
  disabled,
  tone,
}: {
  icon: IconName;
  label: string;
  onClick: () => void;
  disabled?: boolean;
  tone?: "primary";
}) {
  const isPrimary = tone === "primary";
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className="quick-btn"
      data-primary={isPrimary || undefined}
    >
      <Icon name={icon} size={18} />
      <span>{label}</span>
    </button>
  );
}

function SuggestionRow({
  kind,
  so_number,
  title,
  customer,
  machine,
  serviceType,
  hint,
  onStart,
  disabled,
}: {
  kind: "planned" | "continue";
  so_number: string;
  title: string | null;
  customer: string | null;
  machine: string | null;
  serviceType: string | null;
  hint?: string;
  onStart: () => void;
  disabled?: boolean;
}) {
  const planned = kind === "planned";
  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        gap: 10,
        padding: "10px 12px",
        background: "var(--surface)",
        border: "1px solid var(--line)",
        borderRadius: 12,
      }}
    >
      <div
        style={{
          width: 32,
          height: 32,
          borderRadius: 9,
          background: planned ? "var(--info-soft)" : "var(--surface-2)",
          color: planned ? "var(--info)" : "var(--ink-3)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          flex: "none",
        }}
      >
        <Icon name={planned ? "calendar" : "refresh"} size={15} />
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 2, flexWrap: "wrap" }}>
          <span
            className="kicker"
            style={{ color: planned ? "var(--info)" : "var(--ink-3)" }}
          >
            {planned ? "Planned today" : hint ?? "Continue"}
          </span>
          {serviceType && <ServiceChip typ={serviceType} />}
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 6, flexWrap: "wrap" }}>
          <CodeBadge>{so_number}</CodeBadge>
          {machine && <CodeBadge>{machine}</CodeBadge>}
          <span
            className="truncate"
            style={{ fontSize: 12.5, color: "var(--ink-2)", fontWeight: 500, minWidth: 0 }}
          >
            {customer ?? title ?? "—"}
          </span>
        </div>
      </div>
      <button
        type="button"
        onClick={onStart}
        disabled={disabled}
        className="btn btn-primary btn-sm"
        style={{ flex: "none" }}
      >
        <Icon name="play" size={12} /> Start
      </button>
    </div>
  );
}

function relativeTime(iso: string): string {
  const diffMs = Date.now() - new Date(iso).getTime();
  const min = Math.floor(diffMs / 60000);
  if (min < 1) return "just now";
  if (min < 60) return `${min}m ago`;
  const h = Math.floor(min / 60);
  const m = min % 60;
  return m === 0 ? `${h}h ago` : `${h}h${m}m ago`;
}

function ErrorRow({ text }: { text: string }) {
  return (
    <div
      style={{
        padding: "8px 10px",
        background: "var(--danger-soft)",
        color: "var(--danger)",
        border: "1px solid rgba(220,38,38,.3)",
        borderRadius: 8,
        fontSize: 12.5,
        display: "flex",
        alignItems: "center",
        gap: 6,
      }}
    >
      <Icon name="alert" size={12} /> {text}
    </div>
  );
}
