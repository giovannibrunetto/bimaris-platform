"use client";

import type { AnalyticsEventName } from "@bimaris/core";

const CONSENT_KEY = "bimaris_consent_v1";
const ANON_KEY = "bimaris_anon_id";
const SESSION_KEY = "bimaris_session_id";

export type ConsentState = {
  analytics: boolean;
  personalization: boolean;
  marketing: boolean;
};

export function readConsent(): ConsentState | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem(CONSENT_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

export function saveConsent(value: ConsentState) {
  localStorage.setItem(CONSENT_KEY, JSON.stringify(value));
  window.dispatchEvent(new Event("bimaris-consent-changed"));
}

function getId(key: string) {
  let value = sessionStorage.getItem(key);
  if (!value) {
    value = crypto.randomUUID();
    sessionStorage.setItem(key, value);
  }
  return value;
}

function getAnonymousId() {
  let value = localStorage.getItem(ANON_KEY);
  if (!value) {
    value = crypto.randomUUID();
    localStorage.setItem(ANON_KEY, value);
  }
  return value;
}

export async function track(
  event: AnalyticsEventName,
  properties: Record<string, string | number | boolean | null> = {},
) {
  if (typeof window === "undefined") return;
  const consent = readConsent();
  if (!consent?.analytics) return;

  const payload = {
    event,
    path: window.location.pathname,
    sessionId: getId(SESSION_KEY),
    anonymousId: getAnonymousId(),
    properties: {
      ...properties,
      referrer: document.referrer || null,
      viewport: `${window.innerWidth}x${window.innerHeight}`,
      language: navigator.language,
    },
  };

  try {
    await fetch("/api/analytics/track", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(payload),
      keepalive: true,
    });
  } catch {
    // Analytics must never block the user experience.
  }
}
