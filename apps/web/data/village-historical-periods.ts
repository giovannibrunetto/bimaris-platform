import type { HistoricalPeriodKey } from "@/lib/types";

/** Historical attribution belongs to documented village points of interest.
 * Key: village slug, then village point slug. Add periods only after verification.
 */
export const villagePointHistoricalPeriods: Record<string, Record<string, HistoricalPeriodKey[]>> = {};

/** A village is shown for a period if at least one of its documented points belongs to it. */
export function getVillageHistoricalPeriods(villageSlug: string, pointSlugs: string[]): HistoricalPeriodKey[] {
  const entries = villagePointHistoricalPeriods[villageSlug] ?? {};
  return Array.from(new Set(pointSlugs.flatMap(slug => entries[slug] ?? [])));
}

export function getVillagePointHistoricalPeriods(villageSlug: string, pointSlug: string): HistoricalPeriodKey[] {
  return villagePointHistoricalPeriods[villageSlug]?.[pointSlug] ?? [];
}
