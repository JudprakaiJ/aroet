"use client";

import { useState } from "react";
import { TimerChip } from "./timer-chip";
import { ActiveSessionSheet } from "./active-session-sheet";
import { ClockOutReviewSheet } from "./clock-out-review-sheet";
import { WhatsNextSheet } from "./whats-next-sheet";
import type { ActiveSession } from "@/lib/clock/types";

type Props = {
  activeSession: ActiveSession | null;
  variant?: "appbar" | "desktop";
};

export function ClockInWidget({ activeSession, variant = "appbar" }: Props) {
  const [sheetOpen, setSheetOpen] = useState(false);
  const [reviewOpen, setReviewOpen] = useState(false);
  const [whatsNextOpen, setWhatsNextOpen] = useState(false);

  if (!activeSession) return null;

  const paused = Boolean(activeSession.paused_at);

  return (
    <>
      <TimerChip
        session={activeSession}
        onClick={() => setSheetOpen(true)}
        onLongPress={() => setWhatsNextOpen(true)}
        variant={variant}
      />
      <ActiveSessionSheet
        open={sheetOpen}
        onClose={() => setSheetOpen(false)}
        session={activeSession}
        onRequestClockOut={() => {
          setSheetOpen(false);
          setReviewOpen(true);
        }}
      />
      <ClockOutReviewSheet
        open={reviewOpen}
        onClose={() => setReviewOpen(false)}
        session={activeSession}
      />
      <WhatsNextSheet
        open={whatsNextOpen}
        onClose={() => setWhatsNextOpen(false)}
        hasActive
        paused={paused}
      />
    </>
  );
}
