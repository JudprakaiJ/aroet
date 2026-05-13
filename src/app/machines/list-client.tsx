"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { fmtDate } from "@/lib/format";
import { createMachine } from "./actions";

interface Machine {
  machine_no: string;
  name?: string | null;
  product_code?: string | null;
  serial_no?: string | null;
  customer_code?: string | null;
  customer_name?: string | null;
  warranty_expiry?: string | null;
  installation_date?: string | null;
  version?: string | null;
  notes?: string | null;
}

interface Customer {
  code: string;
  name: string;
}

export default function MachineListClient({
  machines,
  customers,
  filter,
  totalCount,
  unknownCount,
}: {
  machines: Machine[];
  customers: Customer[];
  filter?: string;
  totalCount: number;
  unknownCount: number;
}) {
  const router = useRouter();
  const [showModal, setShowModal] = useState(false);
  const [search, setSearch] = useState("");

  const filtered = search
    ? machines.filter(
        (m) =>
          m.machine_no.toLowerCase().includes(search.toLowerCase()) ||
          (m.product_code || "").toLowerCase().includes(search.toLowerCase()) ||
          (m.customer_name || "").toLowerCase().includes(search.toLowerCase()) ||
          (m.serial_no || "").toLowerCase().includes(search.toLowerCase())
      )
    : machines;

  return (
    <div className="max-w-7xl mx-auto px-6 py-8">
      <div className="flex items-center justify-between mb-2">
        <h1 className="text-[28px] font-bold leading-tight">Machines</h1>
        <button
          onClick={() => setShowModal(true)}
          className="text-[14px] px-5 py-2.5 rounded-lg font-medium text-white inline-flex items-center gap-1.5"
          style={{ background: "#C8102E" }}
        >
          <span className="text-lg leading-none">+</span> New machine
        </button>
      </div>
      <p className="text-[14px] text-slate-500 mb-5">
        {filter === "unknown" ? "Machines with unknown version" : `${totalCount} machines · ${unknownCount} with unknown version`}
      </p>

      <div className="bg-white rounded-2xl border border-slate-200 p-4 mb-5">
        <div className="flex gap-3 items-center flex-wrap">
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search machine, product code, customer, serial..."
            className="flex-1 min-w-[240px] px-4 py-2.5 text-[14px] border border-slate-200 rounded-lg"
          />
          <div className="flex gap-1.5">
            <Link
              href="/machines"
              className="px-3.5 py-2 rounded-lg font-medium text-[13px]"
              style={
                !filter
                  ? { background: "#FCE8EB", color: "#C8102E", border: "1.5px solid #C8102E" }
                  : { background: "white", color: "#1a1a1a", border: "1px solid #e2e8f0" }
              }
            >
              All <span style={{ opacity: 0.7, marginLeft: 4 }}>{totalCount}</span>
            </Link>
            <Link
              href="/machines?filter=unknown"
              className="px-3.5 py-2 rounded-lg font-medium text-[13px]"
              style={
                filter === "unknown"
                  ? { background: "#FCE8EB", color: "#C8102E", border: "1.5px solid #C8102E" }
                  : { background: "white", color: "#1a1a1a", border: "1px solid #e2e8f0" }
              }
            >
              Unknown version <span style={{ opacity: 0.7, marginLeft: 4 }}>{unknownCount}</span>
            </Link>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden">
        <table className="w-full text-[13px]">
          <thead className="bg-slate-50 text-slate-600 border-b border-slate-200">
            <tr className="text-left">
              <th className="px-5 py-3 font-semibold text-[12px] uppercase tracking-wider w-40">Machine #</th>
              <th className="px-5 py-3 font-semibold text-[12px] uppercase tracking-wider w-36">Product</th>
              <th className="px-5 py-3 font-semibold text-[12px] uppercase tracking-wider w-20">Version</th>
              <th className="px-5 py-3 font-semibold text-[12px] uppercase tracking-wider w-32">Serial</th>
              <th className="px-5 py-3 font-semibold text-[12px] uppercase tracking-wider">Customer</th>
              <th className="px-5 py-3 font-semibold text-[12px] uppercase tracking-wider w-28">Installed</th>
              <th className="px-5 py-3 font-semibold text-[12px] uppercase tracking-wider w-28">Warranty</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((m) => (
              <tr key={m.machine_no} className="border-b border-slate-100 hover:bg-slate-50 transition-colors">
                <td className="px-5 py-3">
                  <Link
                    href={`/machines/${encodeURIComponent(m.machine_no)}`}
                    className="font-mono text-[13px] font-semibold hover:underline"
                    style={{ color: "#C8102E" }}
                  >
                    {m.machine_no}
                  </Link>
                </td>
                <td className="px-5 py-3 font-mono text-[12px] text-slate-600">{m.product_code ?? "—"}</td>
                <td className="px-5 py-3">
                  {m.version ? (
                    <span
                      className="text-[11px] px-2 py-1 rounded-md font-medium"
                      style={
                        m.version === "N/A"
                          ? { background: "#F1F5F9", color: "#64748B" }
                          : { background: "#EDE9FE", color: "#5B21B6" }
                      }
                    >
                      {m.version}
                    </span>
                  ) : (
                    <span className="text-[11px] px-2 py-1 rounded-md font-medium" style={{ background: "#FAEEDA", color: "#BA7517" }}>
                      unknown
                    </span>
                  )}
                </td>
                <td className="px-5 py-3 font-mono text-[12px]">{m.serial_no ?? "—"}</td>
                <td className="px-5 py-3 truncate max-w-xs">{m.customer_name ?? "—"}</td>
                <td className="px-5 py-3 text-slate-500">{fmtDate(m.installation_date)}</td>
                <td className="px-5 py-3 text-slate-500">{fmtDate(m.warranty_expiry)}</td>
              </tr>
            ))}
            {filtered.length === 0 && (
              <tr>
                <td colSpan={7} className="px-5 py-12 text-center text-slate-400 text-[13px]">
                  No machines match search
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {showModal && (
        <NewMachineModal
          customers={customers}
          onClose={() => setShowModal(false)}
          onCreated={() => {
            setShowModal(false);
            router.refresh();
          }}
        />
      )}
    </div>
  );
}

function NewMachineModal({
  customers,
  onClose,
  onCreated,
}: {
  customers: Customer[];
  onClose: () => void;
  onCreated: () => void;
}) {
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState("");
  const [machineNo, setMachineNo] = useState("");
  const [customerCode, setCustomerCode] = useState("");
  const [name, setName] = useState("");
  const [productCode, setProductCode] = useState("");
  const [serialNo, setSerialNo] = useState("");
  const [version, setVersion] = useState("");
  const [warrantyExpiry, setWarrantyExpiry] = useState("");
  const [installationDate, setInstallationDate] = useState("");
  const [notes, setNotes] = useState("");

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    startTransition(async () => {
      const result = await createMachine({
        machine_no: machineNo,
        customer_code: customerCode,
        name,
        product_code: productCode,
        serial_no: serialNo,
        version,
        warranty_expiry: warrantyExpiry,
        installation_date: installationDate,
        notes,
      });
      if (result.success) {
        onCreated();
      } else {
        setError(result.error || "Failed to create machine");
      }
    });
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: "rgba(15,23,42,0.5)" }}>
      <div className="bg-white rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-auto">
        <div className="px-6 py-5 border-b border-slate-200 flex items-center justify-between sticky top-0 bg-white">
          <h3 className="text-[18px] font-semibold">New machine</h3>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-700 text-xl leading-none">
            ✕
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6">
          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-3 mb-4 text-[13px] text-red-700">
              ⚠ {error}
            </div>
          )}

          <div className="grid grid-cols-2 gap-3 mb-4">
            <div>
              <label className="block text-[13px] font-medium text-slate-700 mb-1.5">
                Machine number <span style={{ color: "#C8102E" }}>*</span>
              </label>
              <input
                value={machineNo}
                onChange={(e) => setMachineNo(e.target.value)}
                placeholder="MCVP4-130 or 26F3041"
                className="form-input font-mono"
                autoFocus
              />
            </div>
            <div>
              <label className="block text-[13px] font-medium text-slate-700 mb-1.5">
                Customer <span style={{ color: "#C8102E" }}>*</span>
              </label>
              <select value={customerCode} onChange={(e) => setCustomerCode(e.target.value)} className="form-input">
                <option value="">Select customer...</option>
                {customers.map((c) => (
                  <option key={c.code} value={c.code}>
                    {c.code} — {c.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="mb-4">
            <label className="block text-[13px] font-medium text-slate-700 mb-1.5">Name / model</label>
            <input value={name} onChange={(e) => setName(e.target.value)} className="form-input" placeholder="e.g. Focovision SR3" />
          </div>

          <div className="grid grid-cols-3 gap-3 mb-4">
            <div>
              <label className="block text-[13px] font-medium text-slate-700 mb-1.5">Product code</label>
              <input
                value={productCode}
                onChange={(e) => setProductCode(e.target.value)}
                placeholder="AR22SV"
                className="form-input font-mono"
              />
            </div>
            <div>
              <label className="block text-[13px] font-medium text-slate-700 mb-1.5">Version</label>
              <input value={version} onChange={(e) => setVersion(e.target.value)} placeholder="V3" className="form-input" />
            </div>
            <div>
              <label className="block text-[13px] font-medium text-slate-700 mb-1.5">Serial number</label>
              <input
                value={serialNo}
                onChange={(e) => setSerialNo(e.target.value)}
                placeholder="SN12345"
                className="form-input font-mono"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3 mb-4">
            <div>
              <label className="block text-[13px] font-medium text-slate-700 mb-1.5">Installation date</label>
              <input type="date" value={installationDate} onChange={(e) => setInstallationDate(e.target.value)} className="form-input" />
            </div>
            <div>
              <label className="block text-[13px] font-medium text-slate-700 mb-1.5">Warranty expiry</label>
              <input type="date" value={warrantyExpiry} onChange={(e) => setWarrantyExpiry(e.target.value)} className="form-input" />
            </div>
          </div>

          <div className="mb-4">
            <label className="block text-[13px] font-medium text-slate-700 mb-1.5">Notes</label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={3}
              className="form-input"
              placeholder="Any additional notes about this machine..."
            />
          </div>

          <div className="flex justify-end gap-2 pt-4 border-t border-slate-200">
            <button type="button" onClick={onClose} className="px-4 py-2 rounded-lg text-[13px] border border-slate-300 bg-white">
              Cancel
            </button>
            <button
              type="submit"
              disabled={pending}
              className="px-4 py-2 rounded-lg text-[13px] text-white disabled:opacity-50"
              style={{ background: "#C8102E" }}
            >
              {pending ? "Creating..." : "Create machine"}
            </button>
          </div>
        </form>

        <style jsx>{`
          .form-input {
            width: 100%;
            padding: 8px 12px;
            font-size: 14px;
            border: 1px solid #e2e8f0;
            border-radius: 8px;
            background: white;
          }
          .form-input:focus {
            outline: none;
            border-color: #C8102E;
            box-shadow: 0 0 0 3px rgba(200, 16, 46, 0.1);
          }
        `}</style>
      </div>
    </div>
  );
}
