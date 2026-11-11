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
export function matchDiscovery(items: Candidate[], query: DiscoveryQuery = {}) {
  const accepted: { id: string; totalMinutes: number | null; editorialWeight: number }[] = [];
  const excluded: { id: string; reasons: string[] }[] = [];
  for (const item of items) {
    const reasons: string[] = [];
    if (item.published !== true || item.operatorPublished !== true || item.operatorSelected !== true) reasons.push("not_public");
    if (item.discoveryActive !== true) reasons.push("discovery_inactive");
    if (query.intent && !item.intents?.includes(query.intent)) reasons.push("intent_mismatch");
    if (query.children === true && item.childrenAllowed !== true) reasons.push("children_incompatible");
    if (Number.isFinite(query.age) && (!Number.isFinite(item.minimumAge) || query.age! < item.minimumAge!)) reasons.push("age_unverified_or_incompatible");
    const duration = item.durationMinutes;
    if (!Number.isFinite(duration) || duration! <= 0) reasons.push("duration_unverified");
    if (query.when) {
      // Require resolved ISO instants; local clock/DST resolution belongs to the adapter.
      const when = Date.parse(query.when);
      if (!Number.isFinite(when) || !Array.isArray(item.slots) || !item.slots.some(s =>
        Number.isFinite(Date.parse(s.start)) && Number.isFinite(Date.parse(s.end)) &&
        Date.parse(s.start) <= when && when + duration! * 60000 <= Date.parse(s.end)
      )) reasons.push("availability_unconfirmed");
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
