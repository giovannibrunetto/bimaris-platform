"use client";

import type { AnalyticsEventName } from "@/lib/types";

const CONSENT_KEY = "bimaris_consent_v1";
const ANON_KEY = "bimaris_anon_id";
const SESSION_KEY = "bimaris_session_id";

export type ConsentState = { analytics: boolean; personalization: boolean; marketing: boolean };

export function readConsent(): ConsentState | null {
  if (typeof window === "undefined") return null;
  try { const raw = localStorage.getItem(CONSENT_KEY); return raw ? JSON.parse(raw) : null; } catch { return null; }
}
export function saveConsent(value: ConsentState) { localStorage.setItem(CONSENT_KEY, JSON.stringify(value)); window.dispatchEvent(new Event("bimaris-consent-changed")); }
function getId(key: string) { let value = sessionStorage.getItem(key); if (!value) { value = crypto.randomUUID(); sessionStorage.setItem(key, value); } return value; }
function getAnonymousId() { let value = localStorage.getItem(ANON_KEY); if (!value) { value = crypto.randomUUID(); localStorage.setItem(ANON_KEY, value); } return value; }
function interestFromPath(pathname: string) {
  if (pathname.startsWith("/cultura")) return "cultura";
  if (pathname.startsWith("/storie-miti-leggende")) return "miti-leggende";
  if (pathname.startsWith("/borghi")) return "borghi";
  if (pathname.startsWith("/sapori-territori")) return "sapori";
  if (pathname.startsWith("/esperienze")) return "esperienze";
  if (pathname.startsWith("/itinerari")) return "itinerari";
  if (pathname.startsWith("/mappa")) return "mappa";
  return null;
}
export async function track(event: AnalyticsEventName, properties: Record<string, string | number | boolean | null> = {}) {
  if (typeof window === "undefined") return;
  const consent = readConsent();
  if (!consent?.analytics) return;
  const pathname = window.location.pathname;
  const payload = { event, path: pathname, sessionId: getId(SESSION_KEY), anonymousId: getAnonymousId(), properties: { ...properties, interest_key: properties.interest_key ?? interestFromPath(pathname), referrer: document.referrer || null, viewport: `${window.innerWidth}x${window.innerHeight}`, language: navigator.language } };
  try { await fetch("/api/analytics/track", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify(payload), keepalive: true }); } catch { }
}
