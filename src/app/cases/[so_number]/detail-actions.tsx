"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Icon } from "@/components/icons";
import { StatusMenu } from "./status-menu";
import { AddSessionSheet } from "./add-session-sheet";
import { EditCaseSheet } from "./edit-case-sheet";
import { deleteCase, type CaseStatus } from "./actions";
import type { CaseDetail, LiteCustomer, LiteMachine } from "./queries";

type Props = {
  c: CaseDetail;
  customers: LiteCustomer[];
  allMachines: LiteMachine[];
  /** Number of sessions logged on this case. Controls Delete visibility. */
  sessionsCount: number;
};

const EDITABLE: CaseStatus[] = ["planned", "in_progress"];

export function DetailActions({ c, customers, allMachines, sessionsCount }: Props) {
  const router = useRouter();
  const [addOpen, setAddOpen] = useState(false);
  const [statusOpen, setStatusOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [delError, setDelError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  const status = c.status as CaseStatus;
  const canEdit = EDITABLE.includes(status);
  const canChangeStatus = status !== "verified" && status !== "canceled";
  const canDelete = sessionsCount === 0;

  const onDelete = () => {
    setDelError(null);
    startTransition(async () => {
      const r = await deleteCase(c.so_number);
      if (!r.success) {
        setDelError(r.error ?? "Delete failed");
        setConfirmDelete(false);
        return;
      }
      router.push("/cases");
      router.refresh();
    });
  };

  return (
    <>
      <div style={{ display: "flex", gap: 8 }}>
        <button
          type="button"
          className="btn btn-primary btn-block"
          onClick={() => setAddOpen(true)}
        >
          <Icon name="plus" size={14} /> Add session
        </button>
        {canEdit && (
          <button
            type="button"
            className="btn btn-secondary"
            onClick={() => setEditOpen(true)}
            aria-label="Edit case"
            title="Edit case"
          >
            <Icon name="wrench" size={14} />
          </button>
        )}
        {canChangeStatus && (
          <button
            type="button"
            className="btn btn-secondary"
            onClick={() => setStatusOpen(true)}
            aria-label="Change status"
            title="Change status"
          >
            <Icon name="refresh" size={14} />
          </button>
        )}
      </div>

      {canDelete && (
        <div
          style={{
            display: "flex",
            gap: 6,
            alignItems: "center",
            justifyContent: "space-between",
            marginTop: 6,
            paddingTop: 6,
            borderTop: "1px dashed var(--line-2)",
          }}
        >
          <span
            className="sub"
            style={{ textTransform: "none", letterSpacing: 0, fontSize: 11, color: "var(--ink-4)" }}
          >
            No sessions yet — case can still be deleted if it was created by mistake.
          </span>
          {confirmDelete ? (
            <span style={{ display: "flex", gap: 4 }}>
              <button
                type="button"
                className="btn btn-ghost"
                style={{ minHeight: 28, padding: "0 8px", fontSize: 11 }}
                onClick={() => setConfirmDelete(false)}
                disabled={pending}
              >
                Cancel
              </button>
              <button
                type="button"
                className="btn btn-danger"
                style={{ minHeight: 28, padding: "0 10px", fontSize: 11 }}
                onClick={onDelete}
                disabled={pending}
              >
                <Icon name="x" size={11} /> {pending ? "Deleting…" : "Confirm delete"}
              </button>
            </span>
          ) : (
            <button
              type="button"
              className="btn btn-ghost"
              style={{ minHeight: 28, padding: "0 8px", fontSize: 11, color: "var(--danger)" }}
              onClick={() => setConfirmDelete(true)}
            >
              <Icon name="x" size={11} /> Delete case
            </button>
          )}
        </div>
      )}

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

      <AddSessionSheet
        open={addOpen}
        onClose={() => setAddOpen(false)}
        soNumber={c.so_number}
        machines={c.machines}
      />
      <StatusMenu
        open={statusOpen}
        onClose={() => setStatusOpen(false)}
        soNumber={c.so_number}
        currentStatus={status}
      />
      <EditCaseSheet
        open={editOpen}
        onClose={() => setEditOpen(false)}
        c={c}
        customers={customers}
        machines={allMachines}
      />
    </>
  );
}
