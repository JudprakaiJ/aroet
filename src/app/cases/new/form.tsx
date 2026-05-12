"use client";

import { useState, useMemo, useTransition } from "react";
import Link from "next/link";
import { createCase, previewParse } from "./actions";
import { fmtTime } from "@/lib/format";

interface Customer { code: string; name: string; city: string | null; country: string | null; contact_name: string | null; contact_mobile: string | null; }
interface Engineer { code: string; full_name: string; role: string; }
interface Machine  { machine_no: string; name: string | null; product_code: string | null; customer_code: string | null; version: string | null; }

interface Props {
  customers: Customer[];
  engineers: Engineer[];
  machines: Machine[];
}

const SERVICE_TYPES = [
  { code: "7507", name: "Preventive Maintenance" },
  { code: "7505", name: "Curative maintenance" },
  { code: "7515", name: "Curative under warranty" },
  { code: "7504", name: "Installation" },
  { code: "7508", name: "Service Agreement" },
  { code: "7506", name: "Upgrade installation" },
];

export default function NewCaseForm({ customers, engineers, machines }: Props) {
  const [pasteContent, setPasteContent] = useState("");
  const [parsedPreview, setParsedPreview] = useState<{
    sessions: number;
    references: number;
    sessionList: Array<{ date: string; engineer_code: string; travel_minutes: number; work_minutes: number; activity_type: string; switched_to_so?: string }>;
  } | null>(null);
  const [isPending, startTransition] = useTransition();
  const [isParsing, setIsParsing] = useState(false);

  const [title, setTitle] = useState("");
  const [serviceTypeCode, setServiceTypeCode] = useState("7507");
  const [serviceMode, setServiceMode] = useState("PM");
  const [customerCode, setCustomerCode] = useState("");
  const [customerSearch, setCustomerSearch] = useState("");
  const [contactName, setContactName] = useState("");
  const [machineNo, setMachineNo] = useState("");
  const [machineSearch, setMachineSearch] = useState("");
  const [dueDate, setDueDate] = useState("");
  const [customerPo, setCustomerPo] = useState("");
  const [engineerCodes, setEngineerCodes] = useState<string[]>([]);
  const [leadEngineer, setLeadEngineer] = useState("");
  const [initialNotes, setInitialNotes] = useState("");

  const [customerDropdownOpen, setCustomerDropdownOpen] = useState(false);
  const [machineDropdownOpen, setMachineDropdownOpen] = useState(false);

  const filteredCustomers = useMemo(() => {
    if (!customerSearch) return customers.slice(0, 50);
    const q = customerSearch.toLowerCase();
    return customers.filter((c) =>
      c.name.toLowerCase().includes(q) || c.code.toLowerCase().includes(q)
    ).slice(0, 50);
  }, [customers, customerSearch]);

  const filteredMachines = useMemo(() => {
    let pool = machines;
    if (customerCode) pool = pool.filter((m) => m.customer_code === customerCode);
    if (!machineSearch) return pool.slice(0, 50);
    const q = machineSearch.toLowerCase();
    return pool.filter((m) =>
      m.machine_no.toLowerCase().includes(q) ||
      (m.product_code && m.product_code.toLowerCase().includes(q))
    ).slice(0, 50);
  }, [machines, customerCode, machineSearch]);

  const availableEngineers = engineers.filter((e) => !engineerCodes.includes(e.code));

  async function handleParse() {
    if (!pasteContent.trim()) return;
    setIsParsing(true);

    // Split: first line = title, rest = planner_note
    const lines = pasteContent.split("\n");
    const firstLine = lines[0]?.trim() || "";
    const rest = lines.slice(1).join("\n").trim();

    // If first line looks like a title (not date+engineer), use it as title
    if (firstLine && !firstLine.match(/^\d{1,2}\/\d{1,2}\/\d{2,4}/) && !title) {
      setTitle(firstLine);
    }

    const plannerText = rest || pasteContent;

    try {
      const result = await previewParse(plannerText);

      setParsedPreview({
        sessions: result.sessions.length,
        references: result.references.length,
        sessionList: result.sessions.slice(0, 10).map((s) => ({
          date: s.date,
          engineer_code: s.engineer_code,
          travel_minutes: s.travel_minutes,
          work_minutes: s.work_minutes,
          activity_type: s.activity_type,
          switched_to_so: s.switched_to_so,
        })),
      });

      // Try to guess service type from title
      if (firstLine && !title) {
        const upper = firstLine.toUpperCase();
        if (upper.includes("PM") || upper.includes("PREVENTIVE")) {
          setServiceTypeCode("7507");
          setServiceMode("PM");
        } else if (upper.includes("CURATIVE") || upper.includes("REPAIR")) {
          setServiceTypeCode("7505");
          setServiceMode("General");
        } else if (upper.includes("INSTALL")) {
          setServiceTypeCode("7504");
          setServiceMode("Install");
        }
      }

      // Try to match customer from title
      if (firstLine && !customerCode) {
        // Look for project codes like ESTH99, ZEGU99 in the text
        const projMatch = firstLine.match(/\b([A-Z]{4,6}\d{2,3})\b/);
        if (projMatch) {
          // Try to find a customer whose name contains the prefix
          // For now, just hint the user — actual lookup happens via customer dropdown
        }
      }

      // Auto-extract assigned engineers from planner
      const engineerSet = new Set<string>();
      result.sessions.forEach((s) => engineerSet.add(s.engineer_code));
      const newEngineers = Array.from(engineerSet);
      if (newEngineers.length > 0 && engineerCodes.length === 0) {
        setEngineerCodes(newEngineers);
        if (newEngineers.length > 0) setLeadEngineer(newEngineers[0]);
      }
    } catch (e) {
      console.error("Parse error:", e);
      alert("Failed to parse: " + (e as Error).message);
    } finally {
      setIsParsing(false);
    }
  }

  function toggleEngineer(code: string) {
    if (engineerCodes.includes(code)) {
      const next = engineerCodes.filter((c) => c !== code);
      setEngineerCodes(next);
      if (leadEngineer === code) setLeadEngineer(next[0] || "");
    } else {
      const next = [...engineerCodes, code];
      setEngineerCodes(next);
      if (!leadEngineer) setLeadEngineer(code);
    }
  }

  async function handleSubmit() {
    if (!title || !serviceTypeCode || !customerCode || engineerCodes.length === 0) {
      alert("Please fill required fields: Title, Service type, Customer, at least 1 engineer");
      return;
    }

    const customer = customers.find((c) => c.code === customerCode);
    if (!customer) return;

    // Extract planner note from paste
    const lines = pasteContent.split("\n");
    const firstLine = lines[0]?.trim() || "";
    const isFirstLineTitle = firstLine && !firstLine.match(/^\d{1,2}\/\d{1,2}\/\d{2,4}/);
    const plannerNote = isFirstLineTitle ? lines.slice(1).join("\n").trim() : pasteContent.trim();

    startTransition(async () => {
      try {
        await createCase({
          title,
          service_type_code: serviceTypeCode,
          service_mode: serviceMode,
          customer_code: customerCode,
          customer_name: customer.name,
          contact_name: contactName || undefined,
          machine_no: machineNo || undefined,
          due_date: dueDate || undefined,
          customer_po: customerPo || undefined,
          engineer_codes: engineerCodes,
          lead_engineer: leadEngineer,
          initial_notes: initialNotes || undefined,
          planner_note: plannerNote || undefined,
          auto_parse_sessions: !!plannerNote && (parsedPreview?.sessions ?? 0) > 0,
        });
      } catch (e) {
        alert("Failed to create case: " + (e as Error).message);
      }
    });
  }

  const selectedCustomer = customers.find((c) => c.code === customerCode);
  const selectedMachine = machines.find((m) => m.machine_no === machineNo);

  return (
    <div className="max-w-3xl mx-auto px-4 py-5">
      <div className="mb-3">
        <Link href="/cases" className="text-xs hover:underline" style={{ color: "#C8102E" }}>
          ← Cases
        </Link>
      </div>

      <div className="bg-white border border-slate-200 rounded-lg p-5">
        <div className="flex items-center gap-2 mb-1">
          <h1 className="text-lg font-semibold">New case</h1>
          <span className="text-[10px] bg-purple-100 text-purple-700 px-2 py-0.5 rounded font-medium">AROET</span>
        </div>
        <p className="text-xs text-slate-500 mb-4">Paste planner content to auto-fill, or fill form manually.</p>

        {/* Paste & parse */}
        <div className="bg-blue-50 border border-blue-200 rounded-md p-3 mb-4">
          <div className="text-xs font-medium text-blue-900 mb-2">
            🪄 Paste & parse <span className="text-blue-600 font-normal">— optional, speeds up entry</span>
          </div>
          <textarea
            value={pasteContent}
            onChange={(e) => setPasteContent(e.target.value)}
            placeholder="Paste from Planner here.&#10;&#10;Line 1: Title (e.g. MCVP4-128 - ESTH99 - PM)&#10;Line 2+: Planner note — DD/MM/YYYY: ENG: time blocks..."
            className="w-full min-h-[100px] text-xs font-mono bg-white border border-blue-200 rounded p-2"
          />
          <div className="flex items-center gap-2 mt-2">
            <button
              type="button"
              onClick={handleParse}
              disabled={!pasteContent.trim() || isParsing}
              className="text-xs px-3 py-1.5 rounded font-medium"
              style={{
                background: pasteContent.trim() ? "#C8102E" : "#94A3B8",
                color: "white",
              }}
            >
              {isParsing ? "Parsing..." : "🪄 Parse & fill"}
            </button>
            <button
              type="button"
              onClick={() => {
                setPasteContent("");
                setParsedPreview(null);
              }}
              className="text-xs px-3 py-1.5 rounded border border-slate-300"
            >
              Clear
            </button>
            {parsedPreview && (
              <span className="ml-auto text-xs text-blue-700">
                {parsedPreview.sessions} sessions · {parsedPreview.references} references found
              </span>
            )}
          </div>
        </div>

        {/* Form fields */}
        <div className="text-[10px] font-medium text-slate-500 tracking-wider mb-2">CASE DETAILS</div>

        <div className="mb-3">
          <label className="text-xs text-slate-600 block mb-1">Case title <span className="text-red-600">*</span></label>
          <input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="e.g. MCVP4-128 — ESTH99 — Preventive Maintenance"
            className="w-full text-sm border border-slate-300 rounded px-2 py-1.5"
          />
        </div>

        <div className="grid grid-cols-2 gap-3 mb-3">
          <div>
            <label className="text-xs text-slate-600 block mb-1">Service type <span className="text-red-600">*</span></label>
            <select
              value={serviceTypeCode}
              onChange={(e) => setServiceTypeCode(e.target.value)}
              className="w-full text-sm border border-slate-300 rounded px-2 py-1.5"
            >
              {SERVICE_TYPES.map((t) => (
                <option key={t.code} value={t.code}>
                  {t.code} — {t.name}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="text-xs text-slate-600 block mb-1">Service mode</label>
            <select
              value={serviceMode}
              onChange={(e) => setServiceMode(e.target.value)}
              className="w-full text-sm border border-slate-300 rounded px-2 py-1.5"
            >
              <option>PM</option>
              <option>General</option>
              <option>Install</option>
            </select>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3 mb-3">
          <div className="relative">
            <label className="text-xs text-slate-600 block mb-1">Customer <span className="text-red-600">*</span></label>
            <input
              value={selectedCustomer ? `${selectedCustomer.name} (${selectedCustomer.code})` : customerSearch}
              onChange={(e) => {
                setCustomerSearch(e.target.value);
                setCustomerCode("");
                setCustomerDropdownOpen(true);
              }}
              onFocus={() => setCustomerDropdownOpen(true)}
              onBlur={() => setTimeout(() => setCustomerDropdownOpen(false), 200)}
              placeholder="Search customer..."
              className="w-full text-sm border border-slate-300 rounded px-2 py-1.5"
            />
            {customerDropdownOpen && filteredCustomers.length > 0 && (
              <div className="absolute z-10 mt-1 w-full bg-white border border-slate-200 rounded-md shadow-lg max-h-60 overflow-y-auto">
                {filteredCustomers.map((c) => (
                  <button
                    key={c.code}
                    type="button"
                    onClick={() => {
                      setCustomerCode(c.code);
                      setCustomerSearch("");
                      setContactName(c.contact_name || "");
                      setCustomerDropdownOpen(false);
                    }}
                    className="block w-full text-left px-2 py-1.5 hover:bg-slate-50 text-xs"
                  >
                    <div className="font-medium">{c.name}</div>
                    <div className="text-[10px] text-slate-500">{c.code} · {c.city || c.country || "—"}</div>
                  </button>
                ))}
              </div>
            )}
          </div>
          <div>
            <label className="text-xs text-slate-600 block mb-1">Contact person</label>
            <input
              value={contactName}
              onChange={(e) => setContactName(e.target.value)}
              placeholder="Contact name"
              className="w-full text-sm border border-slate-300 rounded px-2 py-1.5"
            />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3 mb-3">
          <div className="relative">
            <label className="text-xs text-slate-600 block mb-1">Machine (optional)</label>
            <input
              value={selectedMachine ? selectedMachine.machine_no : machineSearch}
              onChange={(e) => {
                setMachineSearch(e.target.value);
                setMachineNo("");
                setMachineDropdownOpen(true);
              }}
              onFocus={() => setMachineDropdownOpen(true)}
              onBlur={() => setTimeout(() => setMachineDropdownOpen(false), 200)}
              placeholder="Search machine..."
              className="w-full text-sm border border-slate-300 rounded px-2 py-1.5"
            />
            {machineDropdownOpen && filteredMachines.length > 0 && (
              <div className="absolute z-10 mt-1 w-full bg-white border border-slate-200 rounded-md shadow-lg max-h-60 overflow-y-auto">
                {filteredMachines.map((m) => (
                  <button
                    key={m.machine_no}
                    type="button"
                    onClick={() => {
                      setMachineNo(m.machine_no);
                      setMachineSearch("");
                      setMachineDropdownOpen(false);
                    }}
                    className="block w-full text-left px-2 py-1.5 hover:bg-slate-50 text-xs"
                  >
                    <div className="font-mono">{m.machine_no}</div>
                    <div className="text-[10px] text-slate-500">
                      {m.product_code} {m.version && `(${m.version})`}
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>
          <div>
            <label className="text-xs text-slate-600 block mb-1">Due date</label>
            <input
              type="date"
              value={dueDate}
              onChange={(e) => setDueDate(e.target.value)}
              className="w-full text-sm border border-slate-300 rounded px-2 py-1.5"
            />
          </div>
        </div>

        <div className="mb-3">
          <label className="text-xs text-slate-600 block mb-1">Customer PO (optional)</label>
          <input
            value={customerPo}
            onChange={(e) => setCustomerPo(e.target.value)}
            placeholder="PO number"
            className="w-full text-sm border border-slate-300 rounded px-2 py-1.5"
          />
        </div>

        <div className="mb-3">
          <label className="text-xs text-slate-600 block mb-1">Assigned engineers <span className="text-red-600">*</span></label>
          <div className="flex flex-wrap gap-1.5 p-2 border border-slate-300 rounded-md min-h-[36px] items-center">
            {engineerCodes.map((code) => {
              const eng = engineers.find((e) => e.code === code);
              const isLead = leadEngineer === code;
              return (
                <span
                  key={code}
                  className="inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full"
                  style={isLead ? { background: "#FEE2E5", color: "#C8102E" } : { background: "#F1F5F9", color: "#475569" }}
                >
                  <button
                    type="button"
                    onClick={() => setLeadEngineer(code)}
                    title="Set as lead"
                  >
                    {isLead ? "★" : "☆"}
                  </button>
                  <span className="font-mono">{code}</span>
                  {eng && <span className="text-[10px] opacity-60">{eng.full_name.split(" ")[0]}</span>}
                  <button type="button" onClick={() => toggleEngineer(code)}>✕</button>
                </span>
              );
            })}
            <select
              value=""
              onChange={(e) => {
                if (e.target.value) toggleEngineer(e.target.value);
              }}
              className="text-xs border-none bg-transparent outline-none"
            >
              <option value="">+ add engineer</option>
              {availableEngineers.map((e) => (
                <option key={e.code} value={e.code}>
                  {e.code} — {e.full_name}
                </option>
              ))}
            </select>
          </div>
          <div className="text-[10px] text-slate-400 mt-1">First engineer = lead by default. Click ☆ to change.</div>
        </div>

        <div className="mb-3">
          <label className="text-xs text-slate-600 block mb-1">Initial notes (optional)</label>
          <textarea
            value={initialNotes}
            onChange={(e) => setInitialNotes(e.target.value)}
            placeholder="What's the reason for this case? Any context..."
            className="w-full text-xs border border-slate-300 rounded p-2 min-h-[60px]"
          />
        </div>

        {/* Sessions preview */}
        {parsedPreview && parsedPreview.sessions > 0 && (
          <div className="mt-4">
            <div className="text-[10px] font-medium text-slate-500 tracking-wider mb-2">
              SESSIONS PREVIEW <span className="text-blue-600 font-normal tracking-normal">— will be created with this case</span>
            </div>
            <div className="bg-slate-50 border border-slate-200 rounded-md p-2 space-y-1">
              {parsedPreview.sessionList.map((s, i) => (
                <div key={i} className="bg-white border border-slate-200 rounded p-2 text-xs">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-medium">{s.date} · {s.engineer_code}</span>
                    <span className="text-[10px] bg-slate-100 text-slate-600 px-1.5 py-0.5 rounded">{s.activity_type}</span>
                    {s.travel_minutes > 0 && <span className="text-[10px] bg-pink-50 text-pink-700 px-1.5 py-0.5 rounded">T {fmtTime(s.travel_minutes)}</span>}
                    {s.work_minutes > 0 && <span className="text-[10px] bg-blue-50 text-blue-700 px-1.5 py-0.5 rounded">W {fmtTime(s.work_minutes)}</span>}
                    {s.switched_to_so && <span className="text-[10px] bg-amber-50 text-amber-700 px-1.5 py-0.5 rounded">→ {s.switched_to_so}</span>}
                    <span className="text-[10px] bg-green-50 text-green-700 px-1.5 py-0.5 rounded">parsed</span>
                  </div>
                </div>
              ))}
              {parsedPreview.sessions > parsedPreview.sessionList.length && (
                <div className="text-xs text-slate-500 text-center pt-1">
                  + {parsedPreview.sessions - parsedPreview.sessionList.length} more
                </div>
              )}
            </div>
          </div>
        )}

        {/* Actions */}
        <div className="flex gap-2 items-center pt-4 mt-4 border-t border-slate-200">
          <button
            type="button"
            onClick={handleSubmit}
            disabled={isPending}
            className="text-sm px-4 py-2 rounded font-medium"
            style={{ background: "#C8102E", color: "white" }}
          >
            {isPending ? "Creating..." : `Create case${parsedPreview && parsedPreview.sessions > 0 ? ` + ${parsedPreview.sessions} sessions` : ""}`}
          </button>
          <Link href="/cases" className="text-sm px-4 py-2 rounded border border-slate-300">
            Cancel
          </Link>
        </div>
      </div>
    </div>
  );
}
