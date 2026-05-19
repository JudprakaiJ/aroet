"use client";

import type { ReactNode } from "react";
import { Icon } from "@/components/icons";

type Props = {
  open: boolean;
  onClose: () => void;
  title: string;
  sub?: string;
  footer?: ReactNode;
  children?: ReactNode;
};

export function Sheet({ open, onClose, title, sub, footer, children }: Props) {
  return (
    <>
      <div className="sheet-backdrop" data-open={open} onClick={onClose} />
      <div className="sheet" data-open={open}>
        <div className="sheet-handle" />
        <div className="sheet-title">
          <div>
            {sub && <div className="sub">{sub}</div>}
            <h2>{title}</h2>
          </div>
          <button
            type="button"
            className="iconbtn tap"
            onClick={onClose}
            aria-label="close"
            style={{ width: 36, height: 36, minWidth: 36, minHeight: 36 }}
          >
            <Icon name="x" size={16} />
          </button>
        </div>
        <div style={{ flex: 1, overflowY: "auto", minHeight: 0 }}>{children}</div>
        {footer && (
          <div style={{ padding: 14, borderTop: "1px solid var(--line)", background: "var(--surface)" }}>
            {footer}
          </div>
        )}
      </div>
    </>
  );
}
