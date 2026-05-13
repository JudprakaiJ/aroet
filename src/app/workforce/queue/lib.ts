export interface SessionForOverlap {
  id: number;
  engineer_code: string;
  session_date: string;
  travel_minutes: number;
  work_minutes: number;
  office_minutes: number;
}

/**
 * Detect overlapping sessions for same engineer on same date.
 * Returns Set of session IDs where day total exceeds 16h (suspicious).
 */
export function detectOverlaps(sessions: SessionForOverlap[]): Set<number> {
  const overlapping = new Set<number>();
  const grouped = new Map<string, SessionForOverlap[]>();

  sessions.forEach((s) => {
    const key = `${s.engineer_code}-${s.session_date}`;
    if (!grouped.has(key)) grouped.set(key, []);
    grouped.get(key)!.push(s);
  });

  grouped.forEach((group) => {
    if (group.length < 2) return;
    const totals = group.map((s) => ({
      id: s.id,
      total: (s.travel_minutes || 0) + (s.work_minutes || 0) + (s.office_minutes || 0),
    }));
    const dayTotal = totals.reduce((sum, x) => sum + x.total, 0);
    if (dayTotal > 960) {
      totals.forEach((t) => overlapping.add(t.id));
    }
  });

  return overlapping;
}
