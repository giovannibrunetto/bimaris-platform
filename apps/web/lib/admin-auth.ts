import "server-only";

import { createHash, timingSafeEqual } from "node:crypto";
import { cookies } from "next/headers";

const ADMIN_COOKIE = "bimaris_admin_session";
const SESSION_MAX_AGE = 60 * 60 * 12;

function adminPassword() {
  return process.env.BIMARIS_ADMIN_PASSWORD ?? "";
}

function digest(value: string) {
  return createHash("sha256").update(value).digest("hex");
}

function safeEqual(left: string, right: string) {
  const a = Buffer.from(left);
  const b = Buffer.from(right);
  return a.length === b.length && timingSafeEqual(a, b);
}

function expectedSessionToken() {
  const password = adminPassword();
  return password ? digest(`bimaris-admin-session:${password}`) : "";
}

export function isAdminConfigured() {
  return adminPassword().length >= 12;
}

export function verifyAdminPassword(candidate: string) {
  const expected = adminPassword();
  if (!expected || expected.length < 12) return false;
  return safeEqual(digest(candidate), digest(expected));
}

export async function isAdminAuthenticated() {
  if (!isAdminConfigured()) return false;
  const store = await cookies();
  const token = store.get(ADMIN_COOKIE)?.value ?? "";
  const expected = expectedSessionToken();
  return Boolean(token && expected && safeEqual(token, expected));
}

export async function createAdminSession() {
  const store = await cookies();
  store.set(ADMIN_COOKIE, expectedSessionToken(), {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "strict",
    path: "/",
    maxAge: SESSION_MAX_AGE,
  });
}

export async function clearAdminSession() {
  const store = await cookies();
  store.set(ADMIN_COOKIE, "", {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "strict",
    path: "/",
    maxAge: 0,
  });
}
