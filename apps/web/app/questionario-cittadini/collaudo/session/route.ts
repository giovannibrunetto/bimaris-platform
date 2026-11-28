import { cookies } from "next/headers";
import { isAuthorizedAdmin } from "@/lib/admin-access";
import { createTestToken, equalSecret, json, sameOrigin, surveyConfigured, surveyLimit, TEST_COOKIE, TEST_SECONDS, readLimitedText } from "@/lib/survey/security";
export const runtime = "nodejs";
export async function POST(request: Request) {
  if (!surveyConfigured()) return json({ error: "not_found" }, 404);
  if (!sameOrigin(request)) return json({ error: "origin" }, 403);
  const limit = await surveyLimit(request, "unlock");
  if (limit !== "allow") return json({ error: "Accesso temporaneamente non disponibile." }, limit === "limited" ? 429 : 503);
  if (!request.headers.get("content-type")?.startsWith("application/x-www-form-urlencoded")) return json({ error: "content_type" }, 415);
  const raw = await readLimitedText(request, 1024);
  if (raw === null) return json({ error: "body" }, 413);
  const fields = new URLSearchParams(raw);
  const adminUnlock = fields.get("mode") === "admin";
  if (adminUnlock) {
    if (!await isAuthorizedAdmin()) return json({ error: "Accesso Super Admin con MFA necessario." }, 403);
  } else {
    const code = fields.get("code") ?? "";
    if (!equalSecret(code)) return json({ error: "Codice non valido." }, 403);
  }
  (await cookies()).set(TEST_COOKIE, createTestToken(), { httpOnly: true, secure: process.env.NODE_ENV === "production", sameSite: "strict", path: "/questionario-cittadini", maxAge: TEST_SECONDS });
  return Response.redirect(new URL("/questionario-cittadini", request.url), 303);
}
export async function DELETE(request: Request) {
  if (!surveyConfigured()) return json({ error: "not_found" }, 404);
  if (!sameOrigin(request)) return json({ error: "origin" }, 403);
  (await cookies()).set(TEST_COOKIE, "", { path: "/questionario-cittadini", maxAge: 0 });
  return json({ ok: true });
}
