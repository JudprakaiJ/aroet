"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { fmtDate, fmtDateLong } from "@/lib/format";
import { updateMachine, deleteMachine } from "../actions";

interface Machine {
  machine_no: string;
  name?: string | null;
  product_code?: string | null;
  serial_no?: string | null;
  customer_code?: string | null;
  customer_name?: string | null;
  version?: string | null;
  warranty_expiry?: string | null;
  installation_date?: string | null;
  notes?: string | null;
}

interface Case {
  so_number: string;
  status: string;
  service_type_name?: string | null;
  service_type_code?: string | null;
  due_date?: string | null;
  close_date?: string | null;
  customer_name?: string | null;
  title?: string | null;
}

interface Customer {
  code: string;
  name: string;
  city?: string | null;
}

const STATUS_COLORS: Record<string, { bg: string; fg: string }> = {
  planned: { bg: "#DDEBF7", fg: "#185FA5" },
  in_progress: { bg: "#FAEEDA", fg: "#6B3D04" },
  completed: { bg: "#D1FAE5", fg: "#065F46" },
  verified: { bg: "#D1FAE5", fg: "#065F46" },
  canceled: { bg: "#F1F5F9", fg: "#475569" },
};

export default function MachineDetailClient({
  machine,
  cases,
  customers,
}: {
  machine: Machine;
  cases: Case[];
  customers: Customer[];
}) {
  const router = useRouter();
  const [showEdit, setShowEdit] = useState(false);
  const [showDelete, setShowDelete] = useState(false);

  const pmCount = cases.filter((c) => c.service_type_code === "7507").length;
  const curativeCount = cases.filter((c) => ["7505", "7515"].includes(c.service_type_code ?? "")).length;

  return (
    <div className="max-w-5xl mx-auto px-6 py-8">
      <div className="mb-4">
        <Link href="/machines" className="text-[13px] font-medium hover:underline" style={{ color: "#C8102E" }}>
          ← Back to machines
        </Link>
      </div>

      {/* Header */}
      <div className="bg-white border border-slate-200 rounded-2xl p-6 mb-5">
        <div className="flex items-start justify-between gap-4 mb-4">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-3 mb-2 flex-wrap">
              <h1 className="font-mono text-[24px] font-bold leading-tight">{machine.machine_no}</h1>
              {machine.version && machine.version !== "N/A" && (
                <span className="text-[11px] px-2 py-1 rounded-md font-medium" style={{ background: "#EDE9FE", color: "#5B21B6" }}>
                  {machine.version}
                </span>
              )}
              {(!machine.version || machine.version === "N/A") && (
                <span className="text-[11px] px-2 py-1 rounded-md font-medium" style={{ background: "#FAEEDA", color: "#BA7517" }}>
                  Unknown version
                </span>
              )}
            </div>
            <p className="text-[14px] text-slate-700">{machine.name ?? "—"}</p>
            {machine.customer_name && (
              <p className="text-[13px] text-slate-500 mt-1">
                {machine.customer_code && (
                  <Link href={`/customers/${machine.customer_code}`} className="hover:underline" style={{ color: "#C8102E" }}>
                    {machine.customer_name}
                  </Link>
                )}
              </p>
            )}
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => setShowEdit(true)}
              className="text-[13px] px-4 py-2 rounded-lg font-medium border border-slate-300 bg-white hover:bg-slate-50"
            >
              ✎ Edit
            </button>
            <button
              onClick={() => setShowDelete(true)}
              className="text-[13px] px-4 py-2 rounded-lg font-medium border bg-white hover:bg-red-50"
              style={{ color: "#C8102E", borderColor: "#FECDD3" }}
            >
              🗑 Delete
            </button>
          </div>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-x-6 gap-y-3 text-[13px] pt-4 border-t border-slate-100">
          <Info label="Product code" value={machine.product_code} mono />
          <Info label="Serial" value={machine.serial_no} mono />
          <Info label="Installed" value={fmtDate(machine.installation_date)} />
          <Info label="Warranty" value={fmtDateLong(machine.warranty_expiry)} />
        </div>

        {machine.notes && (
          <div className="mt-4 pt-4 border-t border-slate-100">
            <div className="text-[11px] uppercase tracking-wider text-slate-500 mb-1.5 font-semibold">Notes</div>
            <div className="text-[13px] text-slate-700 whitespace-pre-wrap">{machine.notes}</div>
          </div>
        )}
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4 mb-5">
        <div className="bg-white border border-slate-200 rounded-2xl p-5">
          <div className="text-[12px] text-slate-500 font-medium mb-1.5">Total cases</div>
          <div className="text-[28px] font-bold leading-none">{cases.length}</div>
        </div>
        <div className="bg-white border border-slate-200 rounded-2xl p-5">
          <div className="text-[12px] text-slate-500 font-medium mb-1.5">PM cases</div>
          <div className="text-[28px] font-bold leading-none" style={{ color: "#185FA5" }}>{pmCount}</div>
        </div>
        <div className="bg-white border border-slate-200 rounded-2xl p-5">
          <div className="text-[12px] text-slate-500 font-medium mb-1.5">Curative</div>
          <div className="text-[28px] font-bold leading-none" style={{ color: "#993556" }}>{curativeCount}</div>
        </div>
      </div>

      {/* Service history */}
      <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden">
        <div className="px-5 py-4 border-b border-slate-200">
          <h2 className="text-[17px] font-semibold">Service history</h2>
          <p className="text-[13px] text-slate-500 mt-0.5">
            All cases that referenced this machine
          </p>
        </div>
        {cases.length === 0 ? (
          <div className="p-10 text-center text-[13px] text-slate-400">No service history yet</div>
        ) : (
          <table className="w-full text-[13px]">
            <thead className="bg-slate-50 text-slate-600 border-b border-slate-200">
              <tr className="text-left">
                <th className="px-5 py-3 font-semibold text-[12px] uppercase tracking-wider w-32">SO</th>
                <th className="px-5 py-3 font-semibold text-[12px] uppercase tracking-wider w-28">Status</th>
                <th className="px-5 py-3 font-semibold text-[12px] uppercase tracking-wider w-36">Type</th>
                <th className="px-5 py-3 font-semibold text-[12px] uppercase tracking-wider">Title</th>
                <th className="px-5 py-3 font-semibold text-[12px] uppercase tracking-wider w-28">Due</th>
                <th className="px-5 py-3 font-semibold text-[12px] uppercase tracking-wider w-28">Closed</th>
              </tr>
            </thead>
            <tbody>
              {cases.map((c) => {
                const s = STATUS_COLORS[c.status] || { bg: "#F1F5F9", fg: "#475569" };
                return (
                  <tr key={c.so_number} className="border-b border-slate-100 hover:bg-slate-50 transition-colors">
                    <td className="px-5 py-3">
                      <Link
                        href={`/cases/${c.so_number}`}
                        className="font-mono text-[13px] font-semibold hover:underline"
                        style={{ color: "#C8102E" }}
                      >
                        {c.so_number}
                      </Link>
                    </td>
                    <td className="px-5 py-3">
                      <span
                        className="text-[11px] px-2 py-1 rounded-md font-medium"
                        style={{ background: s.bg, color: s.fg }}
                      >
                        {c.status}
                      </span>
                    </td>
                    <td className="px-5 py-3 text-slate-600 truncate">{c.service_type_name?.split(" ")[0] || "—"}</td>
                    <td className="px-5 py-3 truncate">{c.title || "—"}</td>
                    <td className="px-5 py-3 text-slate-500">{fmtDate(c.due_date)}</td>
                    <td className="px-5 py-3 text-slate-500">{fmtDate(c.close_date)}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>

      {showEdit && (
        <EditMachineModal
          machine={machine}
          customers={customers}
          onClose={() => setShowEdit(false)}
          onSuccess={() => { setShowEdit(false); router.refresh(); }}
        />
      )}
      {showDelete && (
        <DeleteMachineModal machine={machine} onClose={() => setShowDelete(false)} onSuccess={() => router.push("/machines")} />
      )}
    </div>
  );
}

function Info({ label, value, mono }: { label: string; value?: string | null; mono?: boolean }) {
  return (
    <div>
      <div className="text-[11px] uppercase tracking-wider text-slate-500 mb-1 font-semibold">{label}</div>
      <div className={`text-slate-800 ${mono ? "font-mono" : ""}`}>{value || "—"}</div>
    </div>
  );
}

function EditMachineModal({
  machine,
  customers,
  onClose,
  onSuccess,
}: {
  machine: Machine;
  customers: Customer[];
  onClose: () => void;
  onSuccess: () => void;
}) {
  const [pending, startTransition] = useTransition();
  const [form, setForm] = useState({
    customer_code: machine.customer_code || "",
    name: machine.name || "",
    product_code: machine.product_code || "",
    serial_no: machine.serial_no || "",
    version: machine.version || "",
    installation_date: machine.installation_date || "",
    warranty_expiry: machine.warranty_expiry || "",
    notes: machine.notes || "",
  });
  const [error, setError] = useState("");

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    startTransition(async () => {
      const result = await updateMachine(machine.machine_no, form);
      if (result.success) onSuccess();
      else setError(result.error || "Failed");
    });
  }

  return (
    <Modal title={`Edit ${machine.machine_no}`} onClose={onClose}>
      {error && <div className="bg-red-50 border border-red-200 rounded-lg p-3 mb-4 text-[13px] text-red-700">⚠ {error}</div>}
      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <FormField label="Customer">
          <select value={form.customer_code} onChange={(e) => setForm({ ...form, customer_code: e.target.value })} className="form-inp">
            <option value="">— None —</option>
            {customers.map((c) => (
              <option key={c.code} value={c.code}>
                {c.name} ({c.code})
              </option>
            ))}
          </select>
        </FormField>
        <div className="grid grid-cols-2 gap-3">
          <FormField label="Name / Model">
            <input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className="form-inp" />
          </FormField>
          <FormField label="Product code">
            <input value={form.product_code} onChange={(e) => setForm({ ...form, product_code: e.target.value })} className="form-inp font-mono" />
          </FormField>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <FormField label="Serial number">
            <input value={form.serial_no} onChange={(e) => setForm({ ...form, serial_no: e.target.value })} className="form-inp font-mono" />
          </FormField>
          <FormField label="Version">
            <input value={form.version} onChange={(e) => setForm({ ...form, version: e.target.value })} className="form-inp" />
          </FormField>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <FormField label="Installation date">
            <input type="date" value={form.installation_date} onChange={(e) => setForm({ ...form, installation_date: e.target.value })} className="form-inp" />
          </FormField>
          <FormField label="Warranty expiry">
            <input type="date" value={form.warranty_expiry} onChange={(e) => setForm({ ...form, warranty_expiry: e.target.value })} className="form-inp" />
          </FormField>
        </div>
        <FormField label="Notes">
          <textarea value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} className="form-inp" rows={3} />
        </FormField>
        <div className="flex justify-end gap-2 mt-2">
          <button type="button" onClick={onClose} className="px-4 py-2 rounded-lg text-[14px] border border-slate-300 bg-white">Cancel</button>
          <button type="submit" disabled={pending} className="px-5 py-2 rounded-lg text-[14px] text-white" style={{ background: "#C8102E" }}>
            {pending ? "Saving..." : "✓ Save"}
          </button>
        </div>
      </form>
      <FormInputStyle />
    </Modal>
  );
}

function DeleteMachineModal({
  machine,
  onClose,
  onSuccess,
}: {
  machine: Machine;
  onClose: () => void;
  onSuccess: () => void;
}) {
  const [pending, startTransition] = useTransition();
  const [step, setStep] = useState<1 | 2>(1);
  const [confirmText, setConfirmText] = useState("");
  const [error, setError] = useState("");

  function handleDelete() {
    if (confirmText !== machine.machine_no) {
      setError(`Please type "${machine.machine_no}" exactly`);
      return;
    }
    startTransition(async () => {
      const result = await deleteMachine(machine.machine_no);
      if (result.success) onSuccess();
      else setError(result.error || "Failed");
    });
  }

  return (
    <Modal title="Delete machine" onClose={onClose}>
      {step === 1 ? (
        <>
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-4">
            <div className="text-[14px] font-medium text-red-800 mb-1">⚠ Permanent deletion</div>
            <div className="text-[13px] text-red-700">
              This will delete <strong className="font-mono">{machine.machine_no}</strong>.
              Cases referencing this machine must be removed first.
            </div>
          </div>
          <div className="flex justify-end gap-2">
            <button onClick={onClose} className="px-4 py-2 rounded-lg text-[14px] border border-slate-300 bg-white">Cancel</button>
            <button onClick={() => setStep(2)} className="px-5 py-2 rounded-lg text-[14px] text-white" style={{ background: "#C8102E" }}>
              Continue →
            </button>
          </div>
        </>
      ) : (
        <>
          {error && <div className="bg-red-50 border border-red-200 rounded-lg p-3 mb-4 text-[13px] text-red-700">⚠ {error}</div>}
          <p className="text-[14px] text-slate-700 mb-3">
            Type <code className="font-mono px-1.5 py-0.5 bg-slate-100 rounded">{machine.machine_no}</code> to confirm:
          </p>
          <input
            value={confirmText}
            onChange={(e) => setConfirmText(e.target.value)}
            placeholder={machine.machine_no}
            className="form-inp font-mono mb-4"
            autoFocus
          />
          <div className="flex justify-end gap-2">
            <button onClick={() => setStep(1)} className="px-4 py-2 rounded-lg text-[14px] border border-slate-300 bg-white">← Back</button>
            <button
              onClick={handleDelete}
              disabled={pending || confirmText !== machine.machine_no}
              className="px-5 py-2 rounded-lg text-[14px] text-white disabled:opacity-50"
              style={{ background: "#C8102E" }}
            >
              {pending ? "Deleting..." : "🗑 Delete forever"}
            </button>
          </div>
          <FormInputStyle />
        </>
      )}
    </Modal>
  );
}

function Modal({ title, onClose, children }: { title: string; onClose: () => void; children: React.ReactNode }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 overflow-auto" style={{ background: "rgba(15,23,42,0.5)" }}>
      <div className="bg-white rounded-2xl p-6 max-w-xl w-full shadow-xl max-h-[90vh] overflow-auto">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-[20px] font-semibold">{title}</h3>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600 text-xl">✕</button>
        </div>
        {children}
      </div>
    </div>
  );
}

function FormField({ label, required, children }: { label: string; required?: boolean; children: React.ReactNode }) {
  return (
    <div>
      <label className="block text-[13px] font-medium text-slate-700 mb-1.5">
        {label}
        {required && <span style={{ color: "#C8102E" }}> *</span>}
      </label>
      {children}
    </div>
  );
}

function FormInputStyle() {
  return (
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
  );
}
