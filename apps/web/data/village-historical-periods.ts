import type { HistoricalPeriodKey } from "@/lib/types";

/** Curated historical periods for villages, keyed by village slug.
 * Add a period only after its historical attribution has been verified.
 * Villages without verified attribution remain absent from historical searches.
 */
export const villageHistoricalPeriods: Record<string, HistoricalPeriodKey[]> = {};
