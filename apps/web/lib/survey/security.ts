import "server-only";
import { createHash, createHmac, randomUUID, timingSafeEqual } from "node:crypto";
import { cookies } from "next/headers";
import { createServiceClient } from "@/lib/supabase/server";
export const TEST_COOKIE = "bimaris_survey_test";
export const TEST_SECONDS = 1800;
const secret = () => process.env.BIMARIS_SURVEY_TEST_SECRET ?? "";
export function surveyConfigured() {
  return (process.env.VERCEL_ENV === "preview" || process.env.NODE_ENV === "development")
    && process.env.NEXT_PUBLIC_SUPABASE_URL === "https://nzdeoimwikhoidtladnu.supabase.co"
    && secret().length >= 32;
}
export function equalSecret(candidate: string) {
  return surveyConfigured() && timingSafeEqual(createHash("sha256").update(candidate).digest(), createHash("sha256").update(secret()).digest());
}
const sign = (payload: string) => createHmac("sha256", secret()).update(payload).digest("hex");
export function createTestToken() { const p = `${Date.now() + TEST_SECONDS * 1000}.${randomUUID()}`; return `${p}.${sign(p)}`; }
export function validTestToken(value: string) {
  if (!surveyConfigured()) return false;
  const [expiry, nonce, mac, extra] = value.split(".");
  if (extra || !/^\d{13}$/.test(expiry ?? "") || !/^[a-f0-9-]{36}$/.test(nonce ?? "") || !/^[a-f0-9]{64}$/.test(mac ?? "")) return false;
  const expires = Number(expiry);
  return expires > Date.now() && expires <= Date.now() + TEST_SECONDS * 1000 && timingSafeEqual(Buffer.from(mac), Buffer.from(sign(`${expiry}.${nonce}`)));
}
export async function surveyTestSession() { return validTestToken((await cookies()).get(TEST_COOKIE)?.value ?? ""); }
export function sameOrigin(request: Request) {
  return request.headers.get("origin") === new URL(request.url).origin
    && !["cross-site", "none"].includes(request.headers.get("sec-fetch-site") ?? "");
}
export function json(data: unknown, status = 200) {
  return Response.json(data, { status, headers: { "Cache-Control": "no-store", "X-Robots-Tag": "noindex, nofollow, noarchive" } });
}
export async function surveyLimit(request: Request, scope: "unlock" | "submit") {
  const db = createServiceClient();
  const ip = (request.headers.get("x-vercel-forwarded-for") ?? (process.env.NODE_ENV === "development" ? "127.0.0.1" : null))?.split(",")[0].trim();
  if (!db || !ip || !surveyConfigured()) return "unavailable";
  const actor = createHmac("sha256", secret()).update(`survey:${ip}`).digest("hex");
  const { data, error } = await db.rpc("consume_citizen_survey_limit", { p_scope: scope, p_actor: actor });
  if (error || typeof data !== "boolean") return "unavailable";
  return data ? "allow" : "limited";
}

export async function readLimitedText(request: Request, maximum: number): Promise<string | null> {
  if (Number(request.headers.get("content-length") ?? 0) > maximum) return null;
  const reader = request.body?.getReader();
  if (!reader) return "";
  const chunks: Uint8Array[] = []; let length = 0;
  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) return Buffer.concat(chunks).toString("utf8");
      length += value.byteLength;
      if (length > maximum) { await reader.cancel(); return null; }
      chunks.push(value);
    }
  } catch { return null; }
}
