"use client";

import { useState } from "react";
import { TimerChip } from "./timer-chip";
import { ActiveSessionSheet } from "./active-session-sheet";
import { ClockOutReviewSheet } from "./clock-out-review-sheet";
import type { ActiveSession } from "@/lib/clock/types";

type Props = {
  activeSession: ActiveSession | null;
  variant?: "appbar" | "desktop";
};

export function ClockInWidget({ activeSession, variant = "appbar" }: Props) {
  const [sheetOpen, setSheetOpen] = useState(false);
  const [reviewOpen, setReviewOpen] = useState(false);

  if (!activeSession) return null;

  return (
    <>
      <TimerChip session={activeSession} onClick={() => setSheetOpen(true)} variant={variant} />
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
    </>
  );
}
