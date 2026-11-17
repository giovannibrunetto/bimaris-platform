import { questions } from "../../app/questionario-cittadini/questions";

export const PRIVACY_VERSION = "2026-11-17-v2";
export const CONSENT_VERSION = "launch-only-v1";
export type SurveyInput = { requestId: string; answers: string[][]; idea: string; consent: string; email: string; website: string };
export function validateSurvey(value: unknown) {
  if (!value || typeof value !== "object" || Array.isArray(value)) return null;
  const v = value as Record<string, unknown>;
  const keys = ["requestId", "answers", "idea", "consent", "email", "website"];
  if (Object.keys(v).some(key => !keys.includes(key)) || keys.some(key => !(key in v))) return null;
  if (typeof v.requestId !== "string" || !/^[a-f0-9]{8}-[a-f0-9]{4}-4[a-f0-9]{3}-[89ab][a-f0-9]{3}-[a-f0-9]{12}$/i.test(v.requestId)) return null;
  if (!Array.isArray(v.answers) || v.answers.length !== 5) return null;
  const encoded: number[][] = [];
  for (let i = 0; i < 5; i++) {
    const a = v.answers[i];
    if (!Array.isArray(a) || a.some(item => typeof item !== "string") || new Set(a).size !== a.length) return null;
    const min = i < 3 ? 1 : 0, max = i === 2 ? 2 : i === 4 ? 0 : 1;
    if (a.length < min || a.length > max) return null;
    const options: readonly string[] = questions[i].options;
    if (a.some(item => !options.includes(item))) return null;
    encoded.push(a.map(item => options.indexOf(item) + 1));
  }
  if (typeof v.idea !== "string" || v.idea.length > 1000 || /[\u0000-\u0008\u000b\u000c\u000e-\u001f]/.test(v.idea)) return null;
  // Staging accepts synthetic text only; no production collection switch exists.
  if (v.idea.trim() && !v.idea.startsWith("COLLAUDO:")) return null;
  if (!["", "yes", "no"].includes(v.consent as string) || typeof v.email !== "string" || typeof v.website !== "string" || v.website !== "") return null;
  const email = v.email.trim().toLowerCase();
  if (email && (v.consent !== "yes" || email.length > 254 || !/^[a-z0-9._+-]+@example\.invalid$/.test(email))) return null;
  return { requestId: v.requestId, q1: encoded[0][0], q2: encoded[1][0], q3: encoded[2], q4: encoded[3][0] ?? null, idea: v.idea.trim(), email: email || null, consent: v.consent === "yes" && Boolean(email) };
}
