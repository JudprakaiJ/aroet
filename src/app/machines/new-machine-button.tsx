"use client";

import { useState } from "react";
import { Icon } from "@/components/icons";
import { NewMachineSheet } from "./new-machine-sheet";
import type { CustomerLite } from "@/app/customers/queries";

type Props = {
  customers: CustomerLite[];
  defaultCustomerCode?: string;
  label?: string;
};

export function NewMachineButton({ customers, defaultCustomerCode, label = "New machine" }: Props) {
  const [open, setOpen] = useState(false);
  return (
    <>
      <button
        type="button"
        className="btn btn-primary"
        onClick={() => setOpen(true)}
        style={{ display: "inline-flex", alignItems: "center", gap: 6 }}
      >
        <Icon name="plus" size={14} /> {label}
      </button>
      <NewMachineSheet
        open={open}
        onClose={() => setOpen(false)}
        customers={customers}
        defaultCustomerCode={defaultCustomerCode}
      />
    </>
  );
}
