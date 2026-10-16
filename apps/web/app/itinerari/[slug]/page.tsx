import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getPublishedItineraryBySlug, type ItineraryStop } from "@/data/itineraries";

export const dynamic = "force-dynamic";
export const revalidate = 0;

function stopDestination(stop: ItineraryStop) {
  if (Number.isFinite(stop.latitude) && Number.isFinite(stop.longitude)) {
    return `${stop.latitude},${stop.longitude}`;
  }
  return stop.googleMapsQuery?.trim();
}

function sameDestination(a: string, b: string) {
  return a.toLocaleLowerCase("it-IT") === b.toLocaleLowerCase("it-IT");
}

function routeUrl(destinations: string[]) {
  if (destinations.length < 2) return undefined;
  const origin = encodeURIComponent(destinations[0]);
  const destination = encodeURIComponent(destinations[destinations.length - 1]);
  const waypoints = destinations.slice(1, -1).map(encodeURIComponent).join("%7C");
  return `https://www.google.com/maps/dir/?api=1&origin=${origin}&destination=${destination}${waypoints ? `&waypoints=${waypoints}` : ""}`;
}

function kindLabel(kind: string) {
  if (kind === "culture") return "Cultura";
  if (kind === "story") return "Mito o leggenda";
  if (kind === "experience") return "Esperienza";
  if (kind === "operator") return "Operatore";
  return "Tappa";
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const itinerary = await getPublishedItineraryBySlug(slug);
  if (!itinerary) return {};
  return {
    title: `${itinerary.title} | Itinerari BIMARIS`,
    description: itinerary.excerpt,
    openGraph: itinerary.imageUrl ? { images: [itinerary.imageUrl] } : undefined,
  };
}

export default async function ItineraryDetailPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const itinerary = await getPublishedItineraryBySlug(slug);
  if (!itinerary) notFound();

  const mappableStops = itinerary.stops.reduce<string[]>((destinations, stop) => {
    const destination = stopDestination(stop);
    if (!destination) return destinations;

    const previous = destinations[destinations.length - 1];
    if (!previous || !sameDestination(previous, destination)) destinations.push(destination);
    return destinations;
  }, []);
  const fullRoute = routeUrl(mappableStops);

  return (
    <>
      <section className="page-hero">
        <div className="kicker">{itinerary.territory ?? "Messina"} · Itinerario BIMARIS</div>
        <h1>{itinerary.title}</h1>
        <p>{itinerary.excerpt}</p>
        <div className="actions">
          {fullRoute && <a className="button" href={fullRoute} target="_blank" rel="noreferrer">Apri percorso in Google Maps</a>}
          <Link className="button ghost" href="/itinerari">Tutti gli itinerari</Link>
        </div>
      </section>

      {itinerary.imageUrl && (
        <section className="culture-hero-wrap">
          <figure className="culture-hero-figure">
            <img src={itinerary.imageUrl} alt={itinerary.imageAlt ?? itinerary.title} decoding="async" />
          </figure>
        </section>
      )}

      <section className="section detail-grid">
        <article>
          <div className="kicker">Il percorso</div>
          <h2 style={{ fontFamily: "Georgia,serif", fontSize: 42, marginTop: 8 }}>Come viverlo</h2>
          <p style={{ fontSize: 18, lineHeight: 1.75, color: "#4d5962" }}>{itinerary.description}</p>

          <div style={{ display: "grid", gap: 18, marginTop: 30 }}>
            {itinerary.stops.map((stop, index) => {
              const destination = stopDestination(stop);
              const directionsUrl = destination
                ? `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(destination)}`
                : undefined;

              return (
                <article className="detail-panel" key={stop.id} style={{ position: "relative" }}>
                  <div className="eyebrow">Tappa {index + 1} · {kindLabel(stop.kind)}</div>
                  <h3 style={{ marginBottom: 8 }}>{stop.title}</h3>
                  {stop.excerpt && <p style={{ lineHeight: 1.65 }}>{stop.excerpt}</p>}
                  {stop.note && <p><strong>Nota BIMARIS:</strong> {stop.note}</p>}
                  <div className="meta-row">
                    {stop.stayMinutes && <span>Sosta consigliata: {stop.stayMinutes} min</span>}
                    {stop.address && <span>{stop.address}</span>}
                  </div>
                  <div className="actions" style={{ marginTop: 16 }}>
                    {stop.href && <Link className="text-link" href={stop.href}>Apri la scheda →</Link>}
                    {directionsUrl && (
                      <a className="text-link" href={directionsUrl} target="_blank" rel="noreferrer">Indicazioni per questa tappa →</a>
                    )}
                  </div>
                </article>
              );
            })}

            {itinerary.stops.length === 0 && (
              <div className="detail-panel"><p>Le tappe di questo itinerario sono in aggiornamento.</p></div>
            )}
          </div>
        </article>

        <aside className="detail-panel">
          <div className="kicker">In sintesi</div>
          <h3>Informazioni</h3>
          <ul className="list">
            <li><strong>Durata</strong><br />{itinerary.duration}</li>
            <li><strong>Tappe</strong><br />{itinerary.stops.length}</li>
            {itinerary.target && <li><strong>Ideale per</strong><br />{itinerary.target}</li>}
            {itinerary.territory && <li><strong>Territorio</strong><br />{itinerary.territory}</li>}
          </ul>
          {fullRoute && (
            <div className="actions" style={{ marginTop: 22 }}>
              <a className="button" href={fullRoute} target="_blank" rel="noreferrer">Avvia il percorso</a>
            </div>
          )}
        </aside>
      </section>
    </>
  );
}
