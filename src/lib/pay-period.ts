/**
 * Pay period helper
 * Default pay period: 21st of prev month → 20th of current month
 * Other presets: 1—15, 16—end, 1—20, 21—end, custom
 */

export type PayPeriodPreset = "month" | "h1_1_15" | "h2_16_end" | "h1_1_20" | "h2_21_end" | "custom";

export interface PayPeriod {
  start: string; // ISO date
  end: string;   // ISO date
  label: string;
}

function lastDayOfMonth(year: number, month0: number): number {
  return new Date(year, month0 + 1, 0).getDate();
}

function fmtIso(y: number, m: number, d: number): string {
  return `${y}-${m.toString().padStart(2, "0")}-${d.toString().padStart(2, "0")}`;
}

export function computePayPeriod(
  preset: PayPeriodPreset,
  year: number,
  month: number, // 1-12
  customStart?: string,
  customEnd?: string
): PayPeriod {
  switch (preset) {
    case "month":
      return {
        start: fmtIso(year, month, 1),
        end: fmtIso(year, month, lastDayOfMonth(year, month - 1)),
        label: `${monthName(month)} ${year}`,
      };
    case "h1_1_15":
      return {
        start: fmtIso(year, month, 1),
        end: fmtIso(year, month, 15),
        label: `${monthName(month)} 1-15, ${year}`,
      };
    case "h2_16_end":
      return {
        start: fmtIso(year, month, 16),
        end: fmtIso(year, month, lastDayOfMonth(year, month - 1)),
        label: `${monthName(month)} 16-end, ${year}`,
      };
    case "h1_1_20":
      return {
        start: fmtIso(year, month, 1),
        end: fmtIso(year, month, 20),
        label: `${monthName(month)} 1-20, ${year}`,
      };
    case "h2_21_end":
      return {
        start: fmtIso(year, month, 21),
        end: fmtIso(year, month, lastDayOfMonth(year, month - 1)),
        label: `${monthName(month)} 21-end, ${year}`,
      };
    case "custom":
      return {
        start: customStart || fmtIso(year, month, 1),
        end: customEnd || fmtIso(year, month, lastDayOfMonth(year, month - 1)),
        label: `Custom ${customStart} → ${customEnd}`,
      };
  }
}

function monthName(m: number): string {
  return ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"][m - 1];
}

export function daysInRange(start: string, end: string): string[] {
  const days: string[] = [];
  const d = new Date(start);
  const last = new Date(end);
  while (d <= last) {
    days.push(d.toISOString().slice(0, 10));
    d.setDate(d.getDate() + 1);
  }
  return days;
}

export function isWeekendDate(iso: string): boolean {
  const d = new Date(iso);
  const day = d.getDay();
  return day === 0 || day === 6;
}

export function dayLabel(iso: string): { dow: string; day: number; isWeekend: boolean } {
  const d = new Date(iso);
  const day = d.getDay();
  const dows = ["S", "M", "T", "W", "T", "F", "S"];
  return { dow: dows[day], day: d.getDate(), isWeekend: day === 0 || day === 6 };
}
