import type { HistoricalPeriodKey } from "@/lib/types";

/** Historical attribution belongs to documented village points of interest.
 * Key: village slug, then village point slug. Add periods only after verification.
 *
 * The current HistoricalPeriodKey taxonomy starts at the Middle Ages. Ancient sites
 * (for example the Tempio d'Ercole at San Marco d'Alunzio, IV century BC) stay
 * intentionally unclassified until the shared taxonomy includes antiquity.
 */
export const villagePointHistoricalPeriods: Record<string, Record<string, HistoricalPeriodKey[]>> = {
  // Comune di Castroreale: Candelora late XIV c.; municipal/regional sources document the medieval castle.
  // https://www.comune.castroreale.me.it/vivere-il-comune/luoghi/chiesa-della-candelora/
  // https://www2.regione.sicilia.it/beniculturali/dirbenicult/bca/ptpr/documentazione%20tecnica%20messina/ALLEGATI/h.3%20-%20Paesaggi%20Locali%20-%20Centri%20e%20Nuclei%20storici/BookCSNS_9_08.pdf
  castroreale: {
    "torre-federico-ii": ["medioevo"],
    "duomo-santa-maria-assunta": ["rinascimento-cinquecento", "seicento-settecento"],
    "chiesa-della-candelora": ["medioevo", "rinascimento-cinquecento", "seicento-settecento"],
  },

  // Città Metropolitana di Messina / documented local history: castle has Svevian XIII c. and Aragonese XIV c. phases;
  // the Duomo originates in the Norman-Swabian period and was rebuilt/enlarged in 1646.
  // https://agora.comune.messina.it/en/node/31
  "montalbano-elicona": {
    "castello-montalbano-elicona": ["medioevo"],
    "duomo-montalbano-elicona": ["medioevo", "seicento-settecento"],
  },

  // Città Metropolitana di Messina: San Francesco XIII c.; Sant'Antonio from 1538;
  // San Giorgio XVII c.; Palazzo Salvo-Risicato XVIII c.; Teatro XVIII-XIX c.
  // https://agora.comune.messina.it/it/node/33
  "novara-di-sicilia": {
    "duomo-santa-maria-assunta": ["rinascimento-cinquecento"],
    "chiesa-san-francesco": ["medioevo"],
    "chiesa-sant-antonio-abate": ["rinascimento-cinquecento", "seicento-settecento"],
    "chiesa-san-giorgio": ["seicento-settecento"],
    "teatro-riccardo-casalaina": ["seicento-settecento", "ottocento"],
    "museo-manos": ["seicento-settecento"],
  },

  // Comune di San Marco d'Alunzio / Diocesi di Patti: Norman castle from 1061;
  // Aracoeli XVI c.; Madre built from late XVI c.; SS. Salvatore XII c.
  // https://www.comune.sanmarcodalunzio.me.it/vivere-il-comune/luoghi/ruderi-castello-normanno/
  // https://www.diocesipatti.it/museo-di-san-marco-dalunzio/
  "san-marco-d-alunzio": {
    "castello-normanno": ["medioevo"],
    "chiesa-madre-san-nicolo": ["rinascimento-cinquecento", "seicento-settecento", "ottocento"],
    "chiesa-maria-santissima-ara-coeli": ["rinascimento-cinquecento", "seicento-settecento"],
    "chiesa-san-salvatore": ["medioevo"],
  },

  // Comune di Savoca: Porta XII c.; Pentefur refounded by Normans c.1070 with later phases;
  // San Nicolò XIII c. with XVIII c. remodelling; Cappuccini 1603-1614 / crypt early XVIII c.;
  // Palazzo Trimarchi built late XVII/early XVIII c.
  // https://www.comune.savoca.me.it/savoca/zf/index.php/musei-monumenti/index/dettaglio-museo/museo/21
  // https://www.comune.savoca.me.it/savoca/zf/index.php/musei-monumenti/index/dettaglio-museo/museo/7
  // https://www.comune.savoca.me.it/savoca/zf/index.php/musei-monumenti/index/dettaglio-museo/museo/2
  // https://www.cappuccinimessina.it/Presenze-Pastorali.aspx?ID=10
  // https://www.comune.savoca.me.it/savoca/zf/index.php/servizi-aggiuntivi/index/index/idtesto/16
  savoca: {
    "porta-della-citta": ["medioevo"],
    "castello-pentefur": ["medioevo", "rinascimento-cinquecento", "seicento-settecento"],
    "chiesa-madre": ["medioevo", "rinascimento-cinquecento", "seicento-settecento"],
    "chiesa-san-nicolo": ["medioevo", "seicento-settecento"],
    "convento-cappuccini": ["seicento-settecento"],
    "bar-vitelli": ["seicento-settecento"],
  },
};

/** A village is shown for a period if at least one of its documented points belongs to it. */
export function getVillageHistoricalPeriods(villageSlug: string, pointSlugs: string[]): HistoricalPeriodKey[] {
  const entries = villagePointHistoricalPeriods[villageSlug] ?? {};
  return Array.from(new Set(pointSlugs.flatMap(slug => entries[slug] ?? [])));
}

export function getVillagePointHistoricalPeriods(villageSlug: string, pointSlug: string): HistoricalPeriodKey[] {
  return villagePointHistoricalPeriods[villageSlug]?.[pointSlug] ?? [];
}
