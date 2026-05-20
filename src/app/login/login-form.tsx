"use client";

import { useEffect, useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Icon } from "@/components/icons";
import { Avatar } from "@/components/primitives/avatar";
import {
  loginWithPin,
  setPinAndLogin,
  type LoginEngineer,
} from "./actions";

type Step = "pick" | "enter-pin" | "set-pin" | "confirm-pin";

const ADMIN_ROLES = new Set(["admin", "boss"]);

export function LoginForm({ engineers }: { engineers: LoginEngineer[] }) {
  const router = useRouter();
  const [step, setStep] = useState<Step>("pick");
  const [pickedCode, setPickedCode] = useState<string | null>(null);
  const [pin, setPin] = useState("");
  const [pin2, setPin2] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [pending, startTransition] = useTransition();

  const picked = pickedCode ? engineers.find((e) => e.code === pickedCode) ?? null : null;

  const sortedEngineers = useMemo(() => {
    const adminsFirst = [...engineers].sort((a, b) => {
      const ar = ADMIN_ROLES.has(a.role ?? "") ? 0 : 1;
      const br = ADMIN_ROLES.has(b.role ?? "") ? 0 : 1;
      if (ar !== br) return ar - br;
      return a.code.localeCompare(b.code);
    });
    if (!search.trim()) return adminsFirst;
    const q = search.trim().toUpperCase();
    return adminsFirst.filter(
      (e) =>
        e.code.toUpperCase().includes(q) ||
        (e.full_name ?? "").toUpperCase().includes(q)
    );
  }, [engineers, search]);

  useEffect(() => {
    if (step === "pick") {
      setPin("");
      setPin2("");
      setError(null);
    }
  }, [step]);

  const choose = (code: string) => {
    const eng = engineers.find((e) => e.code === code);
    if (!eng) return;
    setPickedCode(code);
    setPin("");
    setPin2("");
    setError(null);
    setStep(eng.has_pin ? "enter-pin" : "set-pin");
  };

  const back = () => {
    setStep("pick");
    setPickedCode(null);
  };

  const pressDigit = (d: string) => {
    setError(null);
    if (step === "enter-pin" || step === "set-pin") {
      if (pin.length >= 4) return;
      const next = pin + d;
      setPin(next);
      if (next.length === 4) {
        if (step === "enter-pin") {
          submitLogin(next);
        } else {
          setStep("confirm-pin");
        }
      }
    } else if (step === "confirm-pin") {
      if (pin2.length >= 4) return;
      const next = pin2 + d;
      setPin2(next);
      if (next.length === 4) submitNewPin(pin, next);
    }
  };

  const pressBack = () => {
    setError(null);
    if (step === "confirm-pin") {
      if (pin2.length > 0) setPin2((p) => p.slice(0, -1));
      else {
        setPin("");
        setStep("set-pin");
      }
      return;
    }
    if (pin.length > 0) setPin((p) => p.slice(0, -1));
  };

  const submitLogin = (value: string) => {
    if (!picked) return;
    startTransition(async () => {
      const r = await loginWithPin(picked.code, value);
      if (r.success) {
        router.push("/");
        router.refresh();
      } else {
        setError(r.error ?? "Login failed");
        setPin("");
      }
    });
  };

  const submitNewPin = (a: string, b: string) => {
    if (!picked) return;
    if (a !== b) {
      setError("PINs don't match. Try again.");
      setPin("");
      setPin2("");
      setStep("set-pin");
      return;
    }
    startTransition(async () => {
      const r = await setPinAndLogin(picked.code, a);
      if (r.success) {
        router.push("/");
        router.refresh();
      } else {
        setError(r.error ?? "Setup failed");
        setPin("");
        setPin2("");
        setStep("set-pin");
      }
    });
  };

  return (
    <div
      className="card"
      style={{
        width: "100%",
        maxWidth: 380,
        padding: 22,
        borderColor: "var(--red-line)",
        boxShadow: "0 8px 32px rgba(0,0,0,.08)",
      }}
    >
      <div style={{ textAlign: "center", marginBottom: 18 }}>
        <div
          style={{
            display: "inline-flex",
            alignItems: "center",
            justifyContent: "center",
            width: 56,
            height: 56,
            borderRadius: 14,
            background: "var(--red)",
            color: "#fff",
            fontWeight: 700,
            fontSize: 18,
            marginBottom: 10,
          }}
        >
          AR
        </div>
        <div style={{ fontSize: 18, fontWeight: 700, color: "var(--ink)" }}>AROET</div>
        <div className="sub" style={{ textTransform: "none", letterSpacing: 0, fontSize: 12, color: "var(--ink-3)" }}>
          {step === "pick"
            ? "Pick your name"
            : step === "enter-pin"
              ? `Enter PIN for ${picked?.code}`
              : step === "set-pin"
                ? `Set new PIN for ${picked?.code}`
                : "Confirm PIN"}
        </div>
      </div>

      {step === "pick" && (
        <>
          <div style={{ position: "relative", marginBottom: 10 }}>
            <span
              style={{
                position: "absolute",
                left: 10,
                top: "50%",
                transform: "translateY(-50%)",
                color: "var(--ink-4)",
                display: "inline-flex",
              }}
            >
              <Icon name="search" size={14} />
            </span>
            <input
              type="search"
              className="field"
              placeholder="Search code or name…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              style={{ paddingLeft: 32 }}
              autoFocus
            />
          </div>
          <div style={{ maxHeight: 360, overflow: "auto", display: "flex", flexDirection: "column", gap: 4 }}>
            {sortedEngineers.length === 0 ? (
              <div className="sub" style={{ textAlign: "center", padding: 18, fontSize: 12 }}>
                No engineers match.
              </div>
            ) : (
              sortedEngineers.map((e) => {
                const isAdmin = ADMIN_ROLES.has(e.role ?? "");
                return (
                  <button
                    key={e.code}
                    type="button"
                    onClick={() => choose(e.code)}
                    className="card-flat row-link"
                    style={{
                      padding: 10,
                      display: "flex",
                      alignItems: "center",
                      gap: 10,
                      cursor: "pointer",
                      textAlign: "left",
                      width: "100%",
                    }}
                  >
                    <Avatar code={e.code} />
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: 13, fontWeight: 600, color: "var(--ink)" }}>
                        {e.full_name ?? e.code}
                      </div>
                      <div className="sub" style={{ textTransform: "none", letterSpacing: 0, fontSize: 11, color: "var(--ink-3)" }}>
                        <span className="mono">{e.code}</span>
                        {isAdmin && <span className="chip chip-red" style={{ marginLeft: 6, fontSize: 9 }}>Admin</span>}
                        {!e.has_pin && (
                          <span className="chip" style={{ marginLeft: 6, fontSize: 9 }}>First time</span>
                        )}
                      </div>
                    </div>
                    <Icon name="chevron" size={14} />
                  </button>
                );
              })
            )}
          </div>
        </>
      )}

      {(step === "enter-pin" || step === "set-pin" || step === "confirm-pin") && (
        <>
          <div style={{ display: "flex", justifyContent: "center", gap: 12, margin: "14px 0 18px" }}>
            {Array.from({ length: 4 }).map((_, i) => {
              const value = step === "confirm-pin" ? pin2 : pin;
              const filled = i < value.length;
              return (
                <span
                  key={i}
                  style={{
                    width: 16,
                    height: 16,
                    borderRadius: 8,
                    background: filled ? "var(--red)" : "var(--surface-2)",
                    border: "1px solid var(--line)",
                    transition: "background .12s",
                  }}
                />
              );
            })}
          </div>

          {step === "set-pin" && (
            <div
              className="sub"
              style={{
                textAlign: "center",
                textTransform: "none",
                letterSpacing: 0,
                fontSize: 11.5,
                color: "var(--ink-3)",
                marginBottom: 8,
              }}
            >
              First time signing in — pick any 4-digit PIN. You&apos;ll confirm it next.
            </div>
          )}

          {error && (
            <div
              style={{
                padding: "8px 10px",
                background: "var(--danger-soft)",
                color: "var(--danger)",
                borderRadius: 8,
                fontSize: 12,
                textAlign: "center",
                marginBottom: 10,
              }}
            >
              <Icon name="alert" size={11} /> {error}
            </div>
          )}

          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(3, 1fr)",
              gap: 8,
            }}
          >
            {["1", "2", "3", "4", "5", "6", "7", "8", "9"].map((d) => (
              <PinKey key={d} label={d} onClick={() => pressDigit(d)} disabled={pending} />
            ))}
            <PinKey label="Back" onClick={back} disabled={pending} muted />
            <PinKey label="0" onClick={() => pressDigit("0")} disabled={pending} />
            <PinKey label="⌫" onClick={pressBack} disabled={pending} muted />
          </div>
        </>
      )}
    </div>
  );
}

function PinKey({
  label,
  onClick,
  disabled,
  muted,
}: {
  label: string;
  onClick: () => void;
  disabled?: boolean;
  muted?: boolean;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      style={{
        height: 52,
        borderRadius: 12,
        background: muted ? "var(--surface-2)" : "var(--surface)",
        border: "1px solid var(--line-2)",
        color: muted ? "var(--ink-3)" : "var(--ink)",
        fontSize: muted ? 13 : 20,
        fontWeight: 600,
        cursor: disabled ? "not-allowed" : "pointer",
        fontFamily: "var(--mono)",
        transition: "background .1s",
      }}
    >
      {label}
    </button>
  );
}
