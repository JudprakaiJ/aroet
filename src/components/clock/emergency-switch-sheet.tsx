"use client";

import { useEffect, useRef, useState, useTransition } from "react";
import { Sheet } from "@/components/sheet";
import { Icon, type IconName } from "@/components/icons";
import {
  emergencySwitchCase,
  searchCasesForEmergency,
  type EmergencyCase,
  type EmergencyMode,
} from "@/app/clock/actions";

type Props = {
  open: boolean;
  onClose: () => void;
  sessionId: number;
  currentSoNumber: string | null;
  currentActivity: string;
};

const ACTIVITIES: { id: string; label: string; icon: IconName }[] = [
  { id: "field", label: "Field", icon: "wrench" },
  { id: "travel", label: "Travel", icon: "car" },
  { id: "remote", label: "Remote", icon: "cloud" },
  { id: "office", label: "Office", icon: "doc" },
];

export function EmergencySwitchSheet({
  open,
  onClose,
  sessionId,
  currentSoNumber,
  currentActivity,
}: Props) {
  const [query, setQuery] = useState("");
  const [cases, setCases] = useState<EmergencyCase[] | null>(null);
  const [picked, setPicked] = useState<EmergencyCase | null>(null);
  const [mode, setMode] = useState<EmergencyMode>("continue");
  const [activity, setActivity] = useState(currentActivity);
  const [changeActivity, setChangeActivity] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();
  const debounceRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (!open) return;
    setQuery("");
    setPicked(null);
    setMode("continue");
    setActivity(currentActivity);
    setChangeActivity(false);
    setError(null);
    setCases(null);
    searchCasesForEmergency("").then(setCases);
  }, [open, currentActivity]);

  useEffect(() => {
    if (!open) return;
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      searchCasesForEmergency(query).then(setCases);
    }, 200);
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [query, open]);

  const confirm = () => {
    if (!picked) return;
    setError(null);
    startTransition(async () => {
      const r = await emergencySwitchCase(
        sessionId,
        picked.so_number,
        picked.machine_no,
        mode,
        changeActivity ? activity : undefined
      );
      if (r.success) onClose();
      else setError(r.error ?? "Switch failed");
    });
  };

  return (
    <Sheet
      open={open}
      onClose={onClose}
      title={picked ? "Confirm emergency switch" : "Emergency switch"}
      sub={picked ? picked.so_number : "Jump to any urgent case"}
      footer={
        picked ? (
          <button
            type="button"
            className="btn btn-primary btn-block"
            disabled={pending}
            onClick={confirm}
            style={{ background: "var(--red)", borderColor: "var(--red-700)" }}
          >
            <Icon name="bolt" size={14} />
            {pending
              ? "Switching…"
              : mode === "restart"
                ? "Close current & start new"
                : "Switch — keep elapsed"}
          </button>
        ) : undefined
      }
    >
      <div style={{ padding: 14, display: "flex", flexDirection: "column", gap: 12 }}>
        {!picked ? (
          <>
            <div
              className="card"
              style={{
                padding: "8px 10px",
                display: "flex",
                alignItems: "center",
                gap: 8,
                background: "var(--surface)",
              }}
            >
              <Icon name="search" size={14} />
              <input
                autoFocus
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search SO, title, customer, machine…"
                style={{
                  flex: 1,
                  border: 0,
                  outline: "none",
                  background: "transparent",
                  fontSize: 14,
                  color: "var(--ink)",
                }}
              />
              {query && (
                <button
                  type="button"
                  onClick={() => setQuery("")}
                  className="iconbtn"
                  aria-label="clear"
                  style={{ width: 22, height: 22 }}
                >
                  <Icon name="x" size={12} />
                </button>
              )}
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
              {cases === null ? (
                <div className="sub" style={{ padding: 18, textAlign: "center", textTransform: "none", letterSpacing: 0 }}>
                  Loading…
                </div>
              ) : cases.length === 0 ? (
                <div className="sub" style={{ padding: 18, textAlign: "center", textTransform: "none", letterSpacing: 0 }}>
                  No active cases match.
                </div>
              ) : (
                cases
                  .filter((c) => c.so_number !== currentSoNumber)
                  .map((c) => (
                    <button
                      key={c.so_number}
                      type="button"
                      onClick={() => setPicked(c)}
                      className="card row-link"
                      style={{
                        padding: 12,
                        textAlign: "left",
                        display: "block",
                        width: "100%",
                        cursor: "pointer",
                      }}
                    >
                      <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 2 }}>
                        <span className="mono" style={{ fontSize: 11, fontWeight: 700, color: "var(--ink-3)" }}>
                          {c.so_number}
                        </span>
                        {c.machine_no && (
                          <span className="codebadge" style={{ fontSize: 10 }}>
                            {c.machine_no}
                          </span>
                        )}
                        {c.is_mine ? (
                          <span
                            className="chip"
                            style={{
                              fontSize: 9,
                              background: "var(--ok-soft)",
                              color: "var(--ok)",
                              fontWeight: 700,
                              letterSpacing: ".06em",
                            }}
                          >
                            MINE
                          </span>
                        ) : (
                          <span
                            className="chip"
                            style={{
                              fontSize: 9,
                              background: "var(--warn-soft)",
                              color: "var(--warn)",
                              fontWeight: 700,
                              letterSpacing: ".06em",
                            }}
                          >
                            UNASSIGNED
                          </span>
                        )}
                      </div>
                      <div className="truncate" style={{ fontSize: 13, fontWeight: 600, color: "var(--ink)" }}>
                        {c.title ?? "Untitled"}
                      </div>
                      <div
                        className="sub truncate"
                        style={{ textTransform: "none", letterSpacing: 0, fontSize: 11.5, color: "var(--ink-3)" }}
                      >
                        {c.customer_name ?? "—"}
                      </div>
                    </button>
                  ))
              )}
            </div>
          </>
        ) : (
          <>
            <div className="card" style={{ padding: 12, background: "var(--red-50)", borderColor: "var(--red-line)" }}>
              <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 4 }}>
                <Icon name="bolt" size={12} />
                <span className="mono" style={{ fontSize: 11, fontWeight: 700, color: "var(--red)" }}>
                  {picked.so_number}
                </span>
                {picked.machine_no && (
                  <span className="codebadge" style={{ fontSize: 10 }}>
                    {picked.machine_no}
                  </span>
                )}
              </div>
              <div style={{ fontSize: 13, fontWeight: 600, color: "var(--ink)" }}>{picked.title ?? "Untitled"}</div>
              <div className="sub" style={{ textTransform: "none", letterSpacing: 0, fontSize: 11.5, color: "var(--ink-3)" }}>
                {picked.customer_name ?? "—"}
              </div>
              <button
                type="button"
                className="btn btn-ghost btn-sm"
                onClick={() => setPicked(null)}
                style={{ marginTop: 8, padding: 0, minHeight: 20, fontSize: 11, color: "var(--ink-3)" }}
              >
                ← Pick another
              </button>
            </div>

            <div>
              <label className="fieldlbl">How to handle current session</label>
              <div className="card" style={{ padding: 0, overflow: "hidden" }}>
                <ModeRow
                  active={mode === "continue"}
                  onClick={() => setMode("continue")}
                  title="Continue elapsed"
                  desc="Keep timer running — minutes move to new SO"
                />
                <ModeRow
                  active={mode === "restart"}
                  onClick={() => setMode("restart")}
                  title="Pause & restart"
                  desc="Close current as draft (logs elapsed), start fresh clock-in"
                  isLast
                />
              </div>
            </div>

            <div>
              <label className="fieldlbl" style={{ display: "flex", alignItems: "center", gap: 6 }}>
                <input
                  type="checkbox"
                  checked={changeActivity}
                  onChange={(e) => setChangeActivity(e.target.checked)}
                />
                Also change activity (currently <b>{currentActivity}</b>)
              </label>
              {changeActivity && (
                <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginTop: 6 }}>
                  {ACTIVITIES.map((a) => (
                    <button
                      key={a.id}
                      type="button"
                      className="fchip"
                      data-on={activity === a.id || undefined}
                      onClick={() => setActivity(a.id)}
                    >
                      <Icon name={a.icon} size={14} /> {a.label}
                    </button>
                  ))}
                </div>
              )}
            </div>

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
          </>
        )}
      </div>
    </Sheet>
  );
}

function ModeRow({
  active,
  onClick,
  title,
  desc,
  isLast,
}: {
  active: boolean;
  onClick: () => void;
  title: string;
  desc: string;
  isLast?: boolean;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="row-link"
      style={{
        display: "flex",
        alignItems: "flex-start",
        gap: 10,
        padding: "10px 12px",
        width: "100%",
        textAlign: "left",
        background: active ? "var(--red-50)" : "transparent",
        border: 0,
        borderBottom: isLast ? "none" : "1px solid var(--line-2)",
        cursor: "pointer",
      }}
    >
      <span
        style={{
          width: 16,
          height: 16,
          borderRadius: 8,
          border: "2px solid",
          borderColor: active ? "var(--red)" : "var(--ink-4)",
          background: active ? "var(--red)" : "transparent",
          flex: "none",
          marginTop: 2,
        }}
      />
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: 13, fontWeight: 600, color: active ? "var(--red)" : "var(--ink)" }}>{title}</div>
        <div className="sub" style={{ textTransform: "none", letterSpacing: 0, fontSize: 11.5 }}>
          {desc}
        </div>
      </div>
    </button>
  );
}
