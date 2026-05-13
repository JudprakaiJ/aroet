"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { createCustomer, type ContactInput } from "./actions";

interface Customer {
  code: string;
  name: string;
  city?: string | null;
  country?: string | null;
  address?: string | null;
  machine_count: number;
  case_count: number;
  contacts: { name: string; role?: string; phone?: string; email?: string; is_primary?: boolean }[];
}

export default function CustomerListClient({ customers }: { customers: Customer[] }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [showModal, setShowModal] = useState(false);
  const [search, setSearch] = useState("");
  const [expanded, setExpanded] = useState<string | null>(null);

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
        <h1 className="text-[28px] font-bold leading-tight">Customers</h1>
        <button
          onClick={() => setShowModal(true)}
          className="text-[14px] px-5 py-2.5 rounded-lg font-medium text-white inline-flex items-center gap-1.5"
          style={{ background: "#C8102E" }}
        >
          <span className="text-lg leading-none">+</span> New customer
        </button>
      </div>
      <p className="text-[14px] text-slate-500 mb-5">{customers.length} customers in directory</p>

      <div className="bg-white rounded-2xl border border-slate-200 p-4 mb-5">
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search name, code, city..."
          className="w-full px-4 py-2.5 text-[14px] border border-slate-200 rounded-lg"
        />
      </div>

      <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden">
        <table className="w-full text-[13px]">
          <thead className="bg-slate-50 text-slate-600 border-b border-slate-200">
            <tr className="text-left">
              <th className="px-5 py-3 font-semibold text-[12px] uppercase tracking-wider w-20">Code</th>
              <th className="px-5 py-3 font-semibold text-[12px] uppercase tracking-wider">Customer</th>
              <th className="px-5 py-3 font-semibold text-[12px] uppercase tracking-wider w-36">City</th>
              <th className="px-5 py-3 font-semibold text-[12px] uppercase tracking-wider w-28">Country</th>
              <th className="px-5 py-3 font-semibold text-[12px] uppercase tracking-wider w-32">Primary Contact</th>
              <th className="px-5 py-3 font-semibold text-[12px] uppercase tracking-wider w-24 text-right">Machines</th>
              <th className="px-5 py-3 font-semibold text-[12px] uppercase tracking-wider w-20 text-right">Cases</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((c) => {
              const primary = c.contacts.find((x) => x.is_primary) || c.contacts[0];
              const isExpanded = expanded === c.code;
              return (
                <>
                  <tr
                    key={c.code}
                    className="border-b border-slate-100 hover:bg-slate-50 cursor-pointer transition-colors"
                    onClick={() => setExpanded(isExpanded ? null : c.code)}
                  >
                    <td className="px-5 py-3 font-mono text-[12px] text-slate-500">{c.code}</td>
                    <td className="px-5 py-3 font-medium text-slate-800">
                      <div className="flex items-center gap-2">
                        <span className="text-slate-300 text-xs">{isExpanded ? "▾" : "▸"}</span>
                        <span>{c.name}</span>
                        {c.contacts.length > 1 && (
                          <span className="text-[11px] px-1.5 py-0.5 rounded-md bg-slate-100 text-slate-600 font-medium">
                            +{c.contacts.length - 1} contacts
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="px-5 py-3 text-slate-600">{c.city ?? "—"}</td>
                    <td className="px-5 py-3 text-slate-600">{c.country ?? "—"}</td>
                    <td className="px-5 py-3 text-slate-600 truncate">
                      {primary ? (
                        <div>
                          <div className="font-medium text-[12px]">{primary.name}</div>
                          {primary.role && <div className="text-[11px] text-slate-400">{primary.role}</div>}
                        </div>
                      ) : (
                        "—"
                      )}
                    </td>
                    <td className="px-5 py-3 text-right tabular-nums font-medium">{c.machine_count}</td>
                    <td className="px-5 py-3 text-right tabular-nums font-medium">{c.case_count}</td>
                  </tr>
                  {isExpanded && (
                    <tr className="border-b border-slate-100 bg-slate-50/50">
                      <td colSpan={7} className="px-5 py-4">
                        {c.address && (
                          <div className="text-[12px] text-slate-600 mb-3">
                            📍 {c.address}
                          </div>
                        )}
                        <div className="text-[11px] uppercase tracking-wider font-semibold text-slate-500 mb-2">
                          All contacts ({c.contacts.length})
                        </div>
                        {c.contacts.length === 0 ? (
                          <div className="text-[12px] text-slate-400 italic">No contacts yet</div>
                        ) : (
                          <div className="grid grid-cols-2 gap-2">
                            {c.contacts.map((ct, i) => (
                              <div key={i} className="bg-white rounded-lg p-3 border border-slate-200">
                                <div className="flex items-center gap-2 mb-1">
                                  {ct.is_primary && <span title="Primary">⭐</span>}
                                  <span className="font-medium text-[13px]">{ct.name}</span>
                                  {ct.role && (
                                    <span className="text-[11px] text-slate-500">· {ct.role}</span>
                                  )}
                                </div>
                                {ct.phone && (
                                  <div className="text-[11px] text-slate-500">📞 {ct.phone}</div>
                                )}
                                {ct.email && (
                                  <div className="text-[11px] text-slate-500">✉ {ct.email}</div>
                                )}
                              </div>
                            ))}
                          </div>
                        )}
                      </td>
                    </tr>
                  )}
                </>
              );
            })}
            {filtered.length === 0 && (
              <tr>
                <td colSpan={7} className="px-5 py-12 text-center text-slate-400 text-[13px]">
                  No customers match search
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {showModal && (
        <NewCustomerModal
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

function NewCustomerModal({
  onClose,
  onCreated,
}: {
  onClose: () => void;
  onCreated: () => void;
}) {
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState("");
  const [name, setName] = useState("");
  const [code, setCode] = useState("");
  const [city, setCity] = useState("");
  const [country, setCountry] = useState("");
  const [address, setAddress] = useState("");
  const [notes, setNotes] = useState("");
  const [contacts, setContacts] = useState<ContactInput[]>([
    { name: "", role: "", phone: "", email: "", is_primary: true },
  ]);

  function addContact() {
    setContacts([...contacts, { name: "", role: "", phone: "", email: "", is_primary: false }]);
  }

  function removeContact(i: number) {
    setContacts(contacts.filter((_, idx) => idx !== i));
  }

  function updateContact(i: number, patch: Partial<ContactInput>) {
    setContacts(contacts.map((c, idx) => (idx === i ? { ...c, ...patch } : c)));
  }

  function setPrimary(i: number) {
    setContacts(contacts.map((c, idx) => ({ ...c, is_primary: idx === i })));
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    startTransition(async () => {
      const filteredContacts = contacts.filter((c) => c.name.trim());
      const result = await createCustomer({
        code,
        name,
        city,
        country,
        address,
        notes,
        contacts: filteredContacts,
      });
      if (result.success) {
        onCreated();
      } else {
        setError(result.error || "Failed to create customer");
      }
    });
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: "rgba(15,23,42,0.5)" }}>
      <div className="bg-white rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-auto">
        <div className="px-6 py-5 border-b border-slate-200 flex items-center justify-between sticky top-0 bg-white">
          <h3 className="text-[18px] font-semibold">New customer</h3>
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

          <div className="mb-4">
            <label className="block text-[13px] font-medium text-slate-700 mb-1.5">
              Legal name <span style={{ color: "#C8102E" }}>*</span>
            </label>
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Essilor Manufacturing (Thailand) Ltd"
              className="form-input"
              autoFocus
            />
          </div>

          <div className="grid grid-cols-3 gap-3 mb-4">
            <div>
              <label className="block text-[13px] font-medium text-slate-700 mb-1.5">Code</label>
              <input
                value={code}
                onChange={(e) => setCode(e.target.value.toUpperCase())}
                placeholder="Auto"
                className="form-input font-mono"
              />
            </div>
            <div>
              <label className="block text-[13px] font-medium text-slate-700 mb-1.5">City</label>
              <input value={city} onChange={(e) => setCity(e.target.value)} className="form-input" />
            </div>
            <div>
              <label className="block text-[13px] font-medium text-slate-700 mb-1.5">Country</label>
              <input value={country} onChange={(e) => setCountry(e.target.value)} className="form-input" placeholder="Thailand" />
            </div>
          </div>

          <div className="mb-4">
            <label className="block text-[13px] font-medium text-slate-700 mb-1.5">Address</label>
            <textarea
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              rows={2}
              className="form-input"
              placeholder="123 Industrial Park, Bangkok 10110"
            />
          </div>

          <div className="mb-4 pt-4 border-t border-slate-200">
            <div className="flex items-center justify-between mb-3">
              <label className="text-[13px] font-medium text-slate-700">
                Contacts ({contacts.filter((c) => c.name.trim()).length})
              </label>
              <button
                type="button"
                onClick={addContact}
                className="text-[12px] text-red-600 font-medium hover:underline"
                style={{ color: "#C8102E" }}
              >
                + Add contact
              </button>
            </div>

            <div className="flex flex-col gap-2">
              {contacts.map((c, i) => (
                <div key={i} className="bg-slate-50 rounded-lg p-3 border border-slate-200">
                  <div className="flex items-center gap-2 mb-2">
                    <button
                      type="button"
                      onClick={() => setPrimary(i)}
                      className="text-[14px]"
                      title={c.is_primary ? "Primary contact" : "Click to set as primary"}
                    >
                      {c.is_primary ? "⭐" : "☆"}
                    </button>
                    <input
                      value={c.name}
                      onChange={(e) => updateContact(i, { name: e.target.value })}
                      placeholder="Contact name"
                      className="flex-1 px-2 py-1.5 text-[13px] border border-slate-200 rounded-md bg-white"
                    />
                    <input
                      value={c.role}
                      onChange={(e) => updateContact(i, { role: e.target.value })}
                      placeholder="Role"
                      className="w-32 px-2 py-1.5 text-[13px] border border-slate-200 rounded-md bg-white"
                    />
                    {contacts.length > 1 && (
                      <button
                        type="button"
                        onClick={() => removeContact(i)}
                        className="text-slate-400 hover:text-slate-700 px-1"
                      >
                        ✕
                      </button>
                    )}
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <input
                      value={c.phone}
                      onChange={(e) => updateContact(i, { phone: e.target.value })}
                      placeholder="📞 Phone"
                      className="px-2 py-1.5 text-[13px] border border-slate-200 rounded-md bg-white"
                    />
                    <input
                      value={c.email}
                      onChange={(e) => updateContact(i, { email: e.target.value })}
                      placeholder="✉ Email"
                      type="email"
                      className="px-2 py-1.5 text-[13px] border border-slate-200 rounded-md bg-white"
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="mb-4">
            <label className="block text-[13px] font-medium text-slate-700 mb-1.5">Notes</label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={2}
              className="form-input"
              placeholder="Any additional notes about this customer..."
            />
          </div>

          <div className="flex justify-end gap-2 pt-4 border-t border-slate-200">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-lg text-[13px] border border-slate-300 bg-white"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={pending}
              className="px-4 py-2 rounded-lg text-[13px] text-white disabled:opacity-50"
              style={{ background: "#C8102E" }}
            >
              {pending ? "Creating..." : "Create customer"}
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
