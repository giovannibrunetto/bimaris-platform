import "server-only";
import { createHash, createHmac, randomBytes, timingSafeEqual } from "node:crypto";
import { cookies } from "next/headers";

const ADMIN_COOKIE = "bimaris_admin_session";
const SESSION_MAX_AGE = 60 * 60 * 12;
const adminPassword = () => process.env.BIMARIS_ADMIN_PASSWORD ?? "";
const sessionSecret = () => process.env.BIMARIS_ADMIN_SESSION_SECRET ?? "";
const digest = (v: string) => createHash("sha256").update(v).digest("hex");
function equal(a: string, b: string) {
  const left = Buffer.from(a); const right = Buffer.from(b);
  return left.length === right.length && timingSafeEqual(left, right);
}
export function isAdminConfigured() {
  return adminPassword().length >= 12 && sessionSecret().length >= 32;
}
export function isAdminTotpEnabled() { return Boolean(process.env.BIMARIS_ADMIN_TOTP_SECRET); }
export function verifyAdminPassword(candidate: string) {
  return isAdminConfigured() && equal(digest(candidate), digest(adminPassword()));
}
function base32Decode(input: string): Buffer | null {
  const alphabet = "ABCDEFGHIJKLMNOPQRSTUVWXYZ234567";
  const clean = input.toUpperCase().replace(/\s|=/g, "");
  if (!/^[A-Z2-7]+$/.test(clean) || clean.length < 32) return null;
  let bits = 0, value = 0; const bytes: number[] = [];
  for (const char of clean) {
    value = (value << 5) | alphabet.indexOf(char); bits += 5;
    if (bits >= 8) { bytes.push((value >>> (bits -= 8)) & 255); value &= (1 << bits) - 1; }
  }
  return Buffer.from(bytes);
}
export function verifyAdminTotp(candidate: string) {
  const secret = process.env.BIMARIS_ADMIN_TOTP_SECRET;
  if (!secret || !/^\d{6}$/.test(candidate)) return false;
  const key = base32Decode(secret);
  if (!key) return false;
  const counter = Math.floor(Date.now() / 30000);
  for (const offset of [-1, 0, 1]) {
    const buffer = Buffer.alloc(8);
    buffer.writeBigUInt64BE(BigInt(counter + offset));
    const mac = createHmac("sha1", key).update(buffer).digest();
    const index = mac[mac.length - 1] & 15;
    const value = (mac.readUInt32BE(index) & 0x7fffffff) % 1000000;
    if (equal(String(value).padStart(6, "0"), candidate)) return true;
  }
  return false;
}
function signature(payload: string) {
  return createHmac("sha256", sessionSecret()).update(payload).digest("hex");
}
export async function isAdminAuthenticated() {
  if (!isAdminConfigured()) return false;
  const token = (await cookies()).get(ADMIN_COOKIE)?.value ?? "";
  const [expiry, nonce, mac, extra] = token.split(".");
  if (extra !== undefined || !expiry || !nonce || !mac || !/^\d+$/.test(expiry) || !/^[a-f0-9]{32}$/.test(nonce)) return false;
  const expires = Number(expiry);
  if (!Number.isSafeInteger(expires) || expires <= Date.now() || expires > Date.now() + SESSION_MAX_AGE * 1000) return false;
  return equal(mac, signature(expiry + "." + nonce));
}
export async function createAdminSession() {
  if (!isAdminConfigured()) throw new Error("Admin auth not configured");
  const expiry = String(Date.now() + SESSION_MAX_AGE * 1000);
  const nonce = randomBytes(16).toString("hex");
  const payload = expiry + "." + nonce;
  (await cookies()).set(ADMIN_COOKIE, payload + "." + signature(payload), {
    httpOnly: true, secure: process.env.NODE_ENV === "production", sameSite: "strict", path: "/", maxAge: SESSION_MAX_AGE,
  });
}
export async function clearAdminSession() {
  (await cookies()).set(ADMIN_COOKIE, "", {
    httpOnly: true, secure: process.env.NODE_ENV === "production", sameSite: "strict", path: "/", maxAge: 0,
  });
}
