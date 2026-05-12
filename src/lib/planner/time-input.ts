/**
 * Parse user time input strings into minutes.
 *
 * Supports:
 *   "1h30"     → 90
 *   "1h"       → 60
 *   "30m"      → 30
 *   "30 min"   → 30
 *   "1:30"     → 90
 *   "1.5h"     → 90
 *   "90"       → 90 (plain number = minutes)
 *   ""         → 0
 */
export function parseTimeInput(raw: string | null | undefined): number {
  if (!raw) return 0;
  const s = raw.trim().toLowerCase().replace(/\s+/g, "");
  if (!s) return 0;

  // 1h30 / 1h
  let m = s.match(/^(\d+)h(\d+)?/);
  if (m) return parseInt(m[1]) * 60 + (m[2] ? parseInt(m[2]) : 0);

  // 1.5h
  m = s.match(/^(\d+\.\d+)h$/);
  if (m) return Math.round(parseFloat(m[1]) * 60);

  // 1:30
  m = s.match(/^(\d+):(\d+)$/);
  if (m) return parseInt(m[1]) * 60 + parseInt(m[2]);

  // 30m / 30min
  m = s.match(/^(\d+)m(in)?/);
  if (m) return parseInt(m[1]);

  // Plain number = minutes
  m = s.match(/^(\d+)$/);
  if (m) return parseInt(m[1]);

  return 0;
}

export function fmtMinutes(n: number | null | undefined): string {
  if (!n) return "0";
  const h = Math.floor(n / 60);
  const m = n % 60;
  if (h && m) return `${h}h${m.toString().padStart(2, "0")}`;
  if (h) return `${h}h`;
  return `${m}m`;
}
