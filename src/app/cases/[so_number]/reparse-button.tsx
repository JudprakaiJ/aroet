"use client";

import { useTransition, useState } from "react";
import { reparseCase } from "./actions";

export default function ReparseButton({
  so_number,
  hasParsed,
}: {
  so_number: string;
  hasParsed: boolean;
}) {
  const [isPending, startTransition] = useTransition();
  const [showConfirm, setShowConfirm] = useState(false);
  const [result, setResult] = useState<{ sessions: number; references: number; admin_log: number } | null>(null);

  function handleClick() {
    if (hasParsed) {
      setShowConfirm(true);
    } else {
      doReparse();
    }
  }

  function doReparse() {
    setShowConfirm(false);
    startTransition(async () => {
      try {
        const r = await reparseCase(so_number);
        setResult(r);
        setTimeout(() => setResult(null), 4000);
      } catch (e) {
        alert("Re-parse failed: " + (e as Error).message);
      }
    });
  }

  return (
    <>
      <button
        onClick={handleClick}
        disabled={isPending}
        className="text-xs px-3 py-1.5 rounded bg-white border border-green-300 text-green-700 font-medium"
      >
        {isPending ? "Parsing..." : "🔄 Re-parse"}
      </button>

      {showConfirm && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
          style={{ background: "rgba(0,0,0,0.5)" }}
          onClick={() => setShowConfirm(false)}
        >
          <div
            className="bg-white rounded-lg p-5 max-w-sm w-full"
            onClick={(e) => e.stopPropagation()}
          >
            <h2 className="text-base font-semibold mb-2">Re-parse planner note?</h2>
            <p className="text-xs text-slate-600 mb-4">
              This will <strong>delete all parsed sessions, references, and admin log entries</strong> for this case
              and re-create them from the current planner note.
              <br /><br />
              <strong>Manual entries will NOT be deleted.</strong>
            </p>
            <div className="flex gap-2 justify-end">
              <button
                onClick={() => setShowConfirm(false)}
                className="text-xs px-3 py-1.5 rounded border border-slate-300"
              >
                Cancel
              </button>
              <button
                onClick={doReparse}
                className="text-xs px-3 py-1.5 rounded font-medium"
                style={{ background: "#C8102E", color: "white" }}
              >
                Re-parse now
              </button>
            </div>
          </div>
        </div>
      )}

      {result && (
        <div className="fixed bottom-4 right-4 z-50 bg-green-50 border border-green-300 rounded-md p-3 text-xs text-green-900 shadow-lg">
          ✓ Re-parsed: {result.sessions} sessions · {result.references} refs · {result.admin_log} events
        </div>
      )}
    </>
  );
}
