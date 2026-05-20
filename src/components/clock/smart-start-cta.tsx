"use client";

import { useState } from "react";
import { Icon } from "@/components/icons";
import { WhatsNextSheet } from "./whats-next-sheet";

type Props = {
  engineerCode: string;
};

export function SmartStartCTA({ engineerCode }: Props) {
  const [open, setOpen] = useState(false);

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="card"
        style={{
          padding: 16,
          display: "flex",
          gap: 12,
          alignItems: "center",
          background: "linear-gradient(180deg, var(--red-50), var(--surface))",
          borderColor: "var(--red-line)",
          width: "100%",
          textAlign: "left",
          cursor: "pointer",
        }}
      >
        <div
          style={{
            width: 44,
            height: 44,
            borderRadius: 12,
            background: "var(--red)",
            color: "#fff",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            flex: "none",
          }}
        >
          <Icon name="play" size={20} />
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: 14, fontWeight: 600, color: "var(--ink)" }}>
            Ready when you are, {engineerCode}
          </div>
          <div
            className="sub"
            style={{
              textTransform: "none",
              letterSpacing: 0,
              fontSize: 12,
              color: "var(--ink-3)",
              marginTop: 2,
            }}
          >
            Tap to clock in — case, travel, or office
          </div>
        </div>
        <span className="dt-pill primary" style={{ flex: "none" }}>
          What&apos;s next? <Icon name="chevron" size={12} />
        </span>
      </button>

      <WhatsNextSheet
        open={open}
        onClose={() => setOpen(false)}
        hasActive={false}
        paused={false}
      />
    </>
  );
}
