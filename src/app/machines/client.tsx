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
  city?: string | null;
  country?: string | null;
}

export default function MachinesClient({
  initialMachines,
  customers,
  filter,
}: {
  initialMachines: Machine[];
  customers: Customer[];
  filter?: string;
}) {
  const router = useRouter();
  const [showNew, setShowNew] = useState(false);
  const [search, setSearch] = useState("");

  const filtered = (() => {
    let list = initialMachines;
    if (filter === "unknown") list = list.filter((m) => !m.version);
    if (search) {
      list = list.filter(
        (m) =>
          m.machine_no.toLowerCase().includes(search.toLowerCase()) ||
          (m.name || "").toLowerCase().includes(search.toLowerCase()) ||
          (m.customer_name || "").toLowerCase().includes(search.toLowerCase())
      );
    }
    return list;
  })();

  const counts = {
    all: initialMachines.length,
    unknown: initialMachines.filter((m) => !m.version).length,
  };

  return (
    <div className="max-w-7xl mx-auto px-6 py-8">
      <div className="flex items-center justify-between mb-2">
        <h1 className="text-[28px] font-bold text-slate-900 leading-tight">Machines</h1>
        <button
          onClick={() => setShowNew(true)}
          className="text-[14px] px-5 py-2.5 rounded-lg font-medium text-white inline-flex items-center gap-1.5"
          style={{ background: "#C8102E" }}
        >
          <span className="text-lg leading-none">+</span> New machine
        </button>
      </div>
      <p className="text-[14px] text-slate-500 mb-6">
        {filter === "unknown"
          ? "Machines with unknown version"
          : `${counts.all} machines · ${counts.unknown} with unknown version`}
      </p>

      <div className="bg-white border border-slate-200 rounded-2xl p-4 mb-5">
        <div className="flex gap-3 items-center flex-wrap">
          <div className="relative flex-1 min-w-[240px]">
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search machine number, name, customer..."
              className="w-full pl-10 pr-3 py-2.5 text-[14px] border border-slate-200 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-red-100"
            />
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">🔍</span>
          </div>
          <div className="flex gap-2">
            <Link
              href="/machines"
              className="px-3.5 py-2 rounded-lg font-medium text-[13px]"
              style={
                !filter
                  ? { background: "#FCE8EB", color: "#C8102E", border: "1.5px solid #C8102E" }
                  : { background: "white", color: "#1a1a1a", border: "1px solid #e2e8f0" }
              }
            >
              All <span style={{ opacity: 0.7, marginLeft: 4 }}>{counts.all}</span>
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
              Unknown version <span style={{ opacity: 0.7, marginLeft: 4 }}>{counts.unknown}</span>
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
                    <span
                      className="text-[11px] px-2 py-1 rounded-md font-medium"
                      style={{ background: "#FAEEDA", color: "#BA7517" }}
                    >
                      unknown
                    </span>
                  )}
                </td>
                <td className="px-5 py-3 font-mono text-[12px]">{m.serial_no ?? "—"}</td>
                <td className="px-5 py-3 truncate max-w-xs">{m.customer_name ?? "—"}</td>
                <td className="px-5 py-3 text-slate-500">{fmtDate(m.warranty_expiry)}</td>
              </tr>
            ))}
            {filtered.length === 0 && (
              <tr>
                <td colSpan={6} className="px-5 py-12 text-center text-slate-400 text-[13px]">
                  No machines found
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {showNew && (
        <NewMachineModal
          customers={customers}
          onClose={() => setShowNew(false)}
          onSuccess={() => {
            setShowNew(false);
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
  onSuccess,
}: {
  customers: Customer[];
  onClose: () => void;
  onSuccess: () => void;
}) {
  const [pending, startTransition] = useTransition();
  const [form, setForm] = useState({
    machine_no: "",
    customer_code: "",
    name: "",
    product_code: "",
    serial_no: "",
    version: "",
    warranty_expiry: "",
    installation_date: "",
    notes: "",
  });
  const [error, setError] = useState("");
  const [custSearch, setCustSearch] = useState("");
  const [showCustList, setShowCustList] = useState(false);

  const selectedCustomer = customers.find((c) => c.code === form.customer_code);

  const filteredCust = custSearch
    ? customers.filter(
        (c) =>
          c.name.toLowerCase().includes(custSearch.toLowerCase()) ||
          c.code.toLowerCase().includes(custSearch.toLowerCase())
      )
    : customers;

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    startTransition(async () => {
      const result = await createMachine(form);
      if (result.success) {
        onSuccess();
      } else {
        setError(result.error || "Failed");
      }
    });
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 overflow-auto"
      style={{ background: "rgba(15,23,42,0.5)" }}
    >
      <div className="bg-white rounded-2xl p-6 max-w-2xl w-full shadow-xl max-h-[90vh] overflow-auto">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-[20px] font-semibold">New machine</h3>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600 text-xl">
            ✕
          </button>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-3 mb-4 text-[13px] text-red-700">
            ⚠ {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <FormField label="Machine number" required>
            <input
              value={form.machine_no}
              onChange={(e) => setForm({ ...form, machine_no: e.target.value })}
              className="form-inp font-mono"
              placeholder="e.g. MCVP4-130 or 26F3041"
              autoFocus
            />
          </FormField>

          <FormField label="Customer" required>
            {selectedCustomer ? (
              <div className="flex items-center justify-between p-2.5 border border-slate-200 rounded-lg bg-slate-50">
                <div>
                  <div className="text-[13px] font-medium">{selectedCustomer.name}</div>
                  <div className="text-[11px] text-slate-500">
                    {selectedCustomer.code}
                    {selectedCustomer.city && ` · ${selectedCustomer.city}`}
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setForm({ ...form, customer_code: "" })}
                  className="text-[12px] text-slate-500 hover:text-slate-700"
                >
                  Change
                </button>
              </div>
            ) : (
              <div className="relative">
                <input
                  value={custSearch}
                  onChange={(e) => {
                    setCustSearch(e.target.value);
                    setShowCustList(true);
                  }}
                  onFocus={() => setShowCustList(true)}
                  placeholder="Search customer..."
                  className="form-inp"
                />
                {showCustList && (
                  <div className="absolute z-10 left-0 right-0 mt-1 bg-white border border-slate-200 rounded-lg shadow-md max-h-48 overflow-auto">
                    {filteredCust.slice(0, 8).map((c) => (
                      <div
                        key={c.code}
                        onClick={() => {
                          setForm({ ...form, customer_code: c.code });
                          setShowCustList(false);
                          setCustSearch("");
                        }}
                        className="px-3 py-2 hover:bg-slate-50 cursor-pointer border-b border-slate-100 last:border-0"
                      >
                        <div className="text-[13px] font-medium">{c.name}</div>
                        <div className="text-[11px] text-slate-500">
                          {c.code}
                          {c.city && ` · ${c.city}`}
                        </div>
                      </div>
                    ))}
                    {filteredCust.length === 0 && (
                      <div className="px-3 py-2 text-[12px] text-slate-400 italic">
                        No customers — add one in /customers first
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}
          </FormField>

          <div className="grid grid-cols-2 gap-3">
            <FormField label="Name / Model">
              <input
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                className="form-inp"
                placeholder="e.g. AutoMapper PM"
              />
            </FormField>
            <FormField label="Product code">
              <input
                value={form.product_code}
                onChange={(e) => setForm({ ...form, product_code: e.target.value })}
                className="form-inp font-mono"
                placeholder="e.g. MCVP4-128"
              />
            </FormField>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <FormField label="Serial number">
              <input
                value={form.serial_no}
                onChange={(e) => setForm({ ...form, serial_no: e.target.value })}
                className="form-inp font-mono"
              />
            </FormField>
            <FormField label="Version">
              <input
                value={form.version}
                onChange={(e) => setForm({ ...form, version: e.target.value })}
                className="form-inp"
                placeholder="e.g. v3.2 or N/A"
              />
            </FormField>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <FormField label="Installation date">
              <input
                type="date"
                value={form.installation_date}
                onChange={(e) => setForm({ ...form, installation_date: e.target.value })}
                className="form-inp"
              />
            </FormField>
            <FormField label="Warranty expiry">
              <input
                type="date"
                value={form.warranty_expiry}
                onChange={(e) => setForm({ ...form, warranty_expiry: e.target.value })}
                className="form-inp"
              />
            </FormField>
          </div>

          <FormField label="Notes">
            <textarea
              value={form.notes}
              onChange={(e) => setForm({ ...form, notes: e.target.value })}
              className="form-inp"
              rows={3}
              placeholder="Special notes, configuration details, etc."
            />
          </FormField>

          <div className="flex justify-end gap-2 mt-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-lg text-[14px] border border-slate-300 bg-white"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={pending || !form.customer_code}
              className="px-5 py-2 rounded-lg text-[14px] text-white disabled:opacity-50"
              style={{ background: "#C8102E" }}
            >
              {pending ? "Creating..." : "✓ Create machine"}
            </button>
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
