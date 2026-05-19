export type ActiveSession = {
  id: number;
  so_number: string | null;
  machine_no: string | null;
  engineer_code: string;
  activity_type: string;
  type_code: string;
  clock_in_at: string;
  paused_at: string | null;
  paused_total_minutes: number;
  case_title: string | null;
  customer_name: string | null;
};

export type ClockOutReview = {
  travel_minutes: number;
  break_minutes: number;
  notes?: string;
  submit_immediately?: boolean;
};

const ACTIVITY_TYPE_CODE: Record<string, string> = {
  field: "T",
  travel: "T",
  remote: "WFH",
  office: "OFF",
  training: "T",
  upgrade: "T",
};

export function typeCodeFor(activity: string): string {
  return ACTIVITY_TYPE_CODE[activity] ?? "T";
}

export function computeElapsedMinutes(s: ActiveSession, asOf: Date = new Date()): number {
  const startMs = new Date(s.clock_in_at).getTime();
  const totalMs = asOf.getTime() - startMs;
  let pausedMs = s.paused_total_minutes * 60_000;
  if (s.paused_at) {
    pausedMs += asOf.getTime() - new Date(s.paused_at).getTime();
  }
  return Math.max(0, Math.round((totalMs - pausedMs) / 60_000));
}
