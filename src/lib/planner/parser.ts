/**
 * AROET Planner Note Parser v5 — production
 *
 * Parses planner_note text into:
 *   - Sessions (time tracking)
 *   - References (CS, GI, GT, INV, Quote numbers)
 *   - Admin log entries (invoice sent, RS done, acceptance signed, etc.)
 *
 * Fixes from v4:
 *   A. AR=time-block → office_minutes (computed from time block)
 *   B. (+/-Xh') in travel → ignore (timezone offset)
 *   C. (30 minutes lunch) → still counted as break
 *   D. computed != planner → override planner (use our computed)
 */

// =============================================================================
// TYPES
// =============================================================================
export interface ParsedSession {
  date: string;
  engineer_code: string;
  travel_minutes: number;
  break_minutes: number;
  work_minutes: number;
  office_minutes: number;
  activity_type: "field" | "travel" | "remote" | "training" | "upgrade" | "office";
  work_done: string;
  switched_to_so?: string;
  is_partial_day?: boolean;
  is_weekend: boolean;
  is_holiday: boolean;
  parse_warning?: string;
  raw_line: string;
}

export interface ParsedReference {
  type: "CS" | "GI" | "GT" | "INVOICE" | "QUOTE" | "SHIPMENT" | "OTHER";
  reference_no: string;
  description?: string;
  status?: string;
  recorded_by?: string;
}

export interface ParsedAdminLog {
  event_type:
    | "invoice_sent"
    | "acceptance_signed"
    | "acceptance_pending"
    | "rs_report_done"
    | "service_report_done"
    | "is_done"
    | "post_mail"
    | "case_closed"
    | "waiting_parts"
    | "meeting"
    | "phone_call"
    | "other";
  description: string;
  event_date?: string;
  by_engineer?: string;
}

export interface ParseResult {
  sessions: ParsedSession[];
  references: ParsedReference[];
  admin_log: ParsedAdminLog[];
}

// =============================================================================
// HELPERS
// =============================================================================
const KNOWN_ENGINEERS = new Set([
  "JKH", "PPI", "SPE", "CCH", "LRO",
  "RKO", "TCH", "PSU", "RMA", "IRO", "KBU", "JYE",
  "SSU", "UKA",
]);

