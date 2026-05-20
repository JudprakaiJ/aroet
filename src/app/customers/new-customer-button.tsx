"use client";

import { useState } from "react";
import { Icon } from "@/components/icons";
import { NewCustomerSheet } from "./new-customer-sheet";

export function NewCustomerButton() {
  const [open, setOpen] = useState(false);
  return (
    <>
      <button
        type="button"
        className="btn btn-primary"
        onClick={() => setOpen(true)}
        style={{ display: "inline-flex", alignItems: "center", gap: 6 }}
      >
        <Icon name="plus" size={14} /> New customer
      </button>
      <NewCustomerSheet open={open} onClose={() => setOpen(false)} />
    </>
  );
}
