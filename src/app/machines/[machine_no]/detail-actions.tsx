"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Icon } from "@/components/icons";
import { EditMachineSheet } from "./edit-machine-sheet";
import { deleteMachine } from "../actions";
import type { MachineDetail } from "../queries";
import type { CustomerLite } from "@/app/customers/queries";

type Props = {
  m: MachineDetail;
  customers: CustomerLite[];
};

export function DetailActions({ m, customers }: Props) {
  const router = useRouter();
  const [editOpen, setEditOpen] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [delError, setDelError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  const canDelete = m.totals.all === 0;

  const onDelete = () => {
    setDelError(null);
    startTransition(async () => {
      const r = await deleteMachine(m.machine_no);
      if (!r.success) {
        setDelError(r.error ?? "Delete failed");
        setConfirmDelete(false);
        return;
      }
      router.push("/machines");
      router.refresh();
    });
  };

  return (
    <>
      <div style={{ display: "flex", gap: 8 }}>
        <button
          type="button"
          className="btn btn-secondary"
          onClick={() => setEditOpen(true)}
        >
          <Icon name="wrench" size={14} /> Edit machine
        </button>
        {canDelete && (
          confirmDelete ? (
            <span style={{ display: "flex", gap: 6 }}>
              <button
                type="button"
                className="btn btn-ghost"
                style={{ minHeight: 32, padding: "0 10px", fontSize: 12 }}
                onClick={() => setConfirmDelete(false)}
                disabled={pending}
              >
                Cancel
              </button>
              <button
                type="button"
                className="btn btn-danger"
                style={{ minHeight: 32, padding: "0 12px", fontSize: 12 }}
                onClick={onDelete}
                disabled={pending}
              >
                <Icon name="x" size={11} /> {pending ? "Deleting…" : "Confirm"}
              </button>
            </span>
          ) : (
            <button
              type="button"
              className="btn btn-ghost"
              style={{ color: "var(--danger)" }}
              onClick={() => setConfirmDelete(true)}
            >
              <Icon name="x" size={12} /> Delete
            </button>
          )
        )}
      </div>

      {delError && (
        <div
          style={{
            padding: 8,
            marginTop: 6,
            background: "var(--danger-soft)",
            color: "var(--danger)",
            borderRadius: 6,
            fontSize: 12,
          }}
        >
          <Icon name="alert" size={11} /> {delError}
        </div>
      )}

      <EditMachineSheet open={editOpen} onClose={() => setEditOpen(false)} m={m} customers={customers} />
    </>
  );
}
