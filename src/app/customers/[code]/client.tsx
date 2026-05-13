"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { fmtDate } from "@/lib/format";
import {
  updateCustomer,
  deleteCustomer,
  addContactToCustomer,
  updateContact,
  deleteContact,
  type CustomerContactInput,
} from "../actions";

interface Customer {
  code: string;
  name: string;
  city?: string | null;
  country?: string | null;
  address?: string | null;
  contact_name?: string | null;
  contact_mobile?: string | null;
  notes?: string | null;
}

interface Contact {
  id: number;
  customer_code: string;
  name: string;
  role?: string | null;
  phone?: string | null;
  email?: string | null;
  is_primary: boolean;
}

interface Machine {
  machine_no: string;
  name?: string | null;
  product_code?: string | null;
  serial_no?: string | null;
  version?: string | null;
  warranty_expiry?: string | null;
}

interface Case {
  so_number: string;
  status: string;
  service_type_name?: string | null;
  machine_no?: string | null;
  title?: string | null;
  due_date?: string | null;
}

const STATUS_COLORS: Record<string, { bg: string; fg: string }> = {
  planned: { bg: "#DDEBF7", fg: "#185FA5" },
  in_progress: { bg: "#FAEEDA", fg: "#6B3D04" },
  completed: { bg: "#D1FAE5", fg: "#065F46" },
  verified: { bg: "#D1FAE5", fg: "#065F46" },
  canceled: { bg: "#F1F5F9", fg: "#475569" },
};

