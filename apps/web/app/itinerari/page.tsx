import type { Metadata } from "next";
import Link from "next/link";
import { getPublishedItineraries } from "@/data/itineraries";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export const metadata: Metadata = {
  title: "Itinerari a Messina | BIMARIS",
  description: "Percorsi selezionati per scoprire Messina e il territorio attraverso cultura, miti, esperienze e operatori BIMARIS.",
};

export default async function ItinerariesPage() {
  const itineraries = await getPublishedItineraries();

  return (
    <>
      <section className="page-hero">
        <div className="kicker">Percorsi</div>
        <h1>Itinerari BIMARIS</h1>
        <p>
          Percorsi costruiti collegando luoghi culturali, storie, esperienze e realtà selezionate. Ogni itinerario indica tempi e tappe per aiutarti a vivere il territorio senza improvvisare.
        </p>
      </section>

      <section className="section">
        <div className="section-head">
          <div>
            <div className="kicker">Scegli il percorso</div>
            <h2>Messina, organizzata per tempo e interessi.</h2>
          </div>
          <p>I percorsi vengono pubblicati solo dopo la verifica delle singole tappe e dei contenuti collegati.</p>
        </div>

        {itineraries.length > 0 ? (
          <div className="cards">
            {itineraries.map(itinerary => (
              <article className="card" key={itinerary.id}>
                <div
                  className="card-media"
                  style={itinerary.imageUrl ? {
                    minHeight: 230,
                    backgroundImage: `linear-gradient(rgba(7,24,35,.08),rgba(7,24,35,.44)), url(${itinerary.imageUrl})`,
                    backgroundSize: "cover",
                    backgroundPosition: "center",
                  } : undefined}
                >
                  <span>{itinerary.featured ? "In evidenza" : "Itinerario"}</span>
                </div>
                <div className="card-body">
                  <div className="eyebrow">{itinerary.territory ?? "Messina"}</div>
                  <h3>{itinerary.title}</h3>
                  <p>{itinerary.excerpt}</p>
                  <div className="meta-row">
                    <span>{itinerary.duration}</span>
                    <span>{itinerary.stops.length} {itinerary.stops.length === 1 ? "tappa" : "tappe"}</span>
                    {itinerary.target && <span>{itinerary.target}</span>}
                  </div>
                  <Link className="text-link" href={`/itinerari/${itinerary.slug}`}>Apri il percorso →</Link>
                </div>
              </article>
            ))}
          </div>
        ) : (
          <div className="detail-panel">
            <div className="kicker">In preparazione</div>
            <h3>I primi itinerari BIMARIS sono in costruzione.</h3>
            <p>Stiamo verificando tappe, tempi e collegamenti prima della pubblicazione. Non mostriamo percorsi dimostrativi come se fossero già pronti.</p>
          </div>
        )}
      </section>
    </>
  );
}
