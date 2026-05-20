"use client";

import { useState } from "react";
import { Icon } from "@/components/icons";
import { StatusMenu } from "./status-menu";
import { AddSessionSheet } from "./add-session-sheet";
import type { CaseStatus } from "./actions";

type Props = {
  soNumber: string;
  status: string;
  machines: { machine_no: string; is_primary: boolean }[];
};

export function DetailActions({ soNumber, status, machines }: Props) {
  const [addOpen, setAddOpen] = useState(false);
  const [statusOpen, setStatusOpen] = useState(false);
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
        {canChangeStatus && (
          <button
            type="button"
            className="btn btn-secondary"
            onClick={() => setStatusOpen(true)}
            aria-label="Change status"
          >
            <Icon name="refresh" size={14} />
          </button>
        )}
      </div>
      <AddSessionSheet
        open={addOpen}
        onClose={() => setAddOpen(false)}
        soNumber={soNumber}
        machines={machines}
      />
      <StatusMenu
        open={statusOpen}
        onClose={() => setStatusOpen(false)}
        soNumber={soNumber}
        currentStatus={status as CaseStatus}
      />
    </>
  );
}