export default function CustomerDetailClient({
  customer,
  contacts,
  machines,
  cases,
}: {
  customer: Customer;
  contacts: Contact[];
  machines: Machine[];
  cases: Case[];
}) {
  const router = useRouter();
  const [showEdit, setShowEdit] = useState(false);
  const [showDelete, setShowDelete] = useState(false);
  const [showAddContact, setShowAddContact] = useState(false);
  const [editingContact, setEditingContact] = useState<Contact | null>(null);
  const [activeTab, setActiveTab] = useState<"machines" | "cases">("machines");

  return (
    <div className="max-w-5xl mx-auto px-6 py-8">
      <div className="mb-4">
        <Link href="/customers" className="text-[13px] font-medium hover:underline" style={{ color: "#C8102E" }}>
          ← Back to customers
        </Link>
      </div>

      {/* Header card */}
      <div className="bg-white border border-slate-200 rounded-2xl p-6 mb-5">
        <div className="flex items-start justify-between gap-4 mb-4">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-3 mb-2 flex-wrap">
              <h1 className="text-[24px] font-bold leading-tight">{customer.name}</h1>
              <span className="font-mono text-[12px] px-2 py-1 rounded-md bg-slate-100 text-slate-600 font-semibold">
                {customer.code}
              </span>
            </div>
            <div className="text-[13px] text-slate-500">
              {[customer.city, customer.country].filter(Boolean).join(", ") || "—"}
            </div>
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

        {/* Info grid */}
        <div className="grid grid-cols-2 gap-x-6 gap-y-3 text-[13px] pt-4 border-t border-slate-100">
          <Info label="Address" value={customer.address} />
          <Info label="Country" value={customer.country} />
          <Info label="Notes" value={customer.notes} fullWidth />
        </div>
      </div>

      {/* Contacts section */}
      <div className="bg-white border border-slate-200 rounded-2xl p-6 mb-5">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-[17px] font-semibold">Contacts</h2>
            <p className="text-[13px] text-slate-500 mt-0.5">{contacts.length} contact{contacts.length !== 1 ? "s" : ""}</p>
          </div>
          <button
            onClick={() => setShowAddContact(true)}
            className="text-[13px] px-4 py-2 rounded-lg font-medium text-white inline-flex items-center gap-1.5"
            style={{ background: "#C8102E" }}
          >
            + Add contact
          </button>
        </div>

        {contacts.length === 0 && (
          <div className="text-[13px] text-slate-400 italic py-4 text-center">
            No contacts yet — click "+ Add contact" to add one
          </div>
        )}

        {contacts.map((c) => (
          <div
            key={c.id}
            className="border border-slate-200 rounded-lg px-4 py-3 mb-2 last:mb-0 flex items-center justify-between"
          >
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                {c.is_primary && <span title="Primary contact" className="text-[14px]">⭐</span>}
                <strong className="text-[14px] text-slate-800">{c.name}</strong>
                {c.role && <span className="text-[12px] text-slate-500">· {c.role}</span>}
              </div>
              <div className="text-[12px] text-slate-500 mt-1 flex gap-4 flex-wrap">
                {c.phone && <span>📞 {c.phone}</span>}
                {c.email && <span>✉ {c.email}</span>}
                {!c.phone && !c.email && <span className="italic text-slate-400">No phone/email</span>}
              </div>
            </div>
            <div className="flex gap-2 flex-shrink-0">
              <button
                onClick={() => setEditingContact(c)}
                className="text-[12px] px-2.5 py-1 rounded border border-slate-300 bg-white hover:bg-slate-50"
              >
                ✎
              </button>
              <DeleteContactButton contactId={c.id} contactName={c.name} />
            </div>
          </div>
        ))}
      </div>

      {/* Tabs: Machines / Cases */}
      <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden">
        <div className="flex border-b border-slate-200">
          <button
            onClick={() => setActiveTab("machines")}
            className="px-5 py-3.5 text-[14px] font-medium border-b-2"
            style={
              activeTab === "machines"
                ? { borderColor: "#C8102E", color: "#C8102E" }
                : { borderColor: "transparent", color: "#64748B" }
            }
          >
            Machines <span className="ml-1 text-slate-400">{machines.length}</span>
          </button>
          <button
            onClick={() => setActiveTab("cases")}
            className="px-5 py-3.5 text-[14px] font-medium border-b-2"
            style={
              activeTab === "cases"
                ? { borderColor: "#C8102E", color: "#C8102E" }
                : { borderColor: "transparent", color: "#64748B" }
            }
          >
            Cases <span className="ml-1 text-slate-400">{cases.length}</span>
          </button>
        </div>

        {activeTab === "machines" && (
          <div>
            {machines.length === 0 ? (
              <div className="p-10 text-center text-[13px] text-slate-400">
                No machines for this customer
              </div>
            ) : (
              <table className="w-full text-[13px]">
                <thead className="bg-slate-50 text-slate-600 border-b border-slate-200">
                  <tr className="text-left">
                    <th className="px-5 py-3 font-semibold text-[12px] uppercase tracking-wider w-40">Machine #</th>
                    <th className="px-5 py-3 font-semibold text-[12px] uppercase tracking-wider w-36">Product</th>
                    <th className="px-5 py-3 font-semibold text-[12px] uppercase tracking-wider w-24">Version</th>
                    <th className="px-5 py-3 font-semibold text-[12px] uppercase tracking-wider w-32">Serial</th>
                    <th className="px-5 py-3 font-semibold text-[12px] uppercase tracking-wider w-28">Warranty</th>
                  </tr>
                </thead>
                <tbody>
                  {machines.map((m) => (
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
                      <td className="px-5 py-3 text-slate-600">{m.version ?? "—"}</td>
                      <td className="px-5 py-3 font-mono text-[12px]">{m.serial_no ?? "—"}</td>
                      <td className="px-5 py-3 text-slate-500">{fmtDate(m.warranty_expiry)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        )}

        {activeTab === "cases" && (
          <div>
            {cases.length === 0 ? (
              <div className="p-10 text-center text-[13px] text-slate-400">
                No cases for this customer yet
              </div>
            ) : (
              <table className="w-full text-[13px]">
                <thead className="bg-slate-50 text-slate-600 border-b border-slate-200">
                  <tr className="text-left">
                    <th className="px-5 py-3 font-semibold text-[12px] uppercase tracking-wider w-32">SO</th>
                    <th className="px-5 py-3 font-semibold text-[12px] uppercase tracking-wider w-28">Status</th>
                    <th className="px-5 py-3 font-semibold text-[12px] uppercase tracking-wider w-36">Type</th>
                    <th className="px-5 py-3 font-semibold text-[12px] uppercase tracking-wider">Title</th>
                    <th className="px-5 py-3 font-semibold text-[12px] uppercase tracking-wider w-28">Due</th>
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
                        <td className="px-5 py-3 text-slate-600">
                          {c.service_type_name?.split(" ")[0] || "—"}
                        </td>
                        <td className="px-5 py-3 truncate">{c.title || c.machine_no || "—"}</td>
                        <td className="px-5 py-3 text-slate-500">{fmtDate(c.due_date)}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            )}
          </div>
        )}
      </div>

      {/* Modals */}
      {showEdit && (
        <EditCustomerModal customer={customer} onClose={() => setShowEdit(false)} onSuccess={() => { setShowEdit(false); router.refresh(); }} />
      )}
      {showDelete && (
        <DeleteCustomerModal customer={customer} onClose={() => setShowDelete(false)} onSuccess={() => router.push("/customers")} />
      )}
      {showAddContact && (
        <ContactModal
          mode="add"
          customerCode={customer.code}
          onClose={() => setShowAddContact(false)}
          onSuccess={() => { setShowAddContact(false); router.refresh(); }}
        />
      )}
      {editingContact && (
        <ContactModal
          mode="edit"
          customerCode={customer.code}
          contact={editingContact}
          onClose={() => setEditingContact(null)}
          onSuccess={() => { setEditingContact(null); router.refresh(); }}
        />
      )}
    </div>
  );
}

function Info({ label, value, fullWidth }: { label: string; value?: string | null; fullWidth?: boolean }) {
  return (
    <div className={fullWidth ? "col-span-2" : ""}>
      <div className="text-[11px] uppercase tracking-wider text-slate-500 mb-1 font-semibold">{label}</div>
      <div className="text-slate-800">{value || "—"}</div>
    </div>
  );
}

function DeleteContactButton({ contactId, contactName }: { contactId: number; contactName: string }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [confirm, setConfirm] = useState(false);

  function handleDelete() {
    startTransition(async () => {
      const result = await deleteContact(contactId);
      if (result.success) {
        router.refresh();
      } else {
        alert(result.error);
      }
      setConfirm(false);
    });
  }

  if (confirm) {
    return (
      <div className="flex gap-1">
        <button
          onClick={handleDelete}
          disabled={pending}
          className="text-[11px] px-2 py-1 rounded text-white"
          style={{ background: "#C8102E" }}
        >
          Confirm
        </button>
        <button
          onClick={() => setConfirm(false)}
          className="text-[11px] px-2 py-1 rounded border border-slate-300 bg-white"
        >
          ✕
        </button>
      </div>
    );
  }

  return (
    <button
      onClick={() => setConfirm(true)}
      className="text-[12px] px-2.5 py-1 rounded border bg-white hover:bg-red-50"
      style={{ color: "#C8102E", borderColor: "#FECDD3" }}
      title="Delete contact"
    >
      🗑
    </button>
  );
}

function EditCustomerModal({
  customer,
  onClose,
  onSuccess,
}: {
  customer: Customer;
  onClose: () => void;
  onSuccess: () => void;
}) {
  const [pending, startTransition] = useTransition();
  const [form, setForm] = useState({
    name: customer.name,
    city: customer.city || "",
    country: customer.country || "",
    address: customer.address || "",
    notes: customer.notes || "",
  });
  const [error, setError] = useState("");

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    startTransition(async () => {
      const result = await updateCustomer(customer.code, form);
      if (result.success) onSuccess();
      else setError(result.error || "Failed");
    });
  }

  return (
    <Modal title={`Edit ${customer.code}`} onClose={onClose}>
      {error && <div className="bg-red-50 border border-red-200 rounded-lg p-3 mb-4 text-[13px] text-red-700">⚠ {error}</div>}
      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <FormField label="Legal name" required>
          <input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className="form-inp" autoFocus />
        </FormField>
        <div className="grid grid-cols-2 gap-3">
          <FormField label="City">
            <input value={form.city} onChange={(e) => setForm({ ...form, city: e.target.value })} className="form-inp" />
          </FormField>
          <FormField label="Country">
            <input value={form.country} onChange={(e) => setForm({ ...form, country: e.target.value })} className="form-inp" />
          </FormField>
        </div>
        <FormField label="Address">
          <input value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })} className="form-inp" />
        </FormField>
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

function DeleteCustomerModal({
  customer,
  onClose,
  onSuccess,
}: {
  customer: Customer;
  onClose: () => void;
  onSuccess: () => void;
}) {
  const [pending, startTransition] = useTransition();
  const [step, setStep] = useState<1 | 2>(1);
  const [confirmText, setConfirmText] = useState("");
  const [error, setError] = useState("");

  function handleDelete() {
    if (confirmText !== customer.code) {
      setError(`Please type "${customer.code}" exactly to confirm`);
      return;
    }
    startTransition(async () => {
      const result = await deleteCustomer(customer.code);
      if (result.success) onSuccess();
      else setError(result.error || "Failed");
    });
  }

  return (
    <Modal title="Delete customer" onClose={onClose}>
      {step === 1 ? (
        <>
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-4">
            <div className="text-[14px] font-medium text-red-800 mb-1">⚠ Permanent deletion</div>
            <div className="text-[13px] text-red-700">
              This will delete <strong>{customer.name}</strong> ({customer.code}) and all its contacts and machines.
              Cases linked to this customer must be removed first.
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
            Type <code className="font-mono px-1.5 py-0.5 bg-slate-100 rounded">{customer.code}</code> to confirm deletion:
          </p>
          <input
            value={confirmText}
            onChange={(e) => setConfirmText(e.target.value)}
            placeholder={customer.code}
            className="form-inp mb-4"
            autoFocus
          />
          <div className="flex justify-end gap-2">
            <button onClick={() => setStep(1)} className="px-4 py-2 rounded-lg text-[14px] border border-slate-300 bg-white">← Back</button>
            <button
              onClick={handleDelete}
              disabled={pending || confirmText !== customer.code}
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

function ContactModal({
  mode,
  customerCode,
  contact,
  onClose,
  onSuccess,
}: {
  mode: "add" | "edit";
  customerCode: string;
  contact?: Contact;
  onClose: () => void;
  onSuccess: () => void;
}) {
  const [pending, startTransition] = useTransition();
  const [form, setForm] = useState<CustomerContactInput>({
    name: contact?.name || "",
    role: contact?.role || "",
    phone: contact?.phone || "",
    email: contact?.email || "",
    is_primary: contact?.is_primary || false,
  });
  const [error, setError] = useState("");

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    startTransition(async () => {
      const result =
        mode === "add"
          ? await addContactToCustomer(customerCode, form)
          : await updateContact(contact!.id, form);
      if (result.success) onSuccess();
      else setError(result.error || "Failed");
    });
  }

  return (
    <Modal title={mode === "add" ? "Add contact" : "Edit contact"} onClose={onClose}>
      {error && <div className="bg-red-50 border border-red-200 rounded-lg p-3 mb-4 text-[13px] text-red-700">⚠ {error}</div>}
      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <FormField label="Name" required>
          <input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className="form-inp" autoFocus />
        </FormField>
        <FormField label="Role">
          <input
            value={form.role}
            onChange={(e) => setForm({ ...form, role: e.target.value })}
            className="form-inp"
            placeholder="Technical Manager, Procurement, Finance..."
          />
        </FormField>
        <div className="grid grid-cols-2 gap-3">
          <FormField label="Phone">
            <input value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} className="form-inp" />
          </FormField>
          <FormField label="Email">
            <input type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} className="form-inp" />
          </FormField>
        </div>
        <label className="flex items-center gap-2 text-[13px]">
          <input type="checkbox" checked={form.is_primary || false} onChange={(e) => setForm({ ...form, is_primary: e.target.checked })} />
          ⭐ Set as primary contact
        </label>
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
