/**
 * AROET D365 Title Parser
 *
 * Parses D365 case titles into structured fields.
 * Examples:
 *   "SO2604-05 - ESRY13 - Line#15 - Installation and Training Automapper + SPV-3 - 4553487864 (SQ2604-08)"
 *   "SO2602-19 - Group 1 - ROTH99 - Preventive maintenance 2026 - 4500092637 (SQ2602-04)"
 *   "SO2602-08 - RE72 - ESSA01 - TLS issue - (SQ2602-21 SQ2602-23)"
 *
 * Returns:
 *   { so_number, project_code, machine_code, subject }
 */

export interface ParsedTitle {
  so_number?: string;
  project_code?: string;
  machine_code?: string;
  subject?: string;
}

/** SO number — always at start. Matches SO2604-05 */
const SO_PATTERN = /\bSO\d{4}-\d{1,3}\b/i;

/** Project code — uppercase letters + digits, e.g. ESRY13, ROTH99, ESFOC98 */
const PROJECT_PATTERN = /\b[A-Z]{3,7}\d{2,3}\b/;

/** Machine code patterns (try in order) */
const MACHINE_PATTERNS = [
  /\bRE\d+\b/i, // RE55, RE72
  /\bAR\d+SV\d+\b/i, // AR25SV484
  /\bLine#\d+\b/i, // Line#15
  /\bGroup\s+\d+\b/i, // Group 1
  /\bMCE#\d+\b/i, // MCE#07
  /\b(?:MCVP|SPF|SPV|PE|DLM|TLS)[-#]?\d+(?:-\d+)?\b/i, // MCVP4, SPF-2
];

/** Things to strip from subject */
const PO_PATTERN = /\b(?:4\d{9}|ELN\d{2}-\d{4}-\d+)\b/g; // 10-digit PO or ELN26-0367-0
const SQ_PATTERN = /\(SQ\d{4}-\d{1,3}(?:\s+SQ\d{4}-\d{1,3})*\)/g; // (SQ2604-08) or (SQ2602-21 SQ2602-23)
const CS_PATTERN = /\bCS\d{5,}\b/g; // CS29459

export function parseTitle(input: string): ParsedTitle {
  if (!input || !input.trim()) return {};

  const text = input.trim();
  const result: ParsedTitle = {};

  // 1. Extract SO number
  const soMatch = text.match(SO_PATTERN);
  if (soMatch) result.so_number = soMatch[0].toUpperCase();

  // 2. Extract Machine code (try patterns in order)
  let machineMatch: RegExpMatchArray | null = null;
  for (const p of MACHINE_PATTERNS) {
    machineMatch = text.match(p);
    if (machineMatch) break;
  }
  if (machineMatch) result.machine_code = machineMatch[0];

  // 3. Extract Project code — must NOT collide with SO number
  // Look for all matches, skip if same as SO
  const allProjectMatches = text.match(new RegExp(PROJECT_PATTERN, "g")) ?? [];
  for (const m of allProjectMatches) {
    // Skip if it's actually the SO number's tail (e.g. "SO2604-05" contains "2604")
    if (result.so_number?.includes(m)) continue;
    // Skip if matches machine pattern
    if (result.machine_code === m) continue;
    // Skip common short matches like 2-letter+1-digit
    result.project_code = m;
    break;
  }

  // 4. Build subject = original text minus SO/Project/Machine/PO/SQ/CS/separators
  let subject = text;
  if (result.so_number) {
    subject = subject.replace(new RegExp(result.so_number, "i"), "");
  }
  if (result.project_code) {
    subject = subject.replace(new RegExp(`\\b${escapeRegex(result.project_code)}\\b`), "");
  }
  if (result.machine_code) {
    subject = subject.replace(new RegExp(`\\b${escapeRegex(result.machine_code)}\\b`, "i"), "");
  }
  subject = subject.replace(PO_PATTERN, "");
  subject = subject.replace(SQ_PATTERN, "");
  subject = subject.replace(CS_PATTERN, "");

  // Clean separators: " - ", multiple spaces, trailing dashes, leading/trailing whitespace
  subject = subject
    .replace(/\s*-\s*-\s*/g, " - ") // double dashes
    .replace(/^\s*-\s*/, "") // leading dash
    .replace(/\s*-\s*$/, "") // trailing dash
    .replace(/\s+/g, " ") // multiple spaces
    .replace(/^[\s\-,]+|[\s\-,]+$/g, "") // misc leading/trailing junk
    .trim();

  if (subject.length > 0) result.subject = subject;

  return result;
}

function escapeRegex(s: string): string {
  return s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}
