import type { Metadata } from "next";
import Link from "next/link";
import { getPublishedCultureEntries } from "@/data/live";
import { historicalPeriodLabel } from "@/lib/historical-periods";
import "../culture-compact.css";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export const metadata: Metadata = {
  title: "Monumenti e luoghi culturali di Messina | BIMARIS",
  description: "Esplora liberamente monumenti, musei, architetture e luoghi culturali di Messina selezionati da BIMARIS.",
};

export default async function CultureMonumentsPage() {
  const entries = await getPublishedCultureEntries();
  const orderedEntries = [...entries].sort((a, b) => {
    const yearA = a.historicalSortYear ?? 9999;
    const yearB = b.historicalSortYear ?? 9999;
    if (yearA !== yearB) return yearA - yearB;
    return a.title.localeCompare(b.title, "it");
  });

  return (
    <div className="culture-page culture-monuments-page">
      <section className="page-hero discovery-page-hero">
        <h1>Esplora i monumenti</h1>
        <p>Scegli liberamente un luogo culturale di Messina. Ogni scheda ne racconta la storia e ti permette di continuare l'esplorazione nella città.</p>
        <Link className="text-link" href="/cultura">← Torna a Cultura</Link>
      </section>

      <div className="culture-entry-zone">
        <section className="section culture-places-section">
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
    </div>
  );
}