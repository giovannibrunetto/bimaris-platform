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
  description: "Esplora i monumenti di Messina per epoca storica e costruisci un percorso personalizzato tra Medioevo, Rinascimento, Ottocento e Novecento.",
};

type EraKey = "all" | Exclude<HistoricalPeriodKey, "trasversale">;

function isEraKey(value?: string): value is Exclude<HistoricalPeriodKey, "trasversale"> {
  return HISTORICAL_PERIODS.some(period => period.key === value);
}

export default async function HistoricalMapPage({
  searchParams,
}: {
  searchParams: Promise<{ epoca?: string }>;
}) {
  const entries = await getPublishedCultureEntries();
  const { epoca } = await searchParams;
  const initialPeriod: EraKey = isEraKey(epoca) ? epoca : "all";
  const mappedEntries = entries.filter(entry => entry.historicalPeriods.length > 0);

  return (
    <>
      <section className="page-hero">
        <div className="kicker">Messina nel tempo</div>
        <h1>Mappa storica</h1>
        <p>
          Scegli un&apos;epoca e scopri sulla mappa i monumenti che raccontano quella fase della storia di Messina. Puoi selezionare le tappe che preferisci e creare il tuo percorso personale.
        </p>
      </section>

      <section className="section">
        <div className="section-head">
          <div>
            <div className="kicker">Percorsi nel tempo</div>
            <h2>Esplora Messina per epoca storica.</h2>
          </div>
          <p>
            Alcuni luoghi attraversano più epoche: in questi casi compaiono in più filtri. La classificazione distingue l&apos;origine storica dalle ricostruzioni successive, così il visitatore può capire cosa sta osservando.
          </p>
        </div>

        <div className="cards">
          {HISTORICAL_PERIODS.map(period => {
            const count = mappedEntries.filter(entry => entry.historicalPeriods.includes(period.key)).length;
            return (
              <article className="card" key={period.key}>
                <div className="card-body">
                  <div className="eyebrow">{period.range}</div>
                  <h3>{period.label}</h3>
                  <p>{period.shortDescription}</p>
                  <Link className="text-link" href={`/mappa/epoche?epoca=${period.key}`}>
                    Mostra sulla mappa ({count}) →
                  </Link>
                </div>
              </article>
            );
          })}
        </div>
      </section>

      <section className="section dark">
        <div className="section-head">
          <div>
            <div className="kicker">Mappa cronologica</div>
            <h2>Costruisci la tua visita.</h2>
          </div>
          <p>
            Filtra per epoca, apri un monumento e aggiungilo al percorso. Le tappe selezionate possono essere aperte direttamente in Google Maps a piedi o in auto.
          </p>
        </div>

        <HistoricalCultureMap entries={mappedEntries} initialPeriod={initialPeriod} />
      </section>

      <section className="section sand">
        <div className="section-head">
          <div>
            <div className="kicker">Tutti i contenuti</div>
            <h2>Vuoi tornare alla selezione culturale completa?</h2>
          </div>
          <p>La sezione Cultura include anche musei e luoghi che non appartengono a una sola epoca monumentale.</p>
        </div>
        <div className="actions">
          <Link className="button" href="/cultura">Apri Cultura</Link>
          <Link className="button ghost" href="/mappa">Apri la mappa generale</Link>
        </div>
      </section>
    </>
  );
}
