import type { Metadata } from "next";
import Link from "next/link";
import { getPublishedCultureEntries } from "@/data/live";
import { HISTORICAL_PERIODS } from "@/lib/historical-periods";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export const metadata: Metadata = {
  title: "Percorsi storici di Messina | BIMARIS",
  description: "Scegli un'epoca, consulta le tappe e apri in Google Maps un percorso tra i monumenti di Messina selezionati da BIMARIS.",
};

const MIN_PLACES_FOR_FEATURED_ERA = 2;

function mapsRouteUrl(points: { googleMapsQuery: string }[]) {
  if (!points.length) return "";
  const params = new URLSearchParams({
    api: "1",
    destination: points.at(-1)!.googleMapsQuery,
    travelmode: "walking",
  });
  if (points.length > 1) params.set("origin", points[0].googleMapsQuery);
  if (points.length > 2) {
    params.set("waypoints", points.slice(1, -1).map(point => point.googleMapsQuery).join("|"));
  }
  return `https://www.google.com/maps/dir/?${params.toString()}`;
}

export default async function HistoricalMapPage() {
  const entries = await getPublishedCultureEntries();
  const mappedEntries = entries.filter(entry => entry.historicalPeriods.length > 0);

  const availablePeriods = HISTORICAL_PERIODS
    .map(period => {
      const places = mappedEntries
        .filter(entry => entry.historicalPeriods.includes(period.key))
        .sort((a, b) => (a.historicalSortYear ?? 9999) - (b.historicalSortYear ?? 9999));
      return {
        ...period,
        places,
        routeUrl: mapsRouteUrl(places),
      };
    })
    .filter(period => period.places.length >= MIN_PLACES_FOR_FEATURED_ERA);

  return (
    <>
      <section className="page-hero">
        <div className="kicker">Messina nel tempo</div>
        <h1>Percorsi storici</h1>
        <p>
          Scegli l&apos;epoca che vuoi esplorare. Prima di partire puoi vedere tutte le tappe; quando sei pronto, BIMARIS apre il percorso pedonale in Google Maps.
        </p>
      </section>

      <section className="section">
        <div className="section-head">
          <div>
            <div className="kicker">Percorsi nel tempo</div>
            <h2>Le epoche raccontate dai monumenti.</h2>
          </div>
          <p>
            Ogni percorso nasce dai monumenti realmente presenti su BIMARIS. Alcuni luoghi attraversano più epoche e possono quindi far parte di più itinerari.
          </p>
        </div>

        <div className="cards">
          {availablePeriods.map(period => (
            <article className="card historical-route-card" key={period.key}>
              <div className="card-body">
                <div className="eyebrow">{period.range}</div>
                <h3>{period.label}</h3>
                <p>{period.shortDescription}</p>
                <div className="historical-route-count">
                  {period.places.length} tappe · percorso pedonale
                </div>
                <ol className="historical-route-stops" aria-label={`Tappe del percorso ${period.label}`}>
                  {period.places.map(place => (
                    <li key={place.id}>
                      <Link href={`/cultura/${place.slug}`}>{place.title}</Link>
                    </li>
                  ))}
                </ol>
                <a className="text-link" href={period.routeUrl} target="_blank" rel="noreferrer">
                  Apri percorso pedonale in Google Maps ↗
                </a>
              </div>
            </article>
          ))}
        </div>
      </section>

      <section className="section sand">
        <div className="section-head">
          <div>
            <div className="kicker">Esplora liberamente</div>
            <h2>Preferisci creare un percorso personale?</h2>
          </div>
          <p>Usa la mappa generale di BIMARIS per scegliere singolarmente monumenti, attrazioni ed esperienze e costruire il tuo itinerario.</p>
        </div>
        <div className="actions">
          <Link className="button" href="/mappa">Apri la mappa generale</Link>
          <Link className="button ghost" href="/cultura">Esplora Cultura</Link>
        </div>
      </section>
    </>
  );
}
