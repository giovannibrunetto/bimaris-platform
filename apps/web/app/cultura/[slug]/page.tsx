import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getPublishedCultureEntryBySlug } from "@/data/live";

export const revalidate = 300;

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const entry = await getPublishedCultureEntryBySlug(slug);

  if (!entry) return {};

  return {
    title: `${entry.title} | Cultura a Messina | BIMARIS`,
    description: entry.excerpt,
    openGraph: entry.imageUrl ? { images: [entry.imageUrl] } : undefined,
  };
}

export default async function CultureDetailPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const entry = await getPublishedCultureEntryBySlug(slug);

  if (!entry) notFound();

  const directionsUrl = `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(entry.googleMapsQuery)}`;

  return (
    <>
      <section className="page-hero">
        <div className="kicker">Cultura · {entry.category}</div>
        <h1>{entry.title}</h1>
        <p>{entry.excerpt}</p>
      </section>

      {entry.imageUrl && (
        <section className="culture-hero-wrap">
          <figure className="culture-hero-figure">
            <img src={entry.imageUrl} alt={entry.imageAlt ?? entry.title} decoding="async" />
            {(entry.imageAuthor || entry.imageLicense) && (
              <figcaption>
                Foto: {entry.imageAuthor ?? "Wikimedia Commons"}
                {entry.imageLicense && <> · {entry.imageLicense}</>}
                {entry.imageSourceUrl && (
                  <> · <a href={entry.imageSourceUrl} target="_blank" rel="noreferrer">fonte</a></>
                )}
                {entry.imageLicenseUrl && (
                  <> · <a href={entry.imageLicenseUrl} target="_blank" rel="noreferrer">licenza</a></>
                )}
              </figcaption>
            )}
          </figure>
        </section>
      )}

      <section className="section detail-grid">
        <article>
          <div className="kicker">La storia</div>
          <h2 style={{ fontFamily: "Georgia,serif", fontSize: 42, marginTop: 8 }}>Conosci il luogo</h2>
          <p style={{ fontSize: 18, lineHeight: 1.75, color: "#4d5962" }}>{entry.body}</p>

          {entry.sourceUrl && (
            <p style={{ marginTop: 26 }}>
              <a className="text-link" href={entry.sourceUrl} target="_blank" rel="noreferrer">
                Fonte: {entry.sourceLabel ?? "Approfondimento istituzionale"} →
              </a>
            </p>
          )}
        </article>

        <aside className="detail-panel">
          <div className="kicker">Visita</div>
          <h3>{entry.placeName}</h3>
          <ul className="list">
            {entry.address && <li><strong>Indirizzo</strong><br />{entry.address}</li>}
            <li><strong>Destinazione</strong><br />Messina</li>
          </ul>
          <div className="actions" style={{ marginTop: 20 }}>
            <a className="button" href={directionsUrl} target="_blank" rel="noreferrer">Come arrivare con Google Maps</a>
            <Link className="button ghost" href="/cultura">Torna a Cultura</Link>
          </div>
        </aside>
      </section>
    </>
  );
}
