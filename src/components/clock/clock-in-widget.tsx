"use client";

import { useState } from "react";
import { TimerChip } from "./timer-chip";
import { ActiveSessionSheet } from "./active-session-sheet";
import { ClockOutReviewSheet } from "./clock-out-review-sheet";
import { EmergencySwitchSheet } from "./emergency-switch-sheet";
import type { ActiveSession } from "@/lib/clock/types";

type Props = {
  activeSession: ActiveSession | null;
  variant?: "appbar" | "desktop";
};

export function ClockInWidget({ activeSession, variant = "appbar" }: Props) {
  const [sheetOpen, setSheetOpen] = useState(false);
  const [reviewOpen, setReviewOpen] = useState(false);
  const [emergencyOpen, setEmergencyOpen] = useState(false);

  if (!activeSession) return null;

  return (
    <>
      <TimerChip
        session={activeSession}
        onClick={() => setSheetOpen(true)}
        onLongPress={() => setEmergencyOpen(true)}
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
        onRequestEmergency={() => {
          setSheetOpen(false);
          setEmergencyOpen(true);
        }}
      />
      <ClockOutReviewSheet
        open={reviewOpen}
        onClose={() => setReviewOpen(false)}
        session={activeSession}
      />
      <EmergencySwitchSheet
        open={emergencyOpen}
        onClose={() => setEmergencyOpen(false)}
        sessionId={activeSession.id}
        currentSoNumber={activeSession.so_number}
        currentActivity={activeSession.activity_type}
      />
    </>
  );
}