function parseTimeAmount(raw: string): number {
  if (!raw) return 0;
  const s = raw.trim().toLowerCase().replace(/\s+/g, "");
  let m = s.match(/^(\d+)h(\d+)/);
  if (m) return parseInt(m[1]) * 60 + parseInt(m[2]);
  m = s.match(/^(\d+)hr?$/);
  if (m) return parseInt(m[1]) * 60;
  m = s.match(/^(\d+)['′m]/);
  if (m) return parseInt(m[1]);
  m = s.match(/^(\d+\.\d+)h/);
  if (m) return Math.round(parseFloat(m[1]) * 60);
  m = s.match(/^(\d+)$/);
  if (m) return parseInt(m[1]);
  return 0;
}

function parseTimeBlock(s: string): { start: number; end: number; duration: number } | null {
  const m = s.match(/(\d{1,2})[:.](\d{2})\s*-\s*(\d{1,2})[:.](\d{2})/);
  if (!m) return null;
  const start = parseInt(m[1]) * 60 + parseInt(m[2]);
  let end = parseInt(m[3]) * 60 + parseInt(m[4]);
  if (end < start) end += 24 * 60;
  return { start, end, duration: end - start };
}

function parseDate(s: string): string | null {
  const m = s.match(/^(\d{1,2})\/(\d{1,2})\/(\d{2,4})$/);
  if (!m) return null;
  const day = parseInt(m[1]);
  const month = parseInt(m[2]);
  let year = parseInt(m[3]);
  if (year < 100) year += 2000;
  if (day < 1 || day > 31 || month < 1 || month > 12) return null;
  return `${year.toString().padStart(4, "0")}-${month.toString().padStart(2, "0")}-${day.toString().padStart(2, "0")}`;
}

function isWeekend(dateStr: string): boolean {
  const d = new Date(dateStr);
  const day = d.getDay();
  return day === 0 || day === 6;
}

// =============================================================================
// FIX B: timezone offset detection
// (+1h30') or (-1h30') in travel = NOT break
// =============================================================================
function isTimezoneOffset(content: string): boolean {
  return /^[+-]/.test(content.trim());
}

// =============================================================================
// FIX C: break detection — recognize "minutes lunch" / "X hr break" etc.
// =============================================================================
function parseBreakContent(content: string): number {
  const trimmed = content.trim();
  if (isTimezoneOffset(trimmed)) return 0;

  // Try simple time amount: "1h00", "30'", "1hr"
  const simple = parseTimeAmount(trimmed);
  if (simple > 0) return simple;

  // Try "30 minutes lunch" / "1 hour break"
  const m = trimmed.match(/(\d+(?:\.\d+)?)\s*(min|minute|hr|hour|h)/i);
  if (m) {
    const num = parseFloat(m[1]);
    const unit = m[2].toLowerCase();
    if (unit.startsWith("h")) return Math.round(num * 60);
    return Math.round(num);
  }

  return 0;
}

// =============================================================================
// Admin notes filter — used to skip admin-style "header" lines
// =============================================================================
const ADMIN_HEADER_PATTERNS = [
  /\bPP[Ii]\b.*\b(sent|check|signed|invoice)/i,
  /\b(sent|sent the) (invoice|acceptance|email|report)/i,
  /\bPost mail\b/i,
  /\bINV\d+-\d+/i,
  /\binvoice (date|due|number|file|sent|received)/i,
  /\backnowledgement|acceptance file/i,
  /\bRS updated\b/i,
  /\bRs report.*Done/i,
  /\bAcceptance signed/i,
  /\bMachine under warranty/i,
  /\bchecked and closed/i,
  /\b(IS|Customer report).*Done/i,
  /\bWaiting sign/i,
];

function isAdminHeaderLine(line: string): boolean {
  // Admin-style header (has date + engineer but no time block + admin keyword)
  if (!/\d{1,2}[:.]\d{2}\s*-\s*\d{1,2}[:.]\d{2}/.test(line)) {
    return ADMIN_HEADER_PATTERNS.some((p) => p.test(line));
  }
  return false;
}

// =============================================================================
// Activity type detection
// =============================================================================
function detectActivityType(
  rest: string,
  workDone: string,
  hasTimeBlocks: boolean,
  workMin: number,
  travelMin: number
): ParsedSession["activity_type"] {
  const combined = (rest + " " + workDone).toLowerCase();

  // Remote support
  if (/\b(remote|screenconnect|online support|teamviewer)\b/.test(combined)) {
    return "remote";
  }

  // Software upgrade (must mention upgrade, not just version number)
  if (/\b(software upgrade|sw upgrade|firmware upgrade|version upgrade)\b/.test(combined)) {
    return "upgrade";
  }

  // Training
  if (/\b(training|train(ed)? customer|trained the user)\b/.test(combined)) {
    return "training";
  }

  // Travel-only day: work=0, mostly travel + content mentions travel
  if (workMin === 0 && travelMin > 0 && /\b(travel|flight|airport|hotel check)/i.test(combined)) {
    return "travel";
  }

  // Office-only (no travel, no work, only office_min)
  if (workMin === 0 && travelMin === 0) {
    return "office";
  }

  return "field";
}

// =============================================================================
// Header detection
// =============================================================================
function tryParseHeader(
  line: string
): { date: string; engineers: string[]; rest: string } | null {
  if (isAdminHeaderLine(line)) return null;

  const dateMatch = line.match(/^(\d{1,2}\/\d{1,2}\/\d{2,4})/);
  if (!dateMatch) return null;

  const date = parseDate(dateMatch[1]);
  if (!date) return null;

  // Reject pre-2024
  if (parseInt(date.substring(0, 4)) < 2024) return null;

  const afterDate = line.substring(dateMatch[0].length).replace(/^[\s:\-]+/, "");

  const engPattern = /\b([A-Z]{3})\b/g;
  const engineers: string[] = [];
  let em;
  while ((em = engPattern.exec(afterDate)) !== null) {
    if (KNOWN_ENGINEERS.has(em[1]) && !engineers.includes(em[1])) {
      engineers.push(em[1]);
    }
  }
  if (engineers.length === 0) return null;

  return { date, engineers, rest: afterDate };
}

// =============================================================================
// SO switch detection
// =============================================================================
function detectSoSwitch(rest: string): { otherSo: string } | null {
  const m = rest.match(/(?:go to|move to|moved to|switched? to)\s+(SO\d{4}-\d+)/i);
  if (!m) return null;
  return { otherSo: m[1].toUpperCase() };
}

// =============================================================================
// FIX A: extract AR= time-block separately from main time blocks
// AR=13:30-17:15(3h45') → office_minutes from this time block
// =============================================================================
function extractArTimeBlock(rest: string): { officeMin: number; consumed: string } | null {
  const m = rest.match(/AR\s*=\s*(\d{1,2}[:.]\d{2}\s*-\s*\d{1,2}[:.]\d{2})\s*(?:\(([^)]+)\))?/i);
  if (!m) return null;
  const block = parseTimeBlock(m[1]);
  if (!block) return null;
  // Office = block duration (the time engineer was in office)
  return {
    officeMin: block.duration,
    consumed: m[0], // the matched portion to strip from rest before main parsing
  };
}

// =============================================================================
// Parse header line to sessions
// =============================================================================
function parseHeaderToSessions(
  header: { date: string; engineers: string[]; rest: string },
  rawLine: string
): ParsedSession[] {
  let rest = header.rest;

  // FIX A: Handle AR=time-block FIRST — extract & strip it before parsing main time blocks
  let arOfficeMin = 0;
  const arBlock = extractArTimeBlock(rest);
  if (arBlock) {
    arOfficeMin = arBlock.officeMin;
    rest = rest.replace(arBlock.consumed, "").trim();
  }

  // Now parse main time totals
  const tMatch = rest.match(/T\s*=\s*(\d+h?\d*['′]?)/i);
  const cMatch = rest.match(/C\s*=\s*(\d+h?\d*['′]?)/i);
  const arDurMatch = rest.match(/AR\s*=\s*(\d+h?\d*['′]?)/i);

  const plannerTravel = tMatch ? parseTimeAmount(tMatch[1]) : 0;
  const plannerWork = cMatch ? parseTimeAmount(cMatch[1]) : 0;
  const plannerOfficeDuration = arDurMatch ? parseTimeAmount(arDurMatch[1]) : 0;

  // Combine AR-from-time-block and AR-as-duration (whichever was found)
  const plannerOffice = arOfficeMin || plannerOfficeDuration;

  // Find time blocks (excluding AR= ones we already extracted)
  const timeBlocks: { start: number; end: number; duration: number }[] = [];
  const breaks: number[] = [];

  // Match each time block and any following parenthesized content
  const timeRegex = /(\d{1,2}[:.]\d{2}\s*-\s*\d{1,2}[:.]\d{2})\s*(\(([^)]+)\))?/g;
  let tmatch;
  while ((tmatch = timeRegex.exec(rest)) !== null) {
    const block = parseTimeBlock(tmatch[1]);
    if (block) timeBlocks.push(block);
    if (tmatch[3]) {
      const breakMin = parseBreakContent(tmatch[3]);
      if (breakMin > 0) breaks.push(breakMin);
    }
  }

  // FIX D (v6): Smart compute — 2 blocks compute, 3+ blocks trust planner
  let computedTravel = 0;
  let computedWork = 0;

  if (timeBlocks.length === 2) {
    // Standard case: out + back → compute
    const first = timeBlocks[0];
    const last = timeBlocks[timeBlocks.length - 1];
    computedTravel = first.duration + last.duration;
    const onSite = last.start - first.end;
    const totalBreak = breaks.reduce((a, b) => a + b, 0);
    computedWork = Math.max(0, onSite - totalBreak);
  } else if (timeBlocks.length === 1) {
    // Single time block = travel-only day
    computedTravel = timeBlocks[0].duration;
  }
  // 3+ blocks: complex schedule (split travel, multiple sites, etc.) — fall through to planner

  // Inline duration for remote/short entries
  let inlineWork = 0;
  if (timeBlocks.length === 0 && computedWork === 0 && plannerWork === 0) {
    const inlineMatch = rest.match(/\b(\d+(?:\.\d+)?)\s*(hr|hour|h|min)s?\b/i);
    if (inlineMatch) inlineWork = parseTimeAmount(inlineMatch[0]);
  }

  const soSwitch = detectSoSwitch(rest);

  // Use computed if 2-block case, otherwise trust planner values
  const travel = timeBlocks.length === 2 ? (computedTravel || plannerTravel) : plannerTravel;
  const work = timeBlocks.length === 2 ? (computedWork || plannerWork || inlineWork) : (plannerWork || inlineWork);
  const totalBreak = breaks.reduce((a, b) => a + b, 0);

  // Warning if 2-block case shows mismatch (planner vs computed)
  let warning: string | undefined;
  if (timeBlocks.length === 2 && computedWork > 0 && plannerWork > 0 && Math.abs(computedWork - plannerWork) > 15) {
    warning = `Planner C=${plannerWork}min, computed ${computedWork}min — using computed`;
  }
  if (timeBlocks.length >= 3 && (plannerTravel === 0 || plannerWork === 0)) {
    warning = `${timeBlocks.length} time blocks but planner T/C incomplete — verify`;
  }

  // Determine if it's a weekend
  const weekend = isWeekend(header.date);

  // Detect holiday from inline keywords: (Bank Holiday), (Holiday), (Public Holiday), (วันหยุด)
  const holidayInline = /\(([^)]*\b(?:bank\s*holiday|public\s*holiday|holiday|วันหยุด)\b[^)]*)\)/i.test(rest);

  // Build one session per engineer
  const sessions: ParsedSession[] = [];
  for (const eng of header.engineers) {
    sessions.push({
      date: header.date,
      engineer_code: eng,
      travel_minutes: travel,
      break_minutes: totalBreak,
      work_minutes: work,
      office_minutes: plannerOffice,
      activity_type: "field", // will be re-classified after work_done is set
      work_done: "",
      switched_to_so: soSwitch?.otherSo,
      is_partial_day: !!soSwitch,
      is_weekend: weekend,
      is_holiday: holidayInline,
      parse_warning: warning,
      raw_line: rawLine,
    });
  }

  return sessions;
}

// =============================================================================
// References extractor (CS, GI, GT, INV, Quote)
// =============================================================================
function extractReferences(text: string): ParsedReference[] {
  const refs: ParsedReference[] = [];
  const seen = new Set<string>();

  // CS numbers: CS12345 or CS123456
  for (const m of text.matchAll(/\bCS(\d{4,6})\b/g)) {
    const ref = `CS${m[1]}`;
    if (!seen.has(ref)) {
      seen.add(ref);
      refs.push({ type: "CS", reference_no: ref });
    }
  }

  // GI numbers: GI-1234-001 or GI1234
  for (const m of text.matchAll(/\bGI-?(\d{4,6}(?:-\d+)?)\b/gi)) {
    const ref = `GI-${m[1]}`;
    if (!seen.has(ref)) {
      seen.add(ref);
      refs.push({ type: "GI", reference_no: ref });
    }
  }

  // GT numbers
  for (const m of text.matchAll(/\bGT-?(\d{4,6}(?:-\d+)?)\b/gi)) {
    const ref = `GT-${m[1]}`;
    if (!seen.has(ref)) {
      seen.add(ref);
      refs.push({ type: "GT", reference_no: ref });
    }
  }

  // Invoice: INV2603-04 or INV260321
  for (const m of text.matchAll(/\bINV(\d{4}-\d+|\d{6,8})\b/g)) {
    const ref = `INV${m[1]}`;
    if (!seen.has(ref)) {
      seen.add(ref);
      refs.push({ type: "INVOICE", reference_no: ref });
    }
  }

  return refs;
}

// =============================================================================
// Admin log extractor
// =============================================================================
function extractAdminLog(text: string): ParsedAdminLog[] {
  const logs: ParsedAdminLog[] = [];
  const lines = text.split("\n");

  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed) continue;

    // Try to extract date and engineer prefix
    const prefixMatch = trimmed.match(/^(\d{1,2}\/\d{1,2}\/\d{2,4})[\s:]*([A-Z]{3}(?:[\s,+]+[A-Z]{3})*)?[\s:]*/);
    let date: string | undefined;
    let engineer: string | undefined;
    let content = trimmed;

    if (prefixMatch) {
      const parsedDate = parseDate(prefixMatch[1]);
      if (parsedDate) date = parsedDate;
      // First engineer code if multiple
      const engMatch = (prefixMatch[2] || "").match(/[A-Z]{3}/);
      if (engMatch && KNOWN_ENGINEERS.has(engMatch[0])) engineer = engMatch[0];
      content = trimmed.substring(prefixMatch[0].length);
    }

    // Skip if no admin keyword
    let eventType: ParsedAdminLog["event_type"] | null = null;

    if (/\bsent (invoice|the invoice)/i.test(content) || /\binvoice sent/i.test(content)) {
      eventType = "invoice_sent";
    } else if (/\b(acceptance signed|customer signed)/i.test(content)) {
      eventType = "acceptance_signed";
    } else if (/\b(acceptance|waiting sign|have to send.*sign|sent to sign)/i.test(content)) {
      eventType = "acceptance_pending";
    } else if (/\bRS Report\b.*\b(Done|done|sent)/i.test(content) || /\bRs report.*Done/i.test(content)) {
      eventType = "rs_report_done";
    } else if (/\b(Service Report|Customer report)\b.*\b(Done|done|sent)/i.test(content)) {
      eventType = "service_report_done";
    } else if (/\bIntervention sheet\b.*\b(Done|done)/i.test(content) || /^IS\b.*\b(Done|done)/i.test(content)) {
      eventType = "is_done";
    } else if (/\bPost mail\b/i.test(content)) {
      eventType = "post_mail";
    } else if (/\bchecked and closed\b/i.test(content)) {
      eventType = "case_closed";
    } else if (/\bWaiting\b.*\b(parts|RMA|delivery|sign)/i.test(content)) {
      eventType = "waiting_parts";
    } else if (/\bMeeting\b/i.test(content)) {
      eventType = "meeting";
    }

    if (eventType) {
      logs.push({
        event_type: eventType,
        description: content.replace(/^[\s:]+/, "").substring(0, 500),
        event_date: date,
        by_engineer: engineer,
      });
    }
  }

  return logs;
}

// =============================================================================
// MAIN
// =============================================================================
export function parsePlannerNote(text: string): ParseResult {
  if (!text || text.trim().length === 0) {
    return { sessions: [], references: [], admin_log: [] };
  }

  const lines = text.split("\n").map((l) => l.trimEnd());

  const sessions: ParsedSession[] = [];
  let currentGroup: ParsedSession[] = [];
  let workBuffer: string[] = [];

  function commit() {
    if (currentGroup.length > 0) {
      const work = workBuffer
        .join("\n")
        .trim()
        // Strip separator lines (===, ---)
        .replace(/^[=\-]{3,}$/gm, "")
        .trim();

      // Re-classify activity type now that we have work_done
      for (const s of currentGroup) {
        s.work_done = work;
        s.activity_type = detectActivityType(
          s.raw_line,
          work,
          s.travel_minutes > 0 || s.work_minutes > 0,
          s.work_minutes,
          s.travel_minutes
        );
      }
      sessions.push(...currentGroup);
    }
    currentGroup = [];
    workBuffer = [];
  }

  for (const line of lines) {
    if (!line.trim()) {
      if (currentGroup.length) workBuffer.push("");
      continue;
    }
    // Skip separator lines
    if (/^[=\-]{3,}$/.test(line.trim())) continue;

    const header = tryParseHeader(line);
    if (header) {
      commit();
      currentGroup = parseHeaderToSessions(header, line);
    } else if (currentGroup.length) {
      if (!isAdminHeaderLine(line)) workBuffer.push(line);
    }
  }
  commit();

  // Filter ghost sessions (all zero)
  const filteredSessions = sessions.filter(
    (s) => s.travel_minutes > 0 || s.work_minutes > 0 || s.office_minutes > 0
  );

  const references = extractReferences(text);
  const admin_log = extractAdminLog(text);

  return { sessions: filteredSessions, references, admin_log };
}

// =============================================================================
// FORMATTING HELPERS (exported for UI)
// =============================================================================
export function fmtMinutes(n: number | null | undefined): string {
  if (!n) return "0";
  const h = Math.floor(n / 60);
  const m = n % 60;
  if (h && m) return `${h}h${m.toString().padStart(2, "0")}`;
  if (h) return `${h}h`;
  return `${m}m`;
}
