import type { DiscoveryQuery } from "./match";

/**
 * Discovery input gate for a future user-facing search.
 * This does not resolve routing, availability, or booking.
 * Reject ambiguous or impossible inputs before querying public data.
 */
export type DiscoveryInputCheck =
  | { ok: true; query: DiscoveryQuery }
  | { ok: false; reasons: string[] };

const absoluteInstant = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}(?::\d{2}(?:\.\d{1,3})?)?(?:Z|[+-]\d{2}:\d{2})$/;

export function validateDiscoveryInput(query: DiscoveryQuery, nowIso?: string): DiscoveryInputCheck {
  const reasons: string[] = [];
  if (query.age != null && (!Number.isInteger(query.age) || query.age < 0 || query.age > 120)) {
    reasons.push("invalid_age");
  }
  if (query.maxTotalMinutes != null &&
    (!Number.isFinite(query.maxTotalMinutes) || query.maxTotalMinutes <= 0)) {
    reasons.push("invalid_time_budget");
  }
  if (query.when != null) {
    const validWhen = absoluteInstant.test(query.when) && Number.isFinite(Date.parse(query.when));
    const validNow = typeof nowIso === "string" && absoluteInstant.test(nowIso) && Number.isFinite(Date.parse(nowIso));
    if (!validWhen) reasons.push("invalid_requested_instant");
    if (!validNow) reasons.push("missing_reference_instant");
    if (validWhen && validNow && Date.parse(query.when) < Date.parse(nowIso!)) {
      reasons.push("requested_instant_in_past");
    }
  }
  if (query.maxTotalMinutes != null && query.originVerified !== true) {
    reasons.push("origin_unverified");
  }
  return reasons.length ? { ok: false, reasons } : { ok: true, query };
}
