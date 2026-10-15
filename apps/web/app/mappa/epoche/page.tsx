import type { Metadata } from "next";
import Link from "next/link";
import { HistoricalCultureMap } from "@/components/HistoricalCultureMap";
import { getPublishedCultureEntries } from "@/data/live";
import { HISTORICAL_PERIODS } from "@/lib/historical-periods";
import type { HistoricalPeriodKey } from "@/lib/types";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export const metadata: Metadata = {
  title: "Mappa storica di Messina | BIMARIS",
  description: "Esplora i monumenti di Messina attraverso le epoche realmente rappresentate dal patrimonio pubblicato su BIMARIS e costruisci il tuo percorso personalizzato.",
};

type EraKey = "all" | Exclude<HistoricalPeriodKey, "trasversale">;

const MIN_PLACES_FOR_FEATURED_ERA = 2;

export default async function HistoricalMapPage({
  searchParams,
}: {
  searchParams: Promise<{ epoca?: string }>;
}) {
  const entries = await getPublishedCultureEntries();
  const { epoca } = await searchParams;
  const mappedEntries = entries.filter(entry => entry.historicalPeriods.length > 0);

  // Le epoche mostrate come percorsi devono derivare dai monumenti realmente
  // pubblicati. Evitiamo sezioni arbitrarie o percorsi composti da un solo luogo.
  const availablePeriods = HISTORICAL_PERIODS
    .map(period => ({
      ...period,
      count: mappedEntries.filter(entry => entry.historicalPeriods.includes(period.key)).length,
    }))
    .filter(period => period.count >= MIN_PLACES_FOR_FEATURED_ERA);

  const isAvailableEra = (value?: string): value is Exclude<HistoricalPeriodKey, "trasversale"> =>
    availablePeriods.some(period => period.key === value);

  const initialPeriod: EraKey = isAvailableEra(epoca) ? epoca : "all";
  const availablePeriodKeys = availablePeriods.map(period => period.key);

  return (
    <>
      <section className="page-hero">
        <div className="kicker">Messina nel tempo</div>
        <h1>Mappa storica</h1>
        <p>
          Esplora Messina attraverso le epoche raccontate dai monumenti realmente presenti su BIMARIS. Scegli le tappe che preferisci e costruisci il tuo percorso personale.
        </p>
      </section>

      <section className="section">
        <div className="section-head">
          <div>
            <div className="kicker">Percorsi nel tempo</div>
            <h2>Le epoche raccontate dai monumenti.</h2>
          </div>
          <p>
            BIMARIS mostra un percorso storico solo quando il patrimonio pubblicato offre abbastanza luoghi per renderlo utile. Alcuni monumenti attraversano più epoche e possono comparire in più percorsi.
          </p>
        </div>

        <div className="cards">
          {availablePeriods.map(period => (
            <article className="card" key={period.key}>
              <div className="card-body">
                <div className="eyebrow">{period.range}</div>
                <h3>{period.label}</h3>
                <p>{period.shortDescription}</p>
                <Link className="text-link" href={`/mappa/epoche?epoca=${period.key}`}>
                  Mostra sulla mappa ({period.count}) →
                </Link>
              </div>
            </article>
          ))}
        </div>
      </section>

      <section className="section dark">
        <div className="section-head">
          <div>
            <div className="kicker">Mappa cronologica</div>
            <h2>Costruisci la tua visita.</h2>
          </div>
          <p>
            Filtra per una delle epoche realmente rappresentate, apri un monumento e aggiungilo al percorso. Le tappe selezionate possono essere aperte direttamente in Google Maps a piedi o in auto.
          </p>
        </div>

        <HistoricalCultureMap
          entries={mappedEntries}
          initialPeriod={initialPeriod}
          availablePeriodKeys={availablePeriodKeys}
        />
      </section>

      <section className="section sand">
        <div className="section-head">
          <div>
            <div className="kicker">Tutti i contenuti</div>
            <h2>Vuoi tornare alla selezione culturale completa?</h2>
          </div>
          <p>La sezione Cultura include anche musei e luoghi che attraversano più epoche e non appartengono a un singolo percorso monumentale.</p>
        </div>
        <div className="actions">
          <Link className="button" href="/cultura">Apri Cultura</Link>
          <Link className="button ghost" href="/mappa">Apri la mappa generale</Link>
        </div>
      </section>
    </>
  );
}
