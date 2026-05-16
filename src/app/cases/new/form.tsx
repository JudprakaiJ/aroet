"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import {
  createCase,
  suggestProjectCode,
  createCustomerInline,
  createMachineInline,
} from "./actions";

interface Customer {
  code: string;
  name: string;
  city?: string | null;
  country?: string | null;
  contact_name?: string | null;
}

interface Engineer {
  code: string;
  full_name: string;
  role: string;
}

interface Machine {
  machine_no: string;
  name?: string | null;
  product_code?: string | null;
  customer_code?: string | null;
  version?: string | null;
}

interface Suggestion {
  project_code: string;
  confidence: number;
  reason: string;
}

export default function NewCaseForm({
  customers: initialCustomers,
  engineers,
  machines: initialMachines,
}: {
  customers: Customer[];
  engineers: Engineer[];
  machines: Machine[];
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  // Form state
  const [soNumber, setSoNumber] = useState("");
  const [srNumber, setSrNumber] = useState("");
  const [customerCode, setCustomerCode] = useState("");
  const [customerSearch, setCustomerSearch] = useState("");
  const [showCustomerDropdown, setShowCustomerDropdown] = useState(false);
  const [machineNos, setMachineNos] = useState<string[]>([]);
  const [primaryMachine, setPrimaryMachine] = useState<string>("");
  const [machineSearch, setMachineSearch] = useState("");
  const [showMachineDropdown, setShowMachineDropdown] = useState(false);
  const [projectCode, setProjectCode] = useState("");
  const [serviceType, setServiceType] = useState("7505");
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [dueDate, setDueDate] = useState("");
  const [leadEngineer, setLeadEngineer] = useState("");
  const [otherEngineers, setOtherEngineers] = useState<string[]>([]);

  // Suggestions
  const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);

  // Inline create state
  const [customers, setCustomers] = useState<Customer[]>(initialCustomers);
  const [machines, setMachines] = useState<Machine[]>(initialMachines);
  const [showNewCustomer, setShowNewCustomer] = useState(false);
  const [showNewMachine, setShowNewMachine] = useState(false);
  const [newCustomer, setNewCustomer] = useState({ code: "", name: "", city: "", country: "" });
  const [newMachine, setNewMachine] = useState({
    machine_no: "",
    name: "",
    product_code: "",
    serial_no: "",
    version: "",
  });

  const [error, setError] = useState("");

  // Filtered options
  const filteredCustomers = customerSearch
    ? customers.filter(
        (c) =>
          c.name.toLowerCase().includes(customerSearch.toLowerCase()) ||
          c.code.toLowerCase().includes(customerSearch.toLowerCase())
      )
    : customers;

  const filteredMachines = machineSearch
    ? machines.filter(
        (m) =>
          m.machine_no.toLowerCase().includes(machineSearch.toLowerCase()) ||
          (m.name || "").toLowerCase().includes(machineSearch.toLowerCase())
      )
    : machines.filter((m) => !customerCode || m.customer_code === customerCode);

  const selectedCustomer = customers.find((c) => c.code === customerCode);

  async function handleSuggest() {
    if (machineNos.length === 0 && !customerCode) {
      setError("Select customer or machines first");
      return;
    }
    const result = await suggestProjectCode(machineNos, customerCode);
    setSuggestions(result);
    setShowSuggestions(true);
  }

  function applyMachine(m: Machine) {
    if (!machineNos.includes(m.machine_no)) {
      const next = [...machineNos, m.machine_no];
      setMachineNos(next);
      if (!primaryMachine) setPrimaryMachine(m.machine_no);
    }
    setMachineSearch("");
    setShowMachineDropdown(false);
  }

  function removeMachine(no: string) {
    const next = machineNos.filter((m) => m !== no);
    setMachineNos(next);
    if (primaryMachine === no) setPrimaryMachine(next[0] || "");
  }

  function applyCustomer(c: Customer) {
    setCustomerCode(c.code);
    setCustomerSearch("");
    setShowCustomerDropdown(false);
  }

  function applyEngineer(code: string) {
    if (!otherEngineers.includes(code) && code !== leadEngineer) {
      setOtherEngineers([...otherEngineers, code]);
    }
  }

  async function handleCreateCustomer() {
    if (!newCustomer.name.trim()) return;
    const result = await createCustomerInline(newCustomer);
    if (result.success && result.code) {
      const created: Customer = {
        code: result.code,
        name: newCustomer.name,
        city: newCustomer.city,
        country: newCustomer.country,
      };
      setCustomers([...customers, created]);
      setCustomerCode(result.code);
      setShowNewCustomer(false);
      setNewCustomer({ code: "", name: "", city: "", country: "" });
    } else {
      setError(result.error || "Failed to create customer");
    }
  }

  async function handleCreateMachine() {
    if (!newMachine.machine_no.trim() || !customerCode) {
      setError("Machine number and customer required");
      return;
    }
    const result = await createMachineInline({ ...newMachine, customer_code: customerCode });
    if (result.success && result.machine_no) {
      const created: Machine = {
        machine_no: result.machine_no,
        name: newMachine.name,
        product_code: newMachine.product_code,
        customer_code: customerCode,
        version: newMachine.version,
      };
      setMachines([...machines, created]);
      setMachineNos([...machineNos, result.machine_no]);
      if (!primaryMachine) setPrimaryMachine(result.machine_no);
      setShowNewMachine(false);
      setNewMachine({ machine_no: "", name: "", product_code: "", serial_no: "", version: "" });
    } else {
      setError(result.error || "Failed to create machine");
    }
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");

    // Validation
    if (!soNumber.trim()) {
      setError("SO Number required");
      return;
    }
    if (!/^SO\d{4}-\d{1,3}$/i.test(soNumber.trim())) {
      setError("SO Number format should be like SO2605-21");
      return;
    }
    if (!srNumber.trim()) {
      setError("SR Number required");
      return;
    }
    if (!/^SR\d{2}-AROET\d+$/i.test(srNumber.trim())) {
      setError("SR Number format should be like SR26-AROET03450");
      return;
    }
    if (!title.trim()) {
      setError("Title required (copy from D365 case)");
      return;
    }
    if (!customerCode) {
      setError("Customer required");
      return;
    }
    if (machineNos.length === 0) {
      setError("Select at least 1 machine");
      return;
    }
    if (!leadEngineer) {
      setError("Lead engineer required");
      return;
    }

    startTransition(async () => {
      const result = await createCase({
        so_number: soNumber.trim(),
        sr_number: srNumber.trim(),
        customer_code: customerCode,
        machine_nos: machineNos,
        primary_machine_no: primaryMachine,
        project_code: projectCode,
        service_type_code: serviceType,
        title: title.trim(),
        description,
        due_date: dueDate || undefined,
        lead_engineer: leadEngineer,
        other_engineers: otherEngineers,
      });
      if (result.success && result.so_number) {
        router.push(`/cases/${result.so_number}`);
      } else {
        setError(result.error || "Failed to create case");
      }
    });
  }

  return (
    <div className="max-w-4xl mx-auto px-6 py-8">
      <div className="mb-7">
        <h1 className="text-[28px] font-bold leading-tight">Create new case</h1>
        <p className="text-[14px] text-slate-500 mt-1">
          Fill SO + customer + machines · Project code auto-suggests from pattern
        </p>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-xl p-4 mb-5 text-[14px] text-red-700">
          ⚠ {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        {/* IDENTIFIERS */}
        <section className="bg-white border border-slate-200 rounded-2xl p-6">
          <h2 className="text-[12px] font-semibold uppercase tracking-wider text-slate-500 mb-4">
            Identifiers
          </h2>
          <div className="grid grid-cols-2 gap-4">
            <Field label="SO Number" required>
              <input
                value={soNumber}
                onChange={(e) => setSoNumber(e.target.value)}
                placeholder="SO2605-21"
                className="form-input"
              />
              <p className="text-[12px] text-slate-400 mt-1">Format: SO + YYMM + sequence</p>
            </Field>
            <Field label="SR Number (D365)" required>
              <input
                value={srNumber}
                onChange={(e) => setSrNumber(e.target.value)}
                placeholder="SR26-AROET03450"
                className="form-input"
              />
              <p className="text-[12px] text-slate-400 mt-1">Case ID in D365</p>
            </Field>
          </div>
        </section>

        {/* CUSTOMER & MACHINES */}
        <section className="bg-white border border-slate-200 rounded-2xl p-6">
          <h2 className="text-[12px] font-semibold uppercase tracking-wider text-slate-500 mb-4">
            Customer & Machines
          </h2>

          {/* Customer */}
          <Field label="Customer" required>
            {selectedCustomer ? (
              <div className="flex items-center justify-between p-3 border border-slate-200 rounded-lg bg-slate-50">
                <div>
                  <div className="text-[14px] font-medium">{selectedCustomer.name}</div>
                  <div className="text-[12px] text-slate-500">
                    {selectedCustomer.code}
                    {selectedCustomer.city && ` · ${selectedCustomer.city}`}
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setCustomerCode("")}
                  className="text-[12px] text-slate-500 hover:text-slate-700"
                >
                  Change
                </button>
              </div>
            ) : (
              <div className="relative">
                <input
                  value={customerSearch}
                  onChange={(e) => {
                    setCustomerSearch(e.target.value);
                    setShowCustomerDropdown(true);
                  }}
                  onFocus={() => setShowCustomerDropdown(true)}
                  placeholder="Search customer..."
                  className="form-input"
                />
                {showCustomerDropdown && (
                  <div className="absolute z-10 left-0 right-0 mt-1 bg-white border border-slate-200 rounded-lg shadow-md max-h-64 overflow-auto">
                    {filteredCustomers.slice(0, 8).map((c) => (
                      <div
                        key={c.code}
                        onClick={() => applyCustomer(c)}
                        className="px-3 py-2.5 hover:bg-slate-50 cursor-pointer border-b border-slate-100 last:border-0"
                      >
                        <div className="text-[14px] font-medium">{c.name}</div>
                        <div className="text-[11px] text-slate-500">
                          {c.code}
                          {c.city && ` · ${c.city}`}
                        </div>
                      </div>
                    ))}
                    <div
                      onClick={() => {
                        setNewCustomer({ ...newCustomer, name: customerSearch });
                        setShowNewCustomer(true);
                        setShowCustomerDropdown(false);
                      }}
                      className="px-3 py-2.5 hover:bg-red-50 cursor-pointer text-[13px] font-medium"
                      style={{ color: "#C8102E" }}
                    >
                      + Add new customer{customerSearch && ` "${customerSearch}"`}
                    </div>
                  </div>
                )}
              </div>
            )}
          </Field>

          {/* Machines */}
          <Field label="Machines" required>
            {machineNos.length > 0 && (
              <div className="flex flex-wrap gap-2 mb-2">
                {machineNos.map((no) => (
                  <span
                    key={no}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md text-[13px] font-medium"
                    style={{
                      background: no === primaryMachine ? "#FCE8EB" : "#DDEBF7",
                      color: no === primaryMachine ? "#C8102E" : "#185FA5",
                    }}
                  >
                    {no === primaryMachine && (
                      <span title="Primary machine" className="text-[11px]">
                        ⭐
                      </span>
                    )}
                    <button
                      type="button"
                      onClick={() => setPrimaryMachine(no)}
                      className="hover:underline"
                      disabled={no === primaryMachine}
                    >
                      {no}
                    </button>
                    <button
                      type="button"
                      onClick={() => removeMachine(no)}
                      className="ml-1 hover:opacity-70"
                    >
                      ✕
                    </button>
                  </span>
                ))}
              </div>
            )}

            <div className="relative">
              <input
                value={machineSearch}
                onChange={(e) => {
                  setMachineSearch(e.target.value);
                  setShowMachineDropdown(true);
                }}
                onFocus={() => setShowMachineDropdown(true)}
                placeholder="Search machine or type to add..."
                className="form-input"
              />
              {showMachineDropdown && (
                <div className="absolute z-10 left-0 right-0 mt-1 bg-white border border-slate-200 rounded-lg shadow-md max-h-64 overflow-auto">
                  {filteredMachines.slice(0, 8).map((m) => (
                    <div
                      key={m.machine_no}
                      onClick={() => applyMachine(m)}
                      className="px-3 py-2.5 hover:bg-slate-50 cursor-pointer border-b border-slate-100 last:border-0"
                    >
                      <div className="text-[13px] font-mono font-medium">{m.machine_no}</div>
                      <div className="text-[11px] text-slate-500">
                        {m.product_code || "—"}
                        {m.version && ` · ${m.version}`}
                      </div>
                    </div>
                  ))}
                  <div
                    onClick={() => {
                      setNewMachine({ ...newMachine, machine_no: machineSearch });
                      setShowNewMachine(true);
                      setShowMachineDropdown(false);
                    }}
                    className="px-3 py-2.5 hover:bg-red-50 cursor-pointer text-[13px] font-medium"
                    style={{ color: "#C8102E" }}
                  >
                    + Add new machine{machineSearch && ` "${machineSearch}"`}
                  </div>
                </div>
              )}
            </div>
            <p className="text-[12px] text-slate-400 mt-1.5">
              Click avatar to set primary machine · Click ✕ to remove
            </p>
          </Field>
        </section>

        {/* PROJECT & SERVICE TYPE */}
        <section className="bg-white border border-slate-200 rounded-2xl p-6">
          <h2 className="text-[12px] font-semibold uppercase tracking-wider text-slate-500 mb-4">
            Project & Service type
          </h2>

          <div className="grid grid-cols-2 gap-4 mb-4">
            <Field label="Project code">
              <div className="flex gap-2">
                <input
                  value={projectCode}
                  onChange={(e) => setProjectCode(e.target.value.toUpperCase())}
                  placeholder="e.g. ZEGU99"
                  className="form-input flex-1"
                />
                <button
                  type="button"
                  onClick={handleSuggest}
                  className="px-3 py-2 rounded-lg border border-slate-300 bg-white hover:bg-slate-50 text-[13px] font-medium"
                >
                  🪄 Suggest
                </button>
              </div>
              {showSuggestions && suggestions.length > 0 && (
                <div className="mt-2 bg-blue-50 border border-blue-200 rounded-lg p-3">
                  <div className="text-[12px] font-semibold text-blue-900 mb-2">
                    Top suggestions
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {suggestions.map((s) => (
                      <button
                        key={s.project_code}
                        type="button"
                        onClick={() => {
                          setProjectCode(s.project_code);
                          setShowSuggestions(false);
                        }}
                        className="text-[12px] px-2.5 py-1.5 rounded-md font-mono font-semibold bg-white border border-blue-300 hover:bg-blue-100"
                      >
                        {s.project_code}
                        <span className="ml-1.5 text-[10px] text-slate-500 font-sans">
                          {s.confidence}%
                        </span>
                      </button>
                    ))}
                  </div>
                </div>
              )}
              {showSuggestions && suggestions.length === 0 && (
                <p className="text-[12px] text-amber-600 mt-2">
                  No matches — type your own
                </p>
              )}
            </Field>
            <Field label="Service type" required>
              <select
                value={serviceType}
                onChange={(e) => setServiceType(e.target.value)}
                className="form-input"
              >
                <option value="7505">Curative — 7505</option>
                <option value="7507">Preventive Maintenance — 7507</option>
                <option value="7510">Installation — 7510</option>
                <option value="7512">Service Agreement — 7512</option>
                <option value="7515">Curative under warranty — 7515</option>
                <option value="7520">Upgrade — 7520</option>
                <option value="7525">Training — 7525</option>
                <option value="7235">Voucher — 7235</option>
              </select>
            </Field>
          </div>

          <Field label="Title" required>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Copy from D365 case title. e.g. PE91 PM annual at Essilor Lao"
              className="form-input"
              maxLength={200}
            />
          </Field>

          <Field label="Description (optional)">
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Additional context if needed. Otherwise leave blank — Title is the main summary."
              rows={2}
              className="form-input"
            />
          </Field>
        </section>

        {/* ENGINEERS & SCHEDULE */}
        <section className="bg-white border border-slate-200 rounded-2xl p-6">
          <h2 className="text-[12px] font-semibold uppercase tracking-wider text-slate-500 mb-4">
            Engineers & schedule
          </h2>

          <div className="grid grid-cols-2 gap-4 mb-4">
            <Field label="Lead engineer" required>
              <select
                value={leadEngineer}
                onChange={(e) => setLeadEngineer(e.target.value)}
                className="form-input"
              >
                <option value="">Select lead...</option>
                {engineers.map((e) => (
                  <option key={e.code} value={e.code}>
                    {e.code} — {e.full_name}
                  </option>
                ))}
              </select>
            </Field>
            <Field label="Due date">
              <input
                type="date"
                value={dueDate}
                onChange={(e) => setDueDate(e.target.value)}
                className="form-input"
              />
            </Field>
          </div>

          <Field label="Other engineers">
            {otherEngineers.length > 0 && (
              <div className="flex flex-wrap gap-2 mb-2">
                {otherEngineers.map((code) => {
                  const e = engineers.find((x) => x.code === code);
                  return (
                    <span
                      key={code}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md text-[13px] bg-slate-100"
                    >
                      <strong className="font-mono">{code}</strong>
                      <span className="text-slate-600">{e?.full_name}</span>
                      <button
                        type="button"
                        onClick={() => setOtherEngineers(otherEngineers.filter((c) => c !== code))}
                        className="ml-1 text-slate-400 hover:text-slate-600"
                      >
                        ✕
                      </button>
                    </span>
                  );
                })}
              </div>
            )}
            <select
              value=""
              onChange={(e) => {
                if (e.target.value) applyEngineer(e.target.value);
                e.target.value = "";
              }}
              className="form-input"
            >
              <option value="">+ Add engineer...</option>
              {engineers
                .filter((e) => e.code !== leadEngineer && !otherEngineers.includes(e.code))
                .map((e) => (
                  <option key={e.code} value={e.code}>
                    {e.code} — {e.full_name}
                  </option>
                ))}
            </select>
          </Field>
        </section>

        {/* SUBMIT */}
        <div className="flex gap-2 justify-end">
          <button
            type="button"
            onClick={() => router.push("/cases")}
            className="px-5 py-2.5 rounded-lg font-medium text-[14px] border border-slate-300 bg-white hover:bg-slate-50"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={pending}
            className="px-5 py-2.5 rounded-lg font-medium text-[14px] text-white disabled:opacity-50"
            style={{ background: "#C8102E" }}
          >
            {pending ? "Creating..." : "✓ Create case"}
          </button>
        </div>
      </form>

      {/* INLINE: NEW CUSTOMER MODAL */}
      {showNewCustomer && (
        <Modal title="New customer" onClose={() => setShowNewCustomer(false)}>
          <Field label="Legal name" required>
            <input
              value={newCustomer.name}
              onChange={(e) => setNewCustomer({ ...newCustomer, name: e.target.value })}
              className="form-input"
              placeholder="e.g. Essilor Manufacturing (Thailand) Ltd"
            />
          </Field>
          <Field label="Customer code">
            <input
              value={newCustomer.code}
              onChange={(e) => setNewCustomer({ ...newCustomer, code: e.target.value.toUpperCase() })}
              className="form-input"
              placeholder="Auto-generate or e.g. EMTC"
            />
          </Field>
          <div className="grid grid-cols-2 gap-3">
            <Field label="City">
              <input
                value={newCustomer.city}
                onChange={(e) => setNewCustomer({ ...newCustomer, city: e.target.value })}
                className="form-input"
              />
            </Field>
            <Field label="Country">
              <input
                value={newCustomer.country}
                onChange={(e) => setNewCustomer({ ...newCustomer, country: e.target.value })}
                className="form-input"
                placeholder="e.g. Thailand"
              />
            </Field>
          </div>
          <div className="flex justify-end gap-2 mt-4">
            <button
              type="button"
              onClick={() => setShowNewCustomer(false)}
              className="px-4 py-2 rounded-lg text-[13px] border border-slate-300 bg-white"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleCreateCustomer}
              className="px-4 py-2 rounded-lg text-[13px] text-white"
              style={{ background: "#C8102E" }}
            >
              Create customer
            </button>
          </div>
        </Modal>
      )}

      {/* INLINE: NEW MACHINE MODAL */}
      {showNewMachine && (
        <Modal title="New machine" onClose={() => setShowNewMachine(false)}>
          <Field label="Machine number" required>
            <input
              value={newMachine.machine_no}
              onChange={(e) => setNewMachine({ ...newMachine, machine_no: e.target.value })}
              className="form-input font-mono"
              placeholder="e.g. MCVP4-130 or 26F3041"
            />
          </Field>
          <Field label="Name / model">
            <input
              value={newMachine.name}
              onChange={(e) => setNewMachine({ ...newMachine, name: e.target.value })}
              className="form-input"
            />
          </Field>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Product code">
              <input
                value={newMachine.product_code}
                onChange={(e) => setNewMachine({ ...newMachine, product_code: e.target.value })}
                className="form-input font-mono"
              />
            </Field>
            <Field label="Version">
              <input
                value={newMachine.version}
                onChange={(e) => setNewMachine({ ...newMachine, version: e.target.value })}
                className="form-input"
              />
            </Field>
          </div>
          <Field label="Serial number">
            <input
              value={newMachine.serial_no}
              onChange={(e) => setNewMachine({ ...newMachine, serial_no: e.target.value })}
              className="form-input font-mono"
            />
          </Field>
          {!customerCode && (
            <p className="text-[12px] text-amber-700 mt-1">⚠ Select customer first</p>
          )}
          <div className="flex justify-end gap-2 mt-4">
            <button
              type="button"
              onClick={() => setShowNewMachine(false)}
              className="px-4 py-2 rounded-lg text-[13px] border border-slate-300 bg-white"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleCreateMachine}
              disabled={!customerCode}
              className="px-4 py-2 rounded-lg text-[13px] text-white disabled:opacity-50"
              style={{ background: "#C8102E" }}
            >
              Create machine
            </button>
          </div>
        </Modal>
      )}

      <style jsx>{`
        .form-input {
          width: 100%;
          padding: 10px 12px;
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
  );
}

function Field({
  label,
  required,
  children,
}: {
  label: string;
  required?: boolean;
  children: React.ReactNode;
}) {
  return (
    <div className="mb-4 last:mb-0">
      <label className="block text-[13px] font-medium text-slate-700 mb-1.5">
        {label}
        {required && <span style={{ color: "#C8102E" }}> *</span>}
      </label>
      {children}
    </div>
  );
}

function Modal({
  title,
  onClose,
  children,
}: {
  title: string;
  onClose: () => void;
  children: React.ReactNode;
}) {
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: "rgba(15,23,42,0.5)" }}
    >
      <div className="bg-white rounded-2xl p-6 max-w-md w-full shadow-xl">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-[18px] font-semibold">{title}</h3>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600">
            ✕
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}
