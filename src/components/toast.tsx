"use client";

import { createContext, useCallback, useContext, useEffect, useRef, useState, type ReactNode } from "react";
import { createPortal } from "react-dom";

interface ToastCtx {
  show: (message: string, durationMs?: number) => void;
}

const Ctx = createContext<ToastCtx | null>(null);

export function ToastProvider({ children }: { children: ReactNode }) {
  const [msg, setMsg] = useState<string | null>(null);
  const [mounted, setMounted] = useState(false);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    setMounted(true);
  }, []);

  const show = useCallback((message: string, durationMs = 2400) => {
    setMsg(message);
    if (timer.current) clearTimeout(timer.current);
    timer.current = setTimeout(() => setMsg(null), durationMs);
  }, []);

  return (
    <Ctx.Provider value={{ show }}>
      {children}
      {mounted &&
        createPortal(
          <div
            role="status"
            aria-live="polite"
            style={{
              position: "fixed",
              left: 14,
              right: 14,
              bottom: "calc(96px + env(safe-area-inset-bottom))",
              zIndex: 60,
              background: "var(--color-ink)",
              color: "#fff",
              padding: "12px 14px",
              borderRadius: 12,
              display: msg ? "flex" : "none",
              alignItems: "center",
              gap: 10,
              boxShadow: "0 8px 24px rgba(0,0,0,0.25)",
              fontSize: 13,
              fontWeight: 500,
              maxWidth: 480,
              margin: "0 auto",
            }}
          >
            {msg}
          </div>,
          document.body
        )}
    </Ctx.Provider>
  );
}

export function useToast() {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error("useToast must be used inside ToastProvider");
  return ctx;
}
