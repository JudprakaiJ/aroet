"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { bulkReparse, type BulkResult } from "./actions";

interface Props {
  counts: {
    totalWithPlannerNote: number;
    withoutSessions: number;
    withSessions: number;
  };
}

export default function BulkReparseForm({ counts }: Props) {
  const [isPending, startTransition] = useTransition();
  const [result, setResult] = useState<BulkResult | null>(null);
  const [scope, setScope] = useState<"all" | "empty">("empty");
  const [confirmOpen, setConfirmOpen] = useState(false);

  const targetCount = scope === "empty" ? counts.withoutSessions : counts.totalWithPlannerNote;

  function handleRun() {
    setConfirmOpen(false);
    setResult(null);
    startTransition(async () => {
      try {
        const r = await bulkReparse({ onlyEmpty: scope === "empty" });
        setResult(r);
      } catch (e) {
        alert("Bulk re-parse failed: " + (e as Error).message);
      }
    });
  }

  return (
    <div className="max-w-3xl mx-auto px-4 py-5">
      <div className="mb-3">
        <Link href="/cases" className="text-xs hover:underline" style={{ color: "#C8102E" }}>
          ← Cases
        </Link>
      </div>

      <div className="bg-white border border-slate-200 rounded-lg p-5">
        <h1 className="text-lg font-semibold mb-1">Bulk re-parse cases</h1>
        <p className="text-xs text-slate-500 mb-4">
          Re-runs the parser against all cases that have a planner_note. Use this once after migration or after parser upgrades.
        </p>

        <div className="grid grid-cols-3 gap-3 mb-5">
          <div className="bg-slate-50 border border-slate-200 rounded p-3">
            <div className="text-[10px] text-slate-500">Cases with planner_note</div>
            <div className="text-xl font-semibold mt-0.5">{counts.totalWithPlannerNote}</div>
          </div>
          <div className="bg-amber-50 border border-amber-200 rounded p-3">
            <div className="text-[10px] text-amber-700">Without parsed sessions</div>
            <div className="text-xl font-semibold mt-0.5 text-amber-900">{counts.withoutSessions}</div>
          </div>
          <div className="bg-green-50 border border-green-200 rounded p-3">
            <div className="text-[10px] text-green-700">Already have sessions</div>
            <div className="text-xl font-semibold mt-0.5 text-green-900">{counts.withSessions}</div>
          </div>
        </div>

        <div className="border border-slate-200 rounded-md p-3 mb-4">
          <div className="text-xs font-medium text-slate-700 mb-2">Scope</div>
          <div className="space-y-2">
            <label className="flex items-start gap-2 cursor-pointer">
              <input
                type="radio"
                name="scope"
                checked={scope === "empty"}
                onChange={() => setScope("empty")}
                className="mt-0.5"
              />
              <div>
                <div className="text-xs font-medium">Only empty cases ({counts.withoutSessions})</div>
                <div className="text-[11px] text-slate-500">
                  Process cases that have a planner_note but no parsed sessions yet. <strong>Recommended for first run.</strong>
                </div>
              </div>
            </label>
            <label className="flex items-start gap-2 cursor-pointer">
              <input
                type="radio"
                name="scope"
                checked={scope === "all"}
                onChange={() => setScope("all")}
                className="mt-0.5"
              />
              <div>
                <div className="text-xs font-medium">All cases ({counts.totalWithPlannerNote})</div>
                <div className="text-[11px] text-slate-500">
                  Delete + re-parse for all cases. <strong>Use after parser upgrade.</strong> Manual sessions are preserved.
                </div>
              </div>
            </label>
          </div>
        </div>

        <div className="bg-amber-50 border border-amber-300 rounded-md p-3 mb-4 text-xs text-amber-900">
          <strong>⚠ What this does:</strong>
          <ul className="list-disc pl-5 mt-1 space-y-0.5">
            <li>Delete all sessions/references/admin_log where <code className="bg-amber-100 px-1 rounded">source = 'planner'</code></li>
            <li>Re-run parser on each case&apos;s planner_note</li>
            <li>Insert fresh parsed data</li>
            <li><strong>Manual entries are NOT touched</strong></li>
          </ul>
        </div>

        <div className="flex gap-2">
          <button
            onClick={() => setConfirmOpen(true)}
            disabled={isPending || targetCount === 0}
            className="text-sm px-4 py-2 rounded font-medium disabled:opacity-50"
            style={{ background: "#C8102E", color: "white" }}
          >
            {isPending ? "Processing..." : `Re-parse ${targetCount} cases`}
          </button>
          <Link href="/cases" className="text-sm px-4 py-2 rounded border border-slate-300">
            Cancel
          </Link>
        </div>

        {result && (
          <div className="mt-5 bg-green-50 border border-green-300 rounded-md p-3">
            <div className="text-sm font-semibold text-green-900 mb-2">
              ✓ Done — processed {result.processed} of {result.total} cases
            </div>
            <div className="grid grid-cols-3 gap-3 text-xs">
              <div>
                <div className="text-green-700 text-[10px]">Sessions inserted</div>
                <div className="font-semibold text-green-900">{result.sessions}</div>
              </div>
              <div>
                <div className="text-green-700 text-[10px]">References inserted</div>
                <div className="font-semibold text-green-900">{result.references}</div>
              </div>
              <div>
                <div className="text-green-700 text-[10px]">Admin events inserted</div>
                <div className="font-semibold text-green-900">{result.admin_log}</div>
              </div>
            </div>
            {result.errors.length > 0 && (
              <div className="mt-3 pt-3 border-t border-green-300">
                <div className="text-xs font-semibold text-red-800 mb-1">
                  {result.errors.length} errors:
                </div>
                <div className="max-h-40 overflow-y-auto text-[10px] font-mono text-red-700 space-y-0.5">
                  {result.errors.slice(0, 20).map((e, i) => (
                    <div key={i}>
                      <strong>{e.so_number}</strong>: {e.error}
                    </div>
                  ))}
                  {result.errors.length > 20 && (
                    <div className="italic">+ {result.errors.length - 20} more</div>
                  )}
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {confirmOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
          style={{ background: "rgba(0,0,0,0.5)" }}
          onClick={() => setConfirmOpen(false)}
        >
          <div
            className="bg-white rounded-lg p-5 max-w-sm w-full"
            onClick={(e) => e.stopPropagation()}
          >
            <h2 className="text-base font-semibold mb-2">Confirm bulk re-parse</h2>
            <p className="text-xs text-slate-600 mb-4">
              About to re-parse <strong>{targetCount} cases</strong>. This may take 30-60 seconds.
              <br /><br />
              Manual entries will NOT be deleted.
            </p>
            <div className="flex gap-2 justify-end">
              <button
                onClick={() => setConfirmOpen(false)}
                className="text-xs px-3 py-1.5 rounded border border-slate-300"
              >
                Cancel
              </button>
              <button
                onClick={handleRun}
                className="text-xs px-3 py-1.5 rounded font-medium"
                style={{ background: "#C8102E", color: "white" }}
              >
                Yes, re-parse {targetCount} cases
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
