"use client";

import { useEffect, useState, useTransition } from "react";
import { Sheet } from "@/components/sheet";
import { Icon, type IconName } from "@/components/icons";
import { ServiceChip } from "@/components/primitives/service-chip";
import {
  chainNext,
  takeBreak,
  endBreak,
  searchCasesForEmergency,
  type EmergencyCase,
} from "@/app/clock/actions";

type Step = "home" | "pick-case";

type Props = {
  open: boolean;
  onClose: () => void;
  hasActive: boolean;
  paused: boolean;
  defaultStep?: Step;
};

const BACKDATE_PRESETS = [
  { min: 0,   label: "Now" },
  { min: 15,  label: "15m ago" },
  { min: 30,  label: "30m ago" },
  { min: 60,  label: "1h ago" },
  { min: 120, label: "2h ago" },
];

export function WhatsNextSheet({ open, onClose, hasActive, paused, defaultStep = "home" }: Props) {
  const [step, setStep] = useState<Step>(defaultStep);
  const [search, setSearch] = useState("");
  const [cases, setCases] = useState<EmergencyCase[]>([]);
  const [searching, setSearching] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();
  const [backdateMin, setBackdateMin] = useState(0);

  // Reset when sheet opens
  useEffect(() => {
    if (open) {
      setStep(defaultStep);
      setSearch("");
      setCases([]);
      setError(null);
      setBackdateMin(0);
    }
  }, [open, defaultStep]);

  // Live search — runs whenever the case picker is open
  useEffect(() => {
    if (step !== "pick-case") return;
    let cancelled = false;
    setSearching(true);
    searchCasesForEmergency(search.trim()).then((r) => {
      if (cancelled) return;
      setCases(r);
      setSearching(false);
    });
    return () => {
      cancelled = true;
    };
  }, [step, search]);

  const close = () => {
    onClose();
  };

  const onPickAction = (kind: "case" | "travel" | "office") => {
    if (kind === "case") {
      setStep("pick-case");
      return;
    }
    setError(null);
    startTransition(async () => {
      const r = await chainNext({ kind, backdate_minutes: backdateMin });
      if (!r.success) setError(r.error ?? "Could not start.");
      else close();
    });
  };

  const onPickCase = (so: string, machine: string | null) => {
    setError(null);
    startTransition(async () => {
      const r = await chainNext({
        kind: "case",
        so_number: so,
        machine_no: machine,
        backdate_minutes: backdateMin,
      });
      if (!r.success) setError(r.error ?? "Could not start.");
      else close();
    });
  };

  const onBreak = () => {
    setError(null);
    startTransition(async () => {
      const r = paused ? await endBreak() : await takeBreak();
      if (!r.success) setError(r.error ?? "Failed.");
      else close();
    });
  };

  // The server already returns cases sorted by:
  //   planned_today → most-recently-worked → mine → others
  const caseList: EmergencyCase[] = cases;

  return (
    <Sheet
      open={open}
      onClose={close}
      title={step === "pick-case" ? "Which case?" : "What's next?"}
      sub={step === "pick-case" ? `${caseList.length} option${caseList.length === 1 ? "" : "s"}` : hasActive ? "Tap to switch" : "Pick something to clock in"}
    >
      <div style={{ padding: 14, display: "flex", flexDirection: "column", gap: 10 }}>
        {step === "home" && (
          <>
            {!paused && (
              <div
                style={{
                  display: "flex",
                  gap: 6,
                  alignItems: "center",
                  flexWrap: "wrap",
                  padding: "6px 10px",
                  background: "var(--surface-2)",
                  borderRadius: 10,
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
                    data-on={backdateMin === p.min || undefined}
                    onClick={() => setBackdateMin(p.min)}
                  >
                    {p.label}
                  </button>
                ))}
              </div>
            )}
            {paused && (
              <BigOption
                icon="play"
                label="End break"
                sublabel="Resume what you were doing"
                onClick={onBreak}
                disabled={pending}
                accent="primary"
              />
            )}
            <BigOption
              icon="wrench"
              label="Work on a case"
              sublabel="Yours first · search any case"
              onClick={() => onPickAction("case")}
              disabled={pending || paused}
            />
            <BigOption
              icon="car"
              label="Travelling"
              sublabel="Driving to / from a customer"
              onClick={() => onPickAction("travel")}
              disabled={pending || paused}
            />
            <BigOption
              icon="doc"
              label="Office time"
              sublabel="Admin, reports, calls — no case"
              onClick={() => onPickAction("office")}
              disabled={pending || paused}
            />
            {!paused && hasActive && (
              <BigOption
                icon="pause"
                label="Take a break"
                sublabel="Lunch / step away — timer pauses"
                onClick={onBreak}
                disabled={pending}
              />
            )}
          </>
        )}

        {step === "pick-case" && (
          <>
            <button
              type="button"
              className="btn btn-ghost btn-sm"
              onClick={() => setStep("home")}
              style={{ alignSelf: "flex-start", padding: 0, minHeight: 20 }}
            >
              <Icon name="back" size={12} /> Back
            </button>
            <input
              type="search"
              placeholder="Search SO, title, customer, machine…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="field"
              autoFocus
            />
            <div style={{ display: "flex", flexDirection: "column", gap: 6, maxHeight: 380, overflow: "auto" }}>
              {searching && (
                <div className="sub" style={{ padding: 12, textAlign: "center", textTransform: "none", letterSpacing: 0, fontSize: 12 }}>
                  Searching…
                </div>
              )}
              {!searching && caseList.length === 0 && (
                <div className="sub" style={{ padding: 12, textAlign: "center", textTransform: "none", letterSpacing: 0, fontSize: 12 }}>
                  {search.trim() ? "No matches." : "No active cases assigned to you."}
                </div>
              )}
              {caseList.map((c) => (
                <button
                  key={c.so_number}
                  type="button"
                  onClick={() => onPickCase(c.so_number, c.machine_no)}
                  className="card row-link"
                  disabled={pending}
                  style={{
                    padding: 12,
                    textAlign: "left",
                    display: "block",
                    width: "100%",
                    cursor: pending ? "wait" : "pointer",
                  }}
                >
                  <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 4, flexWrap: "wrap" }}>
                    <span className="mono" style={{ fontSize: 11, fontWeight: 700, color: "var(--ink-3)" }}>
                      {c.so_number}
                    </span>
                    {c.planned_today && (
                      <span
                        className="chip"
                        style={{
                          fontSize: 9,
                          padding: "1px 5px",
                          background: "var(--info-soft)",
                          color: "var(--info)",
                          borderColor: "rgba(14,165,233,.3)",
                        }}
                      >
                        Planned today
                      </span>
                    )}
                    {!c.planned_today && c.last_session_at && (
                      <span className="chip chip-slate" style={{ fontSize: 9, padding: "1px 5px" }}>
                        {recencyLabel(c.last_session_at)}
                      </span>
                    )}
                    {c.is_mine && !c.planned_today && (
                      <span className="chip chip-red" style={{ fontSize: 9, padding: "1px 5px" }}>
                        Mine
                      </span>
                    )}
                    {c.service_type_code && <ServiceChip typ={c.service_type_code} />}
                  </div>
                  <div className="truncate" style={{ fontSize: 13, fontWeight: 600, color: "var(--ink)" }}>
                    {c.title ?? "Untitled"}
                  </div>
                  <div
                    className="sub truncate"
                    style={{ textTransform: "none", letterSpacing: 0, fontSize: 11.5, color: "var(--ink-3)" }}
                  >
                    {c.customer_name ?? "—"}
                    {c.machine_no ? ` · ${c.machine_no}` : ""}
                  </div>
                </button>
              ))}
            </div>
          </>
        )}

        {error && (
          <div
            className="card"
            style={{
              padding: 10,
              background: "var(--danger-soft)",
              borderColor: "rgba(220,38,38,.3)",
              color: "var(--danger)",
              fontSize: 13,
            }}
          >
            <Icon name="alert" size={12} /> {error}
          </div>
        )}
      </div>
    </Sheet>
  );
}

