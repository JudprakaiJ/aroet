"use client";

import { useState, useTransition } from "react";
import { Icon } from "@/components/icons";
import { logout, changePin } from "@/app/login/actions";

type Props = {
  code: string;
  fullName: string | null;
  role: string;
};

export function RoleSwitcher({ code, fullName, role }: Props) {
  const [pending, startTransition] = useTransition();
  const [changing, setChanging] = useState(false);
  const [currentPin, setCurrentPin] = useState("");
  const [newPin, setNewPin] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [okMsg, setOkMsg] = useState<string | null>(null);

  const onLogout = () => {
    startTransition(async () => {
      await logout();
    });
  };

  const onChangePin = () => {
    setError(null);
    setOkMsg(null);
    if (!/^\d{4}$/.test(currentPin) || !/^\d{4}$/.test(newPin)) {
      setError("Both PINs must be 4 digits");
      return;
    }
    startTransition(async () => {
      const r = await changePin(currentPin, newPin);
      if (r.success) {
        setOkMsg("PIN changed");
        setChanging(false);
        setCurrentPin("");
        setNewPin("");
      } else {
        setError(r.error ?? "Failed");
      }
    });
  };

  const roleLabel =
    role === "boss" ? "Boss" :
    role === "admin" ? "Admin" :
    role === "tech_manager" ? "Tech Manager" : "Engineer";

  return (
    <div className="card" style={{ padding: 14, display: "flex", flexDirection: "column", gap: 10 }}>
      <div>
        <div className="kicker" style={{ marginBottom: 6 }}>
          Signed in as
        </div>
        <div style={{ fontSize: 14, fontWeight: 700, color: "var(--ink)" }}>
          {fullName ?? code}
        </div>
        <div className="sub" style={{ textTransform: "none", letterSpacing: 0, fontSize: 12, color: "var(--ink-3)" }}>
          <span className="mono">{code}</span>
          <span className="chip chip-red" style={{ marginLeft: 6, fontSize: 9 }}>{roleLabel}</span>
        </div>
      </div>

      <div style={{ borderTop: "1px solid var(--line-2)", paddingTop: 10, display: "flex", flexDirection: "column", gap: 8 }}>
        {!changing ? (
          <>
            <button
              type="button"
              className="btn btn-secondary"
              onClick={() => setChanging(true)}
              disabled={pending}
            >
              <Icon name="wrench" size={12} /> Change PIN
            </button>
            <button
              type="button"
              className="btn btn-ghost"
              style={{ color: "var(--danger)" }}
              onClick={onLogout}
              disabled={pending}
            >
              <Icon name="x" size={12} /> {pending ? "Signing out…" : "Sign out"}
            </button>
          </>
        ) : (
          <>
            <div className="kicker">Change PIN</div>
            <input
              type="password"
              inputMode="numeric"
              maxLength={4}
              className="field mono"
              placeholder="Current PIN"
              value={currentPin}
              onChange={(e) => setCurrentPin(e.target.value.replace(/\D/g, "").slice(0, 4))}
            />
            <input
              type="password"
              inputMode="numeric"
              maxLength={4}
              className="field mono"
              placeholder="New PIN"
              value={newPin}
              onChange={(e) => setNewPin(e.target.value.replace(/\D/g, "").slice(0, 4))}
            />
            {error && (
              <div style={{ color: "var(--danger)", fontSize: 12 }}>
                <Icon name="alert" size={11} /> {error}
              </div>
            )}
            <div style={{ display: "flex", gap: 6 }}>
              <button
                type="button"
                className="btn btn-ghost btn-block"
                onClick={() => {
                  setChanging(false);
                  setCurrentPin("");
                  setNewPin("");
                  setError(null);
                }}
                disabled={pending}
              >
                Cancel
              </button>
              <button
                type="button"
                className="btn btn-primary btn-block"
                onClick={onChangePin}
                disabled={pending}
              >
                {pending ? "Saving…" : "Save"}
              </button>
            </div>
          </>
        )}
        {okMsg && (
          <div
            style={{
              fontSize: 12,
              color: "var(--ok)",
              padding: "6px 10px",
              background: "var(--ok-soft)",
              borderRadius: 6,
            }}
          >
            <Icon name="check" size={11} /> {okMsg}
          </div>
        )}
      </div>
    </div>
  );
}
