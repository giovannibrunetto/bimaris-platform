import "server-only";
import { createHmac } from "node:crypto";
import { createServiceClient } from "@/lib/supabase/server";
import { json, sameOrigin, readLimitedText } from "./security";
import { validateSurvey, PRIVACY_VERSION, CONSENT_VERSION } from "./validation";
import { launchConsent } from "../../app/questionario-cittadini/questions";

// No environment variables are set by this change. Preview can NEVER collect live data.
export function surveyLiveConfigured() {
  const ref = process.env.BIMARIS_SURVEY_LIVE_PROJECT_REF ?? "";
  return process.env.VERCEL_PROJECT_ID === "prj_NsbtPm214NbbweDhUQvPnSaFM1rH"
    && process.env.BIMARIS_SURVEY_PUBLIC_PROJECT_ID === "prj_NsbtPm214NbbweDhUQvPnSaFM1rH"
    && process.env.BIMARIS_SURVEY_PUBLIC_ONLY === "true"
    && process.env.VERCEL_ENV === "production"
    && process.env.BIMARIS_SURVEY_COLLECTION_MODE === "live"
    && /^[a-z]{20}$/.test(ref) && ref !== "nzdeoimwikhoidtladnu"
    && process.env.NEXT_PUBLIC_SUPABASE_URL === `https://${ref}.supabase.co`
    && (process.env.BIMARIS_SURVEY_LIVE_SECRET?.length ?? 0) >= 32;
}
export async function liveCollectionOpen() {
  if (!surveyLiveConfigured()) return false;
  const db = createServiceClient();
  if (!db) return false;
  const { data, error } = await db.rpc("citizen_survey_collection_open", { p_privacy_version: PRIVACY_VERSION });
  return !error && data === true;
}
export async function handleLiveSubmission(request: Request) {
  if (!await liveCollectionOpen()) return json({ error: "raccolta_disattivata" }, 503);
  if (!sameOrigin(request)) return json({ error: "origin" }, 403);
  if (!request.headers.get("content-type")?.startsWith("application/json")) return json({ error: "content_type" }, 415);
  const db = createServiceClient();
  const ip = request.headers.get("x-vercel-forwarded-for")?.split(",")[0].trim();
  if (!db || !ip) return json({ error: "Servizio temporaneamente indisponibile." }, 503);
  const actor = createHmac("sha256", process.env.BIMARIS_SURVEY_LIVE_SECRET!).update(`survey-live:${ip}`).digest("hex");
  const limit = await db.rpc("consume_citizen_survey_live_limit", { p_actor: actor });
  if (limit.error || typeof limit.data !== "boolean") return json({ error: "Servizio temporaneamente indisponibile." }, 503);
  if (!limit.data) return json({ error: "Troppi invii. Riprova più tardi." }, 429);
  const body = await readLimitedText(request, 8192);
  if (body === null) return json({ error: "body_too_large" }, 413);
  let raw: unknown;
  try { raw = JSON.parse(body); } catch { return json({ error: "json" }, 400); }
  const input = validateSurvey(raw, "live");
  if (!input) return json({ error: "Controlla le risposte e l’indirizzo email." }, 400);
  const { data, error } = await db.rpc("submit_citizen_survey", {
    p_request_id: input.requestId, p_q1: input.q1, p_q2: input.q2, p_q3: input.q3, p_q4: input.q4,
    p_idea: input.idea, p_email: input.email, p_consent: input.consent,
    p_privacy_version: PRIVACY_VERSION, p_consent_version: CONSENT_VERSION, p_consent_text: launchConsent,
    p_rehearsal: false,
  });
  if (error || data !== true) return json({ error: "Invio non riuscito. Puoi riprovare senza duplicare le risposte." }, 503);
  return json({ ok: true, mode: "live" });
}
