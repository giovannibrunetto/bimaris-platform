import { createServiceClient } from "@/lib/supabase/server";
import { surveyConfigured, surveyTestSession, sameOrigin, json, surveyLimit, readLimitedText } from "@/lib/survey/security";
import { validateSurvey, PRIVACY_VERSION, CONSENT_VERSION } from "@/lib/survey/validation";
import { launchConsent } from "../questions";
import { surveyLiveConfigured, handleLiveSubmission } from "@/lib/survey/live";
export const runtime = "nodejs";
export async function POST(request: Request) {
  if (surveyLiveConfigured()) return handleLiveSubmission(request);
  if (!surveyConfigured()) return json({ error: "not_found" }, 404);
  if (!sameOrigin(request)) return json({ error: "origin" }, 403);
  if (!await surveyTestSession()) return json({ error: "collaudo_non_autorizzato" }, 403);
  if (!request.headers.get("content-type")?.startsWith("application/json")) return json({ error: "content_type" }, 415);
  const limit = await surveyLimit(request, "submit");
  if (limit !== "allow") return json({ error: limit === "limited" ? "Troppi invii di prova. Riprova più tardi." : "Servizio temporaneamente indisponibile." }, limit === "limited" ? 429 : 503);
  const body = await readLimitedText(request, 8192);
  if (body === null) return json({ error: "body_too_large" }, 413);
  let raw: unknown;
  try { raw = JSON.parse(body); } catch { return json({ error: "json" }, 400); }
  const input = validateSurvey(raw);
  if (!input) return json({ error: "Dati di prova non validi. Usa solo testo con prefisso COLLAUDO: ed email @example.invalid." }, 400);
  const db = createServiceClient();
  if (!db) return json({ error: "Servizio temporaneamente indisponibile." }, 503);
  const { data, error } = await db.rpc("submit_citizen_survey", {
    p_request_id: input.requestId, p_q1: input.q1, p_q2: input.q2, p_q3: input.q3, p_q4: input.q4,
    p_idea: input.idea, p_email: input.email, p_consent: input.consent,
    p_privacy_version: PRIVACY_VERSION, p_consent_version: CONSENT_VERSION, p_consent_text: launchConsent,
    p_rehearsal: true,
  });
  // Never log the submitted payload or database diagnostics containing personal data.
  if (error || data !== true) return json({ error: "Invio non riuscito. Puoi riprovare senza duplicare le risposte." }, 503);
  return json({ ok: true, mode: "test" });
}
