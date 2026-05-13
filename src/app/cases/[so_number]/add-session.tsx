"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { addSession } from "./session-actions";

interface Engineer {
  code: string;
  full_name: string;
  role: string;
}

interface Machine {
  machine_no: string;
  is_primary?: boolean;
}

export default function AddSessionButton({
  so_number,
  engineers,
  machines,
  defaultEngineer,
}: {
  so_number: string;
  engineers: Engineer[];
  machines: Machine[];
  defaultEngineer?: string;
}) {
  const [open, setOpen] = useState(false);

  if (!open) {
    return (
      <button
        onClick={() => setOpen(true)}
        className="text-[13px] px-4 py-2 rounded-lg font-medium text-white inline-flex items-center gap-1.5"
        style={{ background: "#C8102E" }}
      >
        <span className="text-lg leading-none">+</span> Add session
      </button>
    );
  }

  return (
    <AddSessionForm
      so_number={so_number}
      engineers={engineers}
      machines={machines}
      defaultEngineer={defaultEngineer}
      onClose={() => setOpen(false)}
    />
  );
}

function AddSessionForm({
  so_number,
  engineers,
  machines,
  defaultEngineer,
  onClose,
}: {
  so_number: string;
  engineers: Engineer[];
  machines: Machine[];
  defaultEngineer?: string;
  onClose: () => void;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [form, setForm] = useState({
    session_date: new Date().toISOString().split("T")[0],
    engineer_code: defaultEngineer || engineers[0]?.code || "",
    activity_type: "field",
    start_time: "09:00",
    end_time: "12:00",
    break_minutes: 0,
    machine_no: machines.find((m) => m.is_primary)?.machine_no || machines[0]?.machine_no || "",
    work_done: "",
    submit_immediately: false,
  });
  const [error, setError] = useState("");

  // Calculate duration
  const toMin = (t: string) => {
    const [h, m] = t.split(":").map(Number);
    return h * 60 + m;
  };
  const startMin = toMin(form.start_time);
  const endMin = toMin(form.end_time);
  const duration = Math.max(0, endMin - startMin - form.break_minutes);
  const hours = Math.floor(duration / 60);
  const mins = duration % 60;

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");

    if (duration <= 0) {
      setError("End time must be after start time");
      return;
    }

    startTransition(async () => {
      const result = await addSession({
        so_number,
        machine_no: form.machine_no || null,
        engineer_code: form.engineer_code,
        session_date: form.session_date,
        activity_type: form.activity_type,
        start_minutes: startMin,
        end_minutes: endMin,
        break_minutes: form.break_minutes,
        work_done: form.work_done,
        submit_immediately: form.submit_immediately,
      });
      if (result.success) {
        onClose();
        router.refresh();
      } else {
        setError(result.error || "Failed");
      }
    });
  }

  const activities = [
    { value: "field", label: "Field", bg: "#E6F1FB", fg: "#0C447C" },
    { value: "travel", label: "Travel", bg: "#FBEAF0", fg: "#4B1528" },
    { value: "remote", label: "Remote", bg: "#EEEDFE", fg: "#26215C" },
    { value: "training", label: "Training", bg: "#FAEEDA", fg: "#412402" },
    { value: "upgrade", label: "Upgrade", bg: "#EAF3DE", fg: "#173404" },
    { value: "office", label: "Office", bg: "#F1EFE8", fg: "#2C2C2A" },
  ];

  return (
    <div className="bg-white border border-slate-200 rounded-xl p-5 mb-3 shadow-sm">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-[15px] font-semibold">Add session</h3>
        <button onClick={onClose} className="text-slate-400 hover:text-slate-600 text-lg">
          ✕
        </button>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-2.5 mb-3 text-[12px] text-red-700">⚠ {error}</div>
      )}

      <form onSubmit={handleSubmit} className="space-y-3">
        <div className="grid grid-cols-2 gap-3">
          <Field label="Date" required>
            <input
              type="date"
              value={form.session_date}
              onChange={(e) => setForm({ ...form, session_date: e.target.value })}
              className="form-inp"
            />
          </Field>
          <Field label="Engineer" required>
            <select
              value={form.engineer_code}
              onChange={(e) => setForm({ ...form, engineer_code: e.target.value })}
              className="form-inp"
            >
              {engineers.map((e) => (
                <option key={e.code} value={e.code}>
                  {e.code} — {e.full_name}
                </option>
              ))}
            </select>
          </Field>
        </div>

        <Field label="Activity" required>
          <div className="flex gap-1.5 flex-wrap">
            {activities.map((a) => {
              const isActive = form.activity_type === a.value;
              return (
                <button
                  key={a.value}
                  type="button"
                  onClick={() => setForm({ ...form, activity_type: a.value })}
                  className="text-[12px] px-3 py-1.5 rounded-md font-medium transition-colors"
                  style={
                    isActive
                      ? { background: a.bg, color: a.fg, border: `1.5px solid ${a.fg}` }
                      : { background: "white", color: "#1a1a1a", border: "1px solid #e2e8f0" }
                  }
                >
                  {a.label}
                </button>
              );
            })}
          </div>
        </Field>

        <div className="grid grid-cols-4 gap-3">
          <Field label="Start" required>
            <input
              type="time"
              value={form.start_time}
              onChange={(e) => setForm({ ...form, start_time: e.target.value })}
              className="form-inp"
            />
          </Field>
          <Field label="End" required>
            <input
              type="time"
              value={form.end_time}
              onChange={(e) => setForm({ ...form, end_time: e.target.value })}
              className="form-inp"
            />
          </Field>
          <Field label="Break (min)">
            <input
              type="number"
              value={form.break_minutes}
              onChange={(e) => setForm({ ...form, break_minutes: parseInt(e.target.value) || 0 })}
              className="form-inp"
              min={0}
              max={240}
            />
          </Field>
          <Field label="Duration">
            <div
              className="form-inp"
              style={{
                background: "#F8FAFC",
                fontWeight: 600,
                color: duration > 0 ? "#185FA5" : "#94A3B8",
              }}
            >
              {hours}h {mins > 0 ? `${mins}m` : ""}
            </div>
          </Field>
        </div>

        {machines.length > 0 && (
          <Field label="Machine">
            <select
              value={form.machine_no}
              onChange={(e) => setForm({ ...form, machine_no: e.target.value })}
              className="form-inp"
            >
              <option value="">— None —</option>
              {machines.map((m) => (
                <option key={m.machine_no} value={m.machine_no}>
                  {m.machine_no} {m.is_primary ? "⭐ (primary)" : ""}
                </option>
              ))}
            </select>
          </Field>
        )}

        <Field label="Notes">
          <textarea
            value={form.work_done}
            onChange={(e) => setForm({ ...form, work_done: e.target.value })}
            placeholder="What did you do? Any issues?"
            rows={2}
            className="form-inp"
          />
        </Field>

        <div className="flex items-center justify-between pt-2 border-t border-slate-100">
          <label className="flex items-center gap-2 text-[12px] text-slate-600">
            <input
              type="checkbox"
              checked={form.submit_immediately}
              onChange={(e) => setForm({ ...form, submit_immediately: e.target.checked })}
            />
            Submit for approval immediately
          </label>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-lg text-[13px] border border-slate-300 bg-white"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={pending || duration <= 0}
              className="px-5 py-2 rounded-lg text-[13px] text-white disabled:opacity-50"
              style={{ background: "#C8102E" }}
            >
              {pending ? "Saving..." : "✓ Save session"}
            </button>
          </div>
        </div>
      </form>

      <style jsx>{`
        .form-inp {
          width: 100%;
          padding: 8px 10px;
          font-size: 13px;
          border: 1px solid #e2e8f0;
          border-radius: 6px;
          background: white;
        }
        .form-inp:focus {
          outline: none;
          border-color: #c8102e;
          box-shadow: 0 0 0 3px rgba(200, 16, 46, 0.08);
        }
      `}</style>
    </div>
  );
}

function Field({ label, required, children }: { label: string; required?: boolean; children: React.ReactNode }) {
  return (
    <div>
      <label className="block text-[12px] font-medium text-slate-600 mb-1">
        {label}
        {required && <span style={{ color: "#C8102E" }}> *</span>}
      </label>
      {children}
    </div>
  );
}
