/**
 * Session cookie helpers — edge-compatible.
 *
 * Token shape: `<engineer_code>.<expiry_ms>.<hmac_sha256_hex>`
 * Uses Web Crypto so this lib runs in middleware (edge runtime) too.
 *
 * For node-only paths (server actions), the cookies() helper from
 * next/headers reads/sets the cookie. Middleware uses NextRequest cookies.
 */

const COOKIE_NAME = "aroet_session";
const SESSION_DAYS = 30;

function getSecret(): string {
  if (process.env.SESSION_SECRET) return process.env.SESSION_SECRET;
  // Fall back to a derivative of the service-role key so we don't have
  // yet another env var for local dev. SUPABASE_SERVICE_ROLE_KEY is
  // secret and stable.
  if (process.env.SUPABASE_SERVICE_ROLE_KEY) {
    return "aroet-session-" + process.env.SUPABASE_SERVICE_ROLE_KEY;
  }
  if (process.env.NODE_ENV !== "production") {
    return "aroet-dev-session-secret-not-for-prod";
  }
  throw new Error("SESSION_SECRET (or SUPABASE_SERVICE_ROLE_KEY) required");
}

function toHex(bytes: ArrayBuffer): string {
  return Array.from(new Uint8Array(bytes))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

async function hmacSha256Hex(payload: string): Promise<string> {
  const enc = new TextEncoder();
  const key = await crypto.subtle.importKey(
    "raw",
    enc.encode(getSecret()),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"]
  );
  const sig = await crypto.subtle.sign("HMAC", key, enc.encode(payload));
  return toHex(sig);
}

function constantTimeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let mismatch = 0;
  for (let i = 0; i < a.length; i++) {
    mismatch |= a.charCodeAt(i) ^ b.charCodeAt(i);
  }
  return mismatch === 0;
}

export async function signSessionToken(code: string): Promise<string> {
  const expiry = Date.now() + SESSION_DAYS * 24 * 60 * 60 * 1000;
  const payload = `${code}.${expiry}`;
  const sig = await hmacSha256Hex(payload);
  return `${payload}.${sig}`;
}

export async function verifySessionToken(
  token: string | undefined | null
): Promise<{ code: string; expiry: number } | null> {
  if (!token) return null;
  const parts = token.split(".");
  if (parts.length !== 3) return null;
  const [code, expiryStr, sig] = parts;
  if (!code || !expiryStr || !sig) return null;
  const expected = await hmacSha256Hex(`${code}.${expiryStr}`);
  if (!constantTimeEqual(sig, expected)) return null;
  const expiry = Number(expiryStr);
  if (!Number.isFinite(expiry) || expiry < Date.now()) return null;
  return { code, expiry };
}

export const SESSION_COOKIE_NAME = COOKIE_NAME;
export const SESSION_MAX_AGE_SEC = SESSION_DAYS * 24 * 60 * 60;
