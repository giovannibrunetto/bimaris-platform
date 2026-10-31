import type { Metadata } from "next";
import Link from "next/link";
import { getPublishedCultureEntries } from "@/data/live";
import { historicalPeriodLabel } from "@/lib/historical-periods";
import "./culture-compact.css";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export const metadata: Metadata = {
  title: "Cultura a Messina | BIMARIS",
  description: "Lasciati raccontare Messina attraverso epoche e storie collegate, oppure esplora monumenti, musei e luoghi culturali selezionati da BIMARIS.",
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
    <div className="culture-page">
      <section className="page-hero discovery-page-hero">
        <div className="kicker">Scopri Messina</div>
        <h1>Cultura</h1>
        <p>
          Non solo luoghi da visitare. Scegli se farti accompagnare nella storia di Messina oppure esplorare liberamente monumenti, musei e architetture della città.
        </p>
      </section>

      <div className="culture-entry-zone">
        <section className="section culture-entry-section discovery-page-first">
          <div className="culture-entry-head">
            <div>
              <div className="kicker">Due modi di scoprire la città</div>
              <h2>Da dove vuoi iniziare?</h2>
            </div>
            <p>BIMARIS può raccontarti Messina collegando luoghi e periodi storici, oppure lasciarti libero di scegliere direttamente cosa approfondire.</p>
          </div>

          <div className="culture-entry-grid">
            <article className="culture-entry-card culture-entry-card-story">
              <div className="culture-entry-number">01</div>
              <div className="kicker">L'esperienza editoriale BIMARIS</div>
              <h2>Ti racconto Messina</h2>
              <p>
                Entra nella storia della città per epoche e temi. I monumenti non sono più schede isolate: diventano tappe di un racconto che mostra come Messina si è trasformata nel tempo.
              </p>
              <Link className="button" href="/mappa/epoche">Inizia il racconto →</Link>
            </article>

            <article className="culture-entry-card culture-entry-card-places">
              <div className="culture-entry-number">02</div>
              <div className="kicker">Esplorazione libera</div>
              <h2>Esplora i monumenti</h2>
              <p>
                Consulta direttamente tutti i luoghi culturali selezionati da BIMARIS e apri la scheda del monumento, museo o architettura che vuoi conoscere.
              </p>
              <a className="button ghost" href="#monumenti">Esplora i luoghi →</a>
            </article>
          </div>
        </section>

        <section className="section culture-places-section" id="monumenti">
          <div className="culture-places-heading">
            <div>
              <div className="kicker">Monumenti e cultura</div>
              <h2>Esplora i luoghi di Messina.</h2>
            </div>
            <p>Scegli liberamente un luogo. Ogni scheda ne racconta la storia e ti permette di continuare l'esplorazione nella città.</p>
          </div>

          <div className="cards">
            {orderedEntries.map(entry => (
              <article className="card culture-card" key={entry.id}>
                <Link className="culture-card-link" href={`/cultura/${entry.slug}`}>
                  <div className="culture-card-media">
                    {entry.imageUrl ? (
                      <img src={entry.imageUrl} alt={entry.imageAlt ?? entry.title} loading="lazy" decoding="async" />
                    ) : (
                      <div className="culture-card-placeholder" />
                    )}
                    <span>{entry.category}</span>
                  </div>
                  <div className="card-body">
                    <div className="eyebrow">{entry.primaryHistoricalPeriod === "trasversale" ? "Più epoche" : historicalPeriodLabel(entry.primaryHistoricalPeriod)}</div>
                    <h3>{entry.title}</h3>
                    <p>{entry.excerpt}</p>
                    <span className="text-link">Scopri il luogo →</span>
                  </div>
                </Link>
                {entry.imageAuthor && entry.imageLicense && <div className="photo-credit">Foto: {entry.imageAuthor} · {entry.imageLicense}</div>}
              </article>
            ))}
          </div>
        </section>
      </div>

      <section className="section dark culture-explore-section">
        <div className="section-head">
          <div><div className="kicker">Esplora sulla mappa</div><h2>Guarda dove nasce la storia.</h2></div>
          <p>Passa dalla lettura al territorio: visualizza i luoghi culturali sulla BIMARIS Map e costruisci liberamente il tuo percorso.</p>
        </div>
        <Link className="button" href="/mappa">Apri la mappa BIMARIS</Link>
      </section>
    </div>
  );
}