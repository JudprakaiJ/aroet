"use client";

import { useEffect, type ReactNode } from "react";
import { createPortal } from "react-dom";
import { X } from "@/components/icons";

interface SheetProps {
  open: boolean;
  onClose: () => void;
  title?: ReactNode;
  sub?: ReactNode;
  footer?: ReactNode;
  children: ReactNode;
}

export function Sheet({ open, onClose, title, sub, footer, children }: SheetProps) {
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [open, onClose]);

  if (typeof window === "undefined") return null;

  return createPortal(
    <>
      <div
        onClick={onClose}
        aria-hidden
        style={{
          position: "fixed",
          inset: 0,
          background: "rgba(15, 23, 42, 0.45)",
          zIndex: 50,
          opacity: open ? 1 : 0,
          pointerEvents: open ? "auto" : "none",
          transition: "opacity 0.22s",
        }}
      />
      <div
        role="dialog"
        aria-modal="true"
        style={{
          position: "fixed",
          left: 0,
          right: 0,
          bottom: 0,
          zIndex: 51,
          background: "var(--color-surface)",
          borderTopLeftRadius: 22,
          borderTopRightRadius: 22,
          borderTop: "1px solid var(--color-line)",
          transform: open ? "translateY(0)" : "translateY(100%)",
          transition: "transform 0.26s cubic-bezier(.2,.7,.2,1)",
          maxHeight: "92vh",
          display: "flex",
          flexDirection: "column",
          boxShadow: "0 -10px 40px rgba(0,0,0,.18)",
          paddingBottom: "env(safe-area-inset-bottom)",
        }}
      >
        <div className="w-[42px] h-1 rounded-md bg-ink-5 mx-auto mt-2.5 mb-1.5" />
        <div className="px-3.5 pt-1 pb-3 flex justify-between items-center">
          <div className="min-w-0">
            {sub && <div className="ar-kicker">{sub}</div>}
            {title && <h2 className="m-0 text-[17px] font-semibold truncate">{title}</h2>}
          </div>
          <button
            onClick={onClose}
            aria-label="close"
            className="w-9 h-9 inline-flex items-center justify-center rounded-lg text-ink-2 hover:bg-hover"
          >
            <X size={16} />
          </button>
        </div>
        <div className="flex-1 overflow-y-auto min-h-0">{children}</div>
        {footer && (
          <div className="p-3.5 border-t border-line bg-surface">{footer}</div>
        )}
      </div>
    </>,
    document.body
  );
}
