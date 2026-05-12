"use client";

import { useState, useRef } from "react";
import Link from "next/link";
import { bulkReparseBatch, type BatchResult } from "./actions";

interface Props {
  counts: {
    totalWithPlannerNote: number;
    withoutSessions: number;
    withSessions: number;
  };
}

interface Progress {
  current: number;
  total: number;
  sessions: number;
  references: number;
  admin_log: number;
  errors: BatchResult["errors"];
  finished: boolean;
  stopped: boolean;
}

export default function BulkReparseForm({ counts }: Props) {
  const [scope, setScope] = useState<"all" | "empty">("empty");
  const [running, setRunning] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [progress, setProgress] = useState<Progress | null>(null);
  const stopRef = useRef(false);

  const targetCount = scope === "empty" ? counts.withoutSessions : counts.totalWithPlannerNote;

  async function handleRun() {
    setConfirmOpen(false);
    setRunning(true);
    stopRef.current = false;

    let cursor = 0;
    let acc: Progress = {
      current: 0, total: 0,
      sessions: 0, references: 0, admin_log: 0,
      errors: [], finished: false, stopped: false,
    };
    setProgress(acc);

    try {
      while (!stopRef.current) {
        const b = await bulkReparseBatch(cursor, { onlyEmpty: scope === "empty" });
        acc = {
          current: b.batchEnd,
          total: b.total,
          sessions: acc.sessions + b.sessions,
          references: acc.references + b.references,
          admin_log: acc.admin_log + b.admin_log,
          errors: [...acc.errors, ...b.errors],
          finished: !b.hasMore,
          stopped: false,
        };
        setProgress({ ...acc });
        if (!b.hasMore) break;
        cursor = b.batchEnd;
      }
      if (stopRef.current) {
        setProgress({ ...acc, stopped: true });
      }
    } catch (e) {
      alert("Batch failed: " + (e as Error).message);
    } finally {
      setRunning(false);
    }
  }

  function handleStop() {
    stopRef.current = true;
  }

  const pct = progress && progress.total > 0
    ? Math.round((progress.current / progress.total) * 100)
    : 0;

  return (
    <div className="max-w-3xl mx-auto px-4 py-5">
      <div className="mb-3">
        <Link href="/cases" className="text-xs hover:underline" style={{ color: "#C8102E" }}>
          ← Cases
        </Link>
      </div>

      <h1 className="text-xl font-semibold text-slate-900 mb-1">Bulk re-parse planner notes</h1>
      <p className="text-xs text-slate-500 mb-5">
        Re-runs parser v5 on cases with planner_note. Deletes existing parsed (source=&apos;planner&apos;) data and
        replaces it. Manual entries are kept.
      </p>

      <div className="bg-white border border-slate-200 rounded-lg p-4 mb-4">
        <h2 className="text-sm font-semibold mb-3">Current state</h2>
        <div className="grid grid-cols-3 gap-3 text-xs">
          <div>
            <div className="text-slate-500">Cases with planner_note</div>
            <div className="text-xl font-bold">{counts.totalWithPlannerNote}</div>
          </div>
          <div>
            <div className="text-slate-500">Already parsed</div>
            <div className="text-xl font-bold">{counts.withSessions}</div>
          </div>
          <div>
            <div className="text-slate-500">Never parsed</div>
            <div className="text-xl font-bold" style={{ color: "#993556" }}>{counts.withoutSessions}</div>
          </div>
        </div>
      </div>

      <div className="bg-white border border-slate-200 rounded-lg p-4 mb-4">
        <h2 className="text-sm font-semibold mb-3">Scope</h2>
        <div className="space-y-2">
          <label className="flex items-center gap-2 cursor-pointer text-xs">
            <input
              type="radio"
              name="scope"
              checked={scope === "empty"}
              onChange={() => setScope("empty")}
              disabled={running}
            />
            <span>
              Only cases never parsed (<strong>{counts.withoutSessions}</strong>) — safest
            </span>
          </label>
          <label className="flex items-center gap-2 cursor-pointer text-xs">
            <input
              type="radio"
              name="scope"
              checked={scope === "all"}
              onChange={() => setScope("all")}
              disabled={running}
            />
            <span>
              All cases with planner_note (<strong>{counts.totalWithPlannerNote}</strong>) — re-parses everything
            </span>
          </label>
        </div>
      </div>

      <div className="flex gap-2 mb-4">
        {!running ? (
          <button
            onClick={() => setConfirmOpen(true)}
            disabled={targetCount === 0}
            className="text-sm px-4 py-2 rounded-md font-medium"
            style={{
              background: targetCount === 0 ? "#cbd5e1" : "#C8102E",
              color: "white",
            }}
          >
            ⚡ Run on {targetCount} cases
          </button>
        ) : (
          <button
            onClick={handleStop}
            className="text-sm px-4 py-2 rounded-md font-medium bg-slate-600 text-white hover:bg-slate-700"
          >
            ⏹ Stop
          </button>
        )}
      </div>

      {progress && (
        <div className="bg-white border border-slate-200 rounded-lg p-4 mb-4">
          <div className="flex justify-between items-center mb-2">
            <h3 className="text-sm font-semibold">
              {progress.finished
                ? "✅ Complete"
                : progress.stopped
                ? "⏹ Stopped"
                : "⏳ Running..."}
            </h3>
            <span className="text-xs text-slate-500">
              {progress.current} / {progress.total} ({pct}%)
            </span>
          </div>
          <div className="w-full bg-slate-200 rounded-full h-2 mb-3 overflow-hidden">
            <div
              className="h-full rounded-full transition-all"
              style={{
                width: `${pct}%`,
                background: progress.finished ? "#16a34a" : "#C8102E",
              }}
            />
          </div>
          <div className="grid grid-cols-3 gap-3 text-xs">
            <div>
              <div className="text-slate-500">Sessions</div>
              <div className="text-lg font-bold">{progress.sessions}</div>
            </div>
            <div>
              <div className="text-slate-500">References</div>
              <div className="text-lg font-bold">{progress.references}</div>
            </div>
            <div>
              <div className="text-slate-500">Admin events</div>
              <div className="text-lg font-bold">{progress.admin_log}</div>
            </div>
          </div>
          {progress.errors.length > 0 && (
            <details className="mt-3 text-xs">
              <summary className="cursor-pointer text-red-600">
                {progress.errors.length} errors — click to expand
              </summary>
              <div className="mt-2 max-h-60 overflow-y-auto bg-slate-50 p-2 rounded">
                {progress.errors.map((err, i) => (
                  <div key={i} className="font-mono text-[10px]">
                    <strong>{err.so_number}</strong>: {err.error}
                  </div>
                ))}
              </div>
            </details>
          )}
        </div>
      )}

      {confirmOpen && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-5 max-w-md mx-4">
            <h3 className="text-sm font-semibold mb-2">Confirm bulk re-parse</h3>
            <p className="text-xs text-slate-600 mb-4">
              This will delete <strong>all planner-sourced</strong> sessions, references, and admin log entries
              for <strong>{targetCount} cases</strong>, then re-create them from current planner_note.
              <br />
              <br />
              Manual entries (source=&apos;manual&apos;) will be kept.
              <br />
              <br />
              Processed in batches of 25. You can stop anytime.
            </p>
            <div className="flex justify-end gap-2">
              <button
                onClick={() => setConfirmOpen(false)}
                className="text-xs px-3 py-1.5 border border-slate-300 rounded text-slate-700"
              >
                Cancel
              </button>
              <button
                onClick={handleRun}
                className="text-xs px-3 py-1.5 rounded font-medium text-white"
                style={{ background: "#C8102E" }}
              >
                Yes, run
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
