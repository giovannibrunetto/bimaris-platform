import "server-only";
import { loadDiscoveryCandidates } from "./load-candidates";
import { matchDiscovery, type DiscoveryQuery } from "./match";

/**
 * Server-side discovery orchestration.
 * Only public, approved experiences are read. No database writes or publication.
 * Availability is resolved only for an offset-aware requested instant.
 * Travel estimates must be provided by a verified routing integration.
 */
export async function searchDiscovery(query: DiscoveryQuery = {}, nowIso?: string) {
  const when = query.when;
  const validInstant = typeof when === "string" &&
    /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}(?::\d{2}(?:\.\d{1,3})?)?(?:Z|[+-]\d{2}:\d{2})$/.test(when) &&
    Number.isFinite(Date.parse(when));
  const validNow = typeof nowIso === "string" &&
    /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}(?::\d{2}(?:\.\d{1,3})?)?(?:Z|[+-]\d{2}:\d{2})$/.test(nowIso) &&
    Number.isFinite(Date.parse(nowIso));
  // The calendar date must be interpreted in Europe/Rome, not the server timezone.
  const date = validInstant
    ? new Intl.DateTimeFormat("en-CA", {
        timeZone: "Europe/Rome", year: "numeric", month: "2-digit", day: "2-digit"
      }).format(new Date(when))
    : undefined;
  const candidates = await loadDiscoveryCandidates(date, validNow ? nowIso : undefined);
  return matchDiscovery(candidates, query);
}
