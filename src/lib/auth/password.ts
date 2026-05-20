import "server-only";
import { scrypt, randomBytes, timingSafeEqual } from "node:crypto";
import { promisify } from "node:util";

const scryptAsync = promisify(scrypt) as (
  password: string,
  salt: string,
  keylen: number
) => Promise<Buffer>;

const KEYLEN = 64;
const SALT_BYTES = 16;

/** Hash a PIN with random salt. Returns "<salt_hex>:<hash_hex>". */
export async function hashPin(pin: string): Promise<string> {
  const salt = randomBytes(SALT_BYTES).toString("hex");
  const hash = await scryptAsync(pin, salt, KEYLEN);
  return `${salt}:${hash.toString("hex")}`;
}

/** Constant-time compare of provided PIN against stored hash. */
export async function verifyPin(pin: string, stored: string): Promise<boolean> {
  const parts = stored.split(":");
  if (parts.length !== 2) return false;
  const [salt, hashHex] = parts;
  if (!salt || !hashHex) return false;
  const expected = Buffer.from(hashHex, "hex");
  const test = await scryptAsync(pin, salt, KEYLEN);
  if (expected.length !== test.length) return false;
  return timingSafeEqual(expected, test);
}