function recencyLabel(iso: string): string {
  const today = new Date().toLocaleDateString("en-CA", { timeZone: "Asia/Bangkok" });
  const isoDate = iso.length >= 10 ? iso.slice(0, 10) : iso;
  if (isoDate === today) return "Today";
  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);
  const yIso = yesterday.toLocaleDateString("en-CA", { timeZone: "Asia/Bangkok" });
  if (isoDate === yIso) return "Yesterday";
  const days = Math.floor((Date.now() - new Date(isoDate).getTime()) / (24 * 60 * 60 * 1000));
  if (days <= 7) return `${days}d ago`;
  return "Recent";
}

function BigOption({
  icon,
  label,
  sublabel,
  onClick,
  disabled,
  accent,
}: {
  icon: IconName;
  label: string;
  sublabel: string;
  onClick: () => void;
  disabled?: boolean;
  accent?: "primary";
}) {
  const isPrimary = accent === "primary";
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className="card row-link"
      style={{
        padding: 14,
        display: "flex",
        alignItems: "center",
        gap: 12,
        width: "100%",
        textAlign: "left",
        cursor: disabled ? "not-allowed" : "pointer",
        background: isPrimary ? "linear-gradient(180deg, var(--red-50), var(--surface))" : undefined,
        borderColor: isPrimary ? "var(--red-line)" : undefined,
      }}
    >
      <div
        style={{
          width: 42,
          height: 42,
          borderRadius: 11,
          background: isPrimary ? "var(--red)" : "var(--surface-2)",
          color: isPrimary ? "#fff" : "var(--ink-2)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          flex: "none",
        }}
      >
        <Icon name={icon} size={20} />
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: 14, fontWeight: 700, color: isPrimary ? "var(--red)" : "var(--ink)" }}>
          {label}
        </div>
        <div className="sub" style={{ textTransform: "none", letterSpacing: 0, fontSize: 12, color: "var(--ink-3)", marginTop: 1 }}>
          {sublabel}
        </div>
      </div>
      <Icon name="chevron" size={14} />
    </button>
  );
}
