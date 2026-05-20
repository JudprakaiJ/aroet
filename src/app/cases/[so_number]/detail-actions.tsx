"use client";

import { useState } from "react";
import { Icon } from "@/components/icons";
import { StatusMenu } from "./status-menu";
import { AddSessionSheet } from "./add-session-sheet";
import { EditCaseSheet } from "./edit-case-sheet";
import type { CaseStatus } from "./actions";
import type { CaseDetail, LiteCustomer, LiteMachine } from "./queries";

type Props = {
  c: CaseDetail;
  customers: LiteCustomer[];
  allMachines: LiteMachine[];
};

const EDITABLE: CaseStatus[] = ["planned", "in_progress"];

export function DetailActions({ c, customers, allMachines }: Props) {
  const [addOpen, setAddOpen] = useState(false);
  const [statusOpen, setStatusOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);

  const status = c.status as CaseStatus;
  const canEdit = EDITABLE.includes(status);
  const canChangeStatus = status !== "verified" && status !== "canceled";

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
