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
      <section className="page-hero bimaris-ambient-hero">
        <div className="kicker">Percorsi</div>
        <h1>Itinerari BIMARIS</h1>
        <p>Esplora Messina attraverso percorsi già disponibili oppure scegli gli itinerari esperienziali BIMARIS man mano che vengono verificati e pubblicati.</p>
      </section>

      <section className="section bimaris-ambient-section">
        <div className="section-head">
          <div><div className="kicker">Due modi di esplorare</div><h2>Scegli il percorso che fa per te.</h2></div>
          <p>I percorsi storici sono già costruiti a partire dai luoghi culturali pubblicati. Gli itinerari esperienziali collegano invece cultura, storie, esperienze e operatori e vengono pubblicati solo dopo la verifica delle singole tappe.</p>
        </div>

        <div className="cards" style={{ marginBottom: 34 }}>
          <article className="card"><div className="card-body"><div className="eyebrow">Già disponibili</div><h3>Percorsi storici</h3><p>Scegli un'epoca e percorri Messina attraverso i monumenti già selezionati e ordinati da BIMARIS.</p><Link className="text-link" href="/mappa/epoche">Esplora i percorsi storici →</Link></div></article>
          <article className="card"><div className="card-body"><div className="eyebrow">Percorso personale</div><h3>Crea il tuo itinerario</h3><p>Usa BIMARIS Map per combinare liberamente monumenti, storie, borghi, esperienze e operatori.</p><Link className="text-link" href="/mappa">Apri BIMARIS Map →</Link></div></article>
        </div>

        {itineraries.length > 0 ? (
          <div className="cards">
            {itineraries.map(itinerary => (
              <article className="card" key={itinerary.id}>
                <div className="card-media" style={itinerary.imageUrl ? { minHeight: 230, backgroundImage: `linear-gradient(rgba(7,24,35,.08),rgba(7,24,35,.44)), url(${itinerary.imageUrl})`, backgroundSize: "cover", backgroundPosition: "center" } : undefined}><span>{itinerary.featured ? "In evidenza" : "Itinerario"}</span></div>
                <div className="card-body"><div className="eyebrow">{itinerary.territory ?? "Messina"}</div><h3>{itinerary.title}</h3><p>{itinerary.excerpt}</p><div className="meta-row"><span>{itinerary.duration}</span><span>{itinerary.stops.length} {itinerary.stops.length === 1 ? "tappa" : "tappe"}</span>{itinerary.target && <span>{itinerary.target}</span>}</div><Link className="text-link" href={`/itinerari/${itinerary.slug}`}>Apri il percorso →</Link></div>
              </article>
            ))}
          </div>
        ) : (
          <div className="detail-panel"><div className="kicker">Itinerari esperienziali</div><h3>I primi itinerari esperienziali BIMARIS sono in preparazione.</h3><p>Nel frattempo puoi già esplorare i percorsi storici oppure costruire il tuo itinerario direttamente dalla mappa.</p><div className="actions"><Link className="button" href="/mappa/epoche">Percorsi storici</Link><Link className="button ghost" href="/mappa">Crea il tuo percorso</Link></div></div>
        )}
      </section>
    </>
  );
}
