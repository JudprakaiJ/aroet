"use client";

import { useState } from "react";
import { Icon } from "@/components/icons";
import { bulkReparseBatch, type BatchResult } from "./actions";

type Counts = {
  totalWithPlannerNote: number;
  withoutSessions: number;
  withSessions: number;
};

type RunState = "idle" | "running" | "done" | "error";

type Totals = {
  total: number;
  processed: number;
  sessions: number;
  references: number;
  admin_log: number;
  errors: { so_number: string; error: string }[];
};

const emptyTotals: Totals = {
  total: 0,
  processed: 0,
  sessions: 0,
  references: 0,
  admin_log: 0,
  errors: [],
};

export function ReparseClient({ counts }: { counts: Counts }) {
  const [onlyEmpty, setOnlyEmpty] = useState(false);
  const [state, setState] = useState<RunState>("idle");
  const [totals, setTotals] = useState<Totals>(emptyTotals);
  const [progressLabel, setProgressLabel] = useState<string>("");
  const [lastBatchAt, setLastBatchAt] = useState<number | null>(null);

  const expected = onlyEmpty ? counts.withoutSessions : counts.totalWithPlannerNote;
  const pct = totals.total > 0 ? Math.min(100, Math.round((totals.processed / totals.total) * 100)) : 0;

  const start = async () => {
    setState("running");
    setTotals(emptyTotals);
    setProgressLabel("Starting…");

    let batchStart = 0;
    const acc: Totals = { ...emptyTotals };

    try {
      while (true) {
        const b: BatchResult = await bulkReparseBatch(batchStart, { onlyEmpty });
        acc.total = b.total;
        acc.processed += b.processed;
        acc.sessions += b.sessions;
        acc.references += b.references;
        acc.admin_log += b.admin_log;
        if (b.errors.length > 0) acc.errors.push(...b.errors);

        setTotals({ ...acc });
        setProgressLabel(
          `Batch ${batchStart + 1}–${b.batchEnd} of ${b.total}`
        );
        setLastBatchAt(Date.now());

        if (!b.hasMore) break;
        batchStart = b.batchEnd;
      }
      setState("done");
      setProgressLabel("Finished");
    } catch (e) {
      setState("error");
      setProgressLabel((e as Error).message);
    }
  };

  return (
    <div style={{ padding: "0 14px 32px", display: "flex", flexDirection: "column", gap: 12 }}>
      {/* Counts card */}
      <div className="card" style={{ padding: 14 }}>
        <div className="kicker" style={{ marginBottom: 6 }}>
          Current state
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 10 }}>
          <Stat label="With planner note" value={counts.totalWithPlannerNote} />
          <Stat label="Already parsed" value={counts.withSessions} accent="ok" />
          <Stat label="Not yet parsed" value={counts.withoutSessions} accent="warn" />
        </div>
      </div>

      {/* Controls */}
      <div className="card" style={{ padding: 14 }}>
        <div className="kicker" style={{ marginBottom: 8 }}>
          Run
        </div>
        <label
          style={{
            display: "flex",
            alignItems: "center",
            gap: 10,
            padding: "6px 0",
            cursor: state === "running" ? "default" : "pointer",
          }}
        >
          <span style={{ flex: 1, fontSize: 13, color: "var(--ink-2)", fontWeight: 500 }}>
            Only cases without parsed sessions
            <div className="sub" style={{ textTransform: "none", letterSpacing: 0, fontSize: 11, color: "var(--ink-3)", marginTop: 2 }}>
              {onlyEmpty
                ? "Skips cases that already have planner sessions."
                : "Re-parses every case — old planner rows are deleted first."}
            </div>
          </span>
          <span
            role="switch"
            aria-checked={onlyEmpty}
            className="switch"
            data-on={onlyEmpty}
            onClick={() => state !== "running" && setOnlyEmpty((v) => !v)}
          />
        </label>

        <div
          style={{
            display: "flex",
            gap: 8,
            marginTop: 10,
            paddingTop: 10,
            borderTop: "1px solid var(--line-2)",
            alignItems: "center",
          }}
        >
          <button
            type="button"
            className="btn btn-primary"
            disabled={state === "running" || expected === 0}
            onClick={start}
          >
            {state === "running" ? "Running…" : state === "done" ? "Run again" : `Start (${expected} cases)`}
          </button>
          <div
            className="sub"
            style={{
              flex: 1,
              textTransform: "none",
              letterSpacing: 0,
              fontSize: 11.5,
              color: "var(--ink-3)",
            }}
          >
            Batches of 25 cases. Sessions, references, admin log entries with{" "}
            <span className="mono">source = &lsquo;planner&rsquo;</span> are deleted and re-inserted. Manual entries are untouched.
          </div>
        </div>
      </div>

      {/* Progress card */}
      {state !== "idle" && (
        <div className="card" style={{ padding: 14 }}>
          <div className="kicker" style={{ marginBottom: 8, color: state === "error" ? "var(--danger)" : undefined }}>
            {state === "running" ? "Processing" : state === "done" ? "Result" : "Error"}
          </div>

          <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 8 }}>
            <div
              style={{
                flex: 1,
                height: 10,
                borderRadius: 999,
                background: "var(--surface-2)",
                overflow: "hidden",
              }}
            >
              <div
                style={{
                  width: `${pct}%`,
                  height: "100%",
                  background: state === "error" ? "var(--danger)" : "var(--red)",
                  transition: "width .25s",
                }}
              />
            </div>
            <span className="mono" style={{ fontSize: 12, fontWeight: 700, color: "var(--ink)" }}>
              {pct}%
            </span>
          </div>
          <div
            className="sub"
            style={{
              textTransform: "none",
              letterSpacing: 0,
              fontSize: 11.5,
              color: state === "error" ? "var(--danger)" : "var(--ink-3)",
              marginBottom: 8,
            }}
          >
            {progressLabel}
            {lastBatchAt && state === "running" && (
              <span style={{ marginLeft: 6, opacity: 0.7 }}>
                · last update {Math.max(0, Math.round((Date.now() - lastBatchAt) / 1000))}s ago
              </span>
            )}
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 10 }}>
            <Stat label="Cases" value={`${totals.processed}/${totals.total}`} />
            <Stat label="Sessions" value={totals.sessions} accent="ok" />
            <Stat label="References" value={totals.references} />
            <Stat label="Admin log" value={totals.admin_log} />
          </div>
        </div>
      )}

      {/* Errors */}
      {totals.errors.length > 0 && (
        <div className="card" style={{ padding: 14 }}>
          <div className="kicker" style={{ marginBottom: 8, color: "var(--danger)" }}>
            Errors · {totals.errors.length}
          </div>
          <div style={{ maxHeight: 260, overflow: "auto", display: "flex", flexDirection: "column", gap: 4 }}>
            {totals.errors.map((e, i) => (
              <div
                key={i}
                style={{
                  fontSize: 12,
                  padding: 8,
                  borderRadius: 6,
                  background: "var(--danger-soft)",
                  color: "var(--danger)",
                  display: "flex",
                  gap: 8,
                  alignItems: "flex-start",
                }}
              >
                <Icon name="alert" size={12} />
                <div style={{ flex: 1 }}>
                  <span className="mono" style={{ fontWeight: 700 }}>
                    {e.so_number}
                  </span>
                  <div style={{ marginTop: 2 }}>{e.error}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function Stat({
  label,
  value,
  accent,
}: {
  label: string;
  value: number | string;
  accent?: "ok" | "warn" | "danger";
}) {
  const color =
    accent === "ok"
      ? "var(--ok)"
      : accent === "warn"
        ? "var(--warn)"
        : accent === "danger"
          ? "var(--danger)"
          : "var(--ink)";
  return (
    <div className="card-flat" style={{ padding: 10 }}>
      <div className="kicker" style={{ fontSize: 9.5 }}>
        {label}
      </div>
      <div
        className="mono"
        style={{ fontSize: 20, fontWeight: 700, color, marginTop: 4, lineHeight: 1.1 }}
      >
        {value}
      </div>
    </div>
  );
}
