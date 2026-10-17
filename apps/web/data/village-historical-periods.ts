import type { HistoricalPeriodKey } from "@/lib/types";

/** Historical attribution belongs to documented village points of interest.
 * Key: village slug, then village point slug. Add periods only after verification.
 */
export const villagePointHistoricalPeriods: Record<string, Record<string, HistoricalPeriodKey[]>> = {
  // Castanea delle Furie: San Giovanni Battista was erected in 1500, preserves XVII-XVIII c. elements
  // and was restored after the 1908 earthquake; SS. Rosario parish dates to 1628 and preserves XVII-XVIII c. works.
  // The Monumento ai Caduti point is tied to twentieth-century war memory and its current commemorative installation.
  // Museo "I Ferri d'u Misteri" is a contemporary museum, so it is not assigned a historical period here.
  // https://www.casaliditramontana.it/villaggi-messina-nord/castanea-delle-furie/
  // https://comune.messina.it/it/news/messina-nel-nome-dellonore-omaggio-scultoreo-a-giovanni-denaro-il-15-maggio-a-castanea-delle-furie
  "castanea-delle-furie": {
    "chiesa-san-giovanni-battista": ["rinascimento-cinquecento", "seicento-settecento", "novecento"],
    "chiesa-santissimo-rosario": ["seicento-settecento", "novecento"],
    "monumento-ai-caduti": ["novecento"],
  },

  // Comune di Castroreale: Candelora late XIV c.; the Duomo was begun in the XV c. and enlarged in later centuries;
  // municipal/regional sources document the medieval castle.
  // https://www.comune.castroreale.me.it/vivere-il-comune/luoghi/chiesa-della-candelora/
  // https://www.istitutoitalianocastelli-sicilia.org/visita-castroreale-6-settembre-2026-comunicazione/
  // https://www2.regione.sicilia.it/beniculturali/dirbenicult/bca/ptpr/documentazione%20tecnica%20messina/ALLEGATI/h.3%20-%20Paesaggi%20Locali%20-%20Centri%20e%20Nuclei%20storici/BookCSNS_9_08.pdf
  castroreale: {
    "torre-federico-ii": ["medioevo"],
    "duomo-santa-maria-assunta": ["medioevo", "rinascimento-cinquecento", "seicento-settecento"],
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
  // San Giorgio XVII c.; Teatro XVIII-XIX c. MANOS is a civic archaeological/territorial museum
  // spanning geological, prehistoric, historical and artistic collections, so it is classified as cross-period.
  // https://agora.comune.messina.it/it/node/33
  // https://www.comunedinovaradisicilia.me.it/patrimonio-culturale.html
  "novara-di-sicilia": {
    "duomo-santa-maria-assunta": ["rinascimento-cinquecento"],
    "chiesa-san-francesco": ["medioevo"],
    "chiesa-sant-antonio-abate": ["rinascimento-cinquecento", "seicento-settecento"],
    "chiesa-san-giorgio": ["seicento-settecento"],
    "teatro-riccardo-casalaina": ["seicento-settecento", "ottocento"],
    "museo-manos": ["trasversale"],
  },

  // Comune di San Marco d'Alunzio / Diocesi di Patti: Tempio d'Ercole IV c. a.C.; Norman castle from 1061;
  // Aracoeli XVI c.; Madre built from late XVI c.; SS. Salvatore XII c.
  // https://www.comune.sanmarcodalunzio.me.it/vivere-il-comune/luoghi/tempio-d-ercole/
  // https://www.comune.sanmarcodalunzio.me.it/vivere-il-comune/luoghi/ruderi-castello-normanno/
  // https://www.diocesipatti.it/museo-di-san-marco-dalunzio/
  "san-marco-d-alunzio": {
    "tempio-ercole": ["antichita"],
    "castello-normanno": ["medioevo"],
    "chiesa-madre-san-nicolo": ["rinascimento-cinquecento", "seicento-settecento", "ottocento"],
    "chiesa-maria-santissima-ara-coeli": ["rinascimento-cinquecento", "seicento-settecento"],
    "chiesa-san-salvatore": ["medioevo"],
  },

  // Comune di Savoca: Porta XII c.; Pentefur refounded by Normans c.1070 with later phases;
  // San Nicolò XIII c. with XVIII c. remodelling; Cappuccini 1603-1614 / crypt early XVIII c.;
  // Palazzo Trimarchi was built between the late XVII and early XVIII c. and restored in 1773;
  // the Bar Vitelli identity/location is also tied to the 1971 filming of The Godfather.
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
    "bar-vitelli": ["seicento-settecento", "novecento"],
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
