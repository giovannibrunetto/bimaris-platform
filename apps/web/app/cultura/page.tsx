import type { Metadata } from "next";
import Link from "next/link";
import { getPublishedCultureEntries } from "@/data/live";
import { historicalPeriodLabel } from "@/lib/historical-periods";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export const metadata: Metadata = {
  title: "Cultura a Messina | BIMARIS",
  description: "Scopri monumenti, chiese, fontane, musei e luoghi culturali di Messina, con schede dedicate e percorsi storici.",
};

export default async function CulturePage() {
  const entries = await getPublishedCultureEntries();
  const orderedEntries = [...entries].sort((a, b) => {
    const yearA = a.historicalSortYear ?? 9999;
    const yearB = b.historicalSortYear ?? 9999;
    if (yearA !== yearB) return yearA - yearB;
    return a.title.localeCompare(b.title, "it");
  });

  return (
    <>
      <section className="page-hero discovery-page-hero">
        <div className="kicker">Scopri Messina</div>
        <h1>Cultura</h1>
        <p>
          Monumenti, architetture, musei e luoghi che raccontano Messina. Esplora liberamente le schede oppure scegli un percorso storico già costruito.
        </p>
      </section>

      <section className="section culture-editorial-section discovery-page-first">
        <div className="culture-editorial-card culture-editorial-card-featured">
          <div className="culture-editorial-copy">
            <div className="kicker">Messina nel tempo</div>
            <h2>Vuoi seguire la storia della città?</h2>
            <Link className="text-link" href="/mappa/epoche">Scopri i percorsi storici →</Link>
          </div>
          <p>
            I percorsi storici raccolgono i monumenti per epoca e aprono direttamente l&apos;itinerario dedicato, senza aggiungere altri filtri alla pagina Cultura.
          </p>
        </div>
      </section>

      <section className="section culture-places-section">
        <div className="culture-editorial-card culture-editorial-card-light">
          <div className="culture-editorial-copy">
            <div className="kicker">Luoghi da scoprire</div>
            <h2>Monumenti e cultura.</h2>
          </div>
          <p>
            Tutti i luoghi culturali selezionati da BIMARIS in un unico spazio. Apri una scheda per conoscere il luogo e raggiungerlo.
          </p>
        </div>

        <div className="cards">
          {orderedEntries.map(entry => (
            <article className="card culture-card" key={entry.id}>
              <Link className="culture-card-link" href={`/cultura/${entry.slug}`}>
                <div className="culture-card-media">
                  {entry.imageUrl ? (
                    <img
                      src={entry.imageUrl}
                      alt={entry.imageAlt ?? entry.title}
                      loading="lazy"
                      decoding="async"
                    />
                  ) : (
                    <div className="culture-card-placeholder" />
                  )}
                  <span>{entry.category}</span>
                </div>
                <div className="card-body">
                  <div className="eyebrow">
                    {entry.primaryHistoricalPeriod === "trasversale"
                      ? "Più epoche"
                      : historicalPeriodLabel(entry.primaryHistoricalPeriod)}
                  </div>
                  <h3>{entry.title}</h3>
                  <p>{entry.excerpt}</p>
                  <span className="text-link">Scopri il luogo →</span>
                </div>
              </Link>
              {entry.imageAuthor && entry.imageLicense && (
                <div className="photo-credit">
                  Foto: {entry.imageAuthor} · {entry.imageLicense}
                </div>
              )}
            </article>
          ))}
        </div>
      </section>

      <section className="section dark">
        <div className="section-head">
          <div>
            <div className="kicker">Esplora</div>
            <h2>Guarda i luoghi sulla mappa.</h2>
          </div>
          <p>Apri la mappa generale di BIMARIS per vedere i punti di interesse e costruire il tuo percorso personale.</p>
        </div>
        <Link className="button" href="/mappa">Apri la mappa BIMARIS</Link>
      </section>
    </>
  );
}
