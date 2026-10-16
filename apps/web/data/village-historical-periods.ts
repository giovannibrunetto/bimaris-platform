import type { HistoricalPeriodKey } from "@/lib/types";

/** Historical attribution belongs to documented village points of interest.
 * Key: village slug, then village point slug. Add periods only after verification.
 */
export const villagePointHistoricalPeriods: Record<string, Record<string, HistoricalPeriodKey[]>> = {
  // Regione Siciliana, Piano Paesaggistico Messina, CS_09_09, p. 5:
  // https://www2.regione.sicilia.it/beniculturali/dirbenicult/bca/ptpr/documentazione%20tecnica%20messina/ALLEGATI/h.3%20-%20Paesaggi%20Locali%20-%20Centri%20e%20Nuclei%20storici/BookCSNS_9_08.pdf
  castroreale: { "torre-federico-ii": ["medioevo"] },
  // Città metropolitana di Messina: interventi svevi del XIII secolo e aragonesi del XIV.
  // https://agora.comune.messina.it/en/node/31
  "montalbano-elicona": { "castello-montalbano-elicona": ["medioevo"] },
  // Frati Cappuccini di Messina: convento attuale 1603-1614, cripta inizi XVIII secolo.
  // https://www.cappuccinimessina.it/Presenze-Pastorali.aspx?ID=10
  savoca: { "convento-cappuccini": ["seicento-settecento"] },
};

/** A village is shown for a period if at least one of its documented points belongs to it. */
export function getVillageHistoricalPeriods(villageSlug: string, pointSlugs: string[]): HistoricalPeriodKey[] {
  const entries = villagePointHistoricalPeriods[villageSlug] ?? {};
  return Array.from(new Set(pointSlugs.flatMap(slug => entries[slug] ?? [])));
}

export function getVillagePointHistoricalPeriods(villageSlug: string, pointSlug: string): HistoricalPeriodKey[] {
  return villagePointHistoricalPeriods[villageSlug]?.[pointSlug] ?? [];
}
