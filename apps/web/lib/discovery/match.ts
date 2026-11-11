// DS-DISC-01: pure, fail-closed candidate matching. No database writes.
export type Candidate = {
  id: string; published: boolean; operatorPublished: boolean; operatorSelected: boolean;
  discoveryActive: boolean; intents: string[]; childrenAllowed: boolean;
  minimumAge: number | null; durationMinutes: number | null; destinationVerified: boolean;
  editorialWeight?: number; slots?: { start: string; end: string }[];
};
export type DiscoveryQuery = {
  intent?: string; children?: boolean; age?: number; when?: string;
  maxTotalMinutes?: number; originVerified?: boolean;
  travelByExperience?: Record<string, { verified: boolean; outboundMinutes: number; returnMinutes: number }>;
};
const instantPattern = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}(?::\d{2}(?:\.\d{1,3})?)?(?:Z|[+-]\d{2}:\d{2})$/;
function instant(value: string): number | null {
  if (!instantPattern.test(value)) return null;
  const timestamp = Date.parse(value);
  return Number.isFinite(timestamp) ? timestamp : null;
}
export function matchDiscovery(items: Candidate[], query: DiscoveryQuery = {}) {
  const accepted: { id: string; totalMinutes: number | null; editorialWeight: number }[] = [];
  const excluded: { id: string; reasons: string[] }[] = [];
  for (const item of items) {
    const reasons: string[] = [];
    if (item.published !== true || item.operatorPublished !== true || item.operatorSelected !== true) reasons.push("not_public");
    if (item.discoveryActive !== true) reasons.push("discovery_inactive");
    if (query.intent && !item.intents?.includes(query.intent)) reasons.push("intent_mismatch");
    if (query.children === true && item.childrenAllowed !== true) reasons.push("children_incompatible");
    if (query.children === true && query.age == null && item.minimumAge != null && item.minimumAge > 0) {
      reasons.push("child_age_required");
    }
    if (query.age != null) {
      if (!Number.isInteger(query.age) || query.age < 0 ||
        (item.minimumAge != null && (!Number.isInteger(item.minimumAge) || query.age < item.minimumAge))) {
        reasons.push("age_unverified_or_incompatible");
      }
    }
    const duration = item.durationMinutes;
    if (!Number.isFinite(duration) || duration! <= 0) reasons.push("duration_unverified");
    if (query.when != null) {
      // Local wall-clock times are deliberately rejected; adapter resolves Europe/Rome/DST.
      const when = instant(query.when);
      if (when == null || !Array.isArray(item.slots) || !item.slots.some(s => {
        const start = instant(s.start);
        const end = instant(s.end);
        return start != null && end != null && Number.isFinite(duration) &&
          duration! > 0 && start <= when && when + duration! * 60000 <= end;
      })) reasons.push("availability_unconfirmed");
    }
    let totalMinutes: number | null = null;
    if (query.maxTotalMinutes != null) {
      const travel = query.travelByExperience?.[item.id];
      if (!Number.isFinite(query.maxTotalMinutes) || query.maxTotalMinutes <= 0 ||
        query.originVerified !== true || item.destinationVerified !== true ||
        travel?.verified !== true || !Number.isFinite(travel.outboundMinutes) ||
        travel.outboundMinutes < 0 || !Number.isFinite(travel.returnMinutes) ||
        travel.returnMinutes < 0) reasons.push("travel_unverified");
      else if (Number.isFinite(duration) && duration! > 0) {
        totalMinutes = travel.outboundMinutes + duration! + travel.returnMinutes;
        if (totalMinutes > query.maxTotalMinutes) reasons.push("time_budget_exceeded");
      }
    }
    if (reasons.length) excluded.push({ id: item.id, reasons });
    else accepted.push({ id: item.id, totalMinutes, editorialWeight: Number.isFinite(item.editorialWeight) ? item.editorialWeight! : 0 });
  }
  accepted.sort((a, b) => b.editorialWeight - a.editorialWeight || a.id.localeCompare(b.id));
  return { accepted, excluded };
}
