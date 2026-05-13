"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { createCustomer, type CustomerContactInput } from "./actions";

interface Contact {
  id: number;
  name: string;
  role?: string | null;
  phone?: string | null;
  email?: string | null;
  is_primary: boolean;
}

interface Customer {
  code: string;
  name: string;
  city?: string | null;
  country?: string | null;
  address?: string | null;
  contact_name?: string | null;
  contact_mobile?: string | null;
  notes?: string | null;
  contacts: Contact[];
  machines_count: number;
  cases_count: number;
}

export default function CustomersClient({ customers }: { customers: Customer[] }) {
  const router = useRouter();
  const [showNew, setShowNew] = useState(false);
  const [search, setSearch] = useState("");
  const [expandedCode, setExpandedCode] = useState<string | null>(null);

  const filtered = search
    ? customers.filter(
        (c) =>
          c.name.toLowerCase().includes(search.toLowerCase()) ||
          c.code.toLowerCase().includes(search.toLowerCase()) ||
          (c.city || "").toLowerCase().includes(search.toLowerCase())
      )
    : customers;

  return (
    <div className="max-w-7xl mx-auto px-6 py-8">
      <div className="flex items-center justify-between mb-2">
        <h1 className="text-[28px] font-bold text-slate-900 leading-tight">Customers</h1>
        <button
          onClick={() => setShowNew(true)}
          className="text-[14px] px-5 py-2.5 rounded-lg font-medium text-white inline-flex items-center gap-1.5"
          style={{ background: "#C8102E" }}
        >
          <span className="text-lg leading-none">+</span> New customer
        </button>
      </div>
      <p className="text-[14px] text-slate-500 mb-6">{customers.length} customers in directory</p>

      <div className="bg-white border border-slate-200 rounded-2xl p-4 mb-5">
        <div className="relative">
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search customer name, code, city..."
            className="w-full pl-10 pr-3 py-2.5 text-[14px] border border-slate-200 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-red-100"
          />
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">🔍</span>
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden">
        <table className="w-full text-[13px]">
          <thead className="bg-slate-50 text-slate-600 border-b border-slate-200">
            <tr className="text-left">
              <th className="px-5 py-3 font-semibold text-[12px] uppercase tracking-wider w-20">Code</th>
              <th className="px-5 py-3 font-semibold text-[12px] uppercase tracking-wider">Customer</th>
              <th className="px-5 py-3 font-semibold text-[12px] uppercase tracking-wider w-36">City</th>
              <th className="px-5 py-3 font-semibold text-[12px] uppercase tracking-wider w-28">Country</th>
              <th className="px-5 py-3 font-semibold text-[12px] uppercase tracking-wider w-32">Primary contact</th>
              <th className="px-5 py-3 font-semibold text-[12px] uppercase tracking-wider w-24 text-right">Machines</th>
              <th className="px-5 py-3 font-semibold text-[12px] uppercase tracking-wider w-20 text-right">Cases</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((c) => {
              const primary = c.contacts.find((ct) => ct.is_primary) || c.contacts[0];
              const isExpanded = expandedCode === c.code;
              return (
                <>
                  <tr
                    key={c.code}
                    className="border-b border-slate-100 hover:bg-slate-50 transition-colors cursor-pointer"
                    onClick={() => setExpandedCode(isExpanded ? null : c.code)}
                  >
                    <td className="px-5 py-3 font-mono text-[12px] text-slate-500">
                      <span className="text-slate-400 mr-1">{isExpanded ? "▾" : "▸"}</span>
                      {c.code}
                    </td>
                    <td className="px-5 py-3 font-medium text-slate-800">{c.name}</td>
                    <td className="px-5 py-3 text-slate-600">{c.city ?? "—"}</td>
                    <td className="px-5 py-3 text-slate-600">{c.country ?? "—"}</td>
                    <td className="px-5 py-3 text-slate-600 truncate">
                      {primary ? (
                        <>
                          {primary.name}
                          {c.contacts.length > 1 && (
                            <span className="ml-1.5 text-[11px] text-slate-400">+{c.contacts.length - 1}</span>
                          )}
                        </>
                      ) : (
                        "—"
                      )}
                    </td>
                    <td className="px-5 py-3 text-right tabular-nums font-medium">{c.machines_count}</td>
                    <td className="px-5 py-3 text-right tabular-nums font-medium">{c.cases_count}</td>
                  </tr>
                  {isExpanded && (
                    <tr key={`${c.code}-expand`} className="bg-slate-50/50">
                      <td colSpan={7} className="px-5 py-4">
                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <h4 className="text-[11px] font-semibold uppercase tracking-wider text-slate-500 mb-2">
                              Details
                            </h4>
                            <div className="space-y-1.5 text-[13px]">
                              <div>
                                <span className="text-slate-500">Address:</span>{" "}
                                <span className="text-slate-800">{c.address || "—"}</span>
                              </div>
                              {c.notes && (
                                <div>
                                  <span className="text-slate-500">Notes:</span>{" "}
                                  <span className="text-slate-800">{c.notes}</span>
                                </div>
                              )}
                            </div>
                          </div>
                          <div>
                            <h4 className="text-[11px] font-semibold uppercase tracking-wider text-slate-500 mb-2">
                              Contacts ({c.contacts.length})
                            </h4>
                            <div className="space-y-2">
                              {c.contacts.length === 0 && (
                                <div className="text-[13px] text-slate-400 italic">No contacts yet</div>
                              )}
                              {c.contacts.map((ct) => (
                                <div
                                  key={ct.id}
                                  className="bg-white border border-slate-200 rounded-lg px-3 py-2 text-[13px]"
                                >
                                  <div className="flex items-center gap-2">
                                    {ct.is_primary && (
                                      <span title="Primary" className="text-[12px]">
                                        ⭐
                                      </span>
                                    )}
                                    <strong className="text-slate-800">{ct.name}</strong>
                                    {ct.role && <span className="text-slate-500">· {ct.role}</span>}
                                  </div>
                                  <div className="text-[11px] text-slate-500 mt-0.5 flex gap-3">
                                    {ct.phone && <span>📞 {ct.phone}</span>}
                                    {ct.email && <span>✉ {ct.email}</span>}
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>
                        </div>
                      </td>
                    </tr>
                  )}
                </>
              );
            })}
            {filtered.length === 0 && (
              <tr>
                <td colSpan={7} className="px-5 py-12 text-center text-slate-400 text-[13px]">
                  No customers found
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {showNew && (
        <NewCustomerModal
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

function NewCustomerModal({ onClose, onSuccess }: { onClose: () => void; onSuccess: () => void }) {
  const [pending, startTransition] = useTransition();
  const [form, setForm] = useState({
    code: "",
    name: "",
    city: "",
    country: "",
    address: "",
    notes: "",
  });
  const [contacts, setContacts] = useState<CustomerContactInput[]>([
    { name: "", role: "", phone: "", email: "", is_primary: true },
  ]);
  const [error, setError] = useState("");

  function updateContact(i: number, field: keyof CustomerContactInput, value: string | boolean) {
    const next = [...contacts];
    next[i] = { ...next[i], [field]: value } as any;
    if (field === "is_primary" && value === true) {
      next.forEach((c, idx) => {
        if (idx !== i) c.is_primary = false;
      });
    }
    setContacts(next);
  }

  function addContact() {
    setContacts([...contacts, { name: "", role: "", phone: "", email: "", is_primary: contacts.length === 0 }]);
  }

  function removeContact(i: number) {
    setContacts(contacts.filter((_, idx) => idx !== i));
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    startTransition(async () => {
      const validContacts = contacts.filter((c) => c.name.trim());
      const result = await createCustomer({ ...form, contacts: validContacts });
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
          <h3 className="text-[20px] font-semibold">New customer</h3>
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
          <FormField label="Legal name" required>
            <input
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              className="form-inp"
              placeholder="e.g. Essilor Manufacturing (Thailand) Ltd"
              autoFocus
            />
          </FormField>

          <div className="grid grid-cols-3 gap-3">
            <FormField label="Code">
              <input
                value={form.code}
                onChange={(e) => setForm({ ...form, code: e.target.value.toUpperCase() })}
                className="form-inp font-mono"
                placeholder="Auto"
              />
            </FormField>
            <FormField label="City">
              <input
                value={form.city}
                onChange={(e) => setForm({ ...form, city: e.target.value })}
                className="form-inp"
              />
            </FormField>
            <FormField label="Country">
              <input
                value={form.country}
                onChange={(e) => setForm({ ...form, country: e.target.value })}
                className="form-inp"
                placeholder="Thailand"
              />
            </FormField>
          </div>

          <FormField label="Address">
            <input
              value={form.address}
              onChange={(e) => setForm({ ...form, address: e.target.value })}
              className="form-inp"
              placeholder="Street, city, postal code"
            />
          </FormField>

          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-[13px] font-medium text-slate-700">Contacts</label>
              <button
                type="button"
                onClick={addContact}
                className="text-[12px] px-2 py-1 rounded text-white"
                style={{ background: "#C8102E" }}
              >
                + Add contact
              </button>
            </div>
            <div className="space-y-3">
              {contacts.map((ct, i) => (
                <div key={i} className="bg-slate-50 border border-slate-200 rounded-lg p-3">
                  <div className="flex items-center justify-between mb-2">
                    <label className="flex items-center gap-1.5 text-[12px] font-medium">
                      <input
                        type="checkbox"
                        checked={ct.is_primary || false}
                        onChange={(e) => updateContact(i, "is_primary", e.target.checked)}
                      />
                      ⭐ Primary contact
                    </label>
                    {contacts.length > 1 && (
                      <button
                        type="button"
                        onClick={() => removeContact(i)}
                        className="text-[11px] text-slate-500 hover:text-red-600"
                      >
                        Remove
                      </button>
                    )}
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <input
                      value={ct.name}
                      onChange={(e) => updateContact(i, "name", e.target.value)}
                      className="form-inp"
                      placeholder="Name *"
                    />
                    <input
                      value={ct.role}
                      onChange={(e) => updateContact(i, "role", e.target.value)}
                      className="form-inp"
                      placeholder="Role (Technical, Finance, etc.)"
                    />
                    <input
                      value={ct.phone}
                      onChange={(e) => updateContact(i, "phone", e.target.value)}
                      className="form-inp"
                      placeholder="Phone"
                    />
                    <input
                      value={ct.email}
                      onChange={(e) => updateContact(i, "email", e.target.value)}
                      className="form-inp"
                      placeholder="Email"
                      type="email"
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>

          <FormField label="Notes">
            <textarea
              value={form.notes}
              onChange={(e) => setForm({ ...form, notes: e.target.value })}
              className="form-inp"
              rows={2}
              placeholder="Internal notes"
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
              disabled={pending}
              className="px-5 py-2 rounded-lg text-[14px] text-white disabled:opacity-50"
              style={{ background: "#C8102E" }}
            >
              {pending ? "Creating..." : "✓ Create customer"}
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
