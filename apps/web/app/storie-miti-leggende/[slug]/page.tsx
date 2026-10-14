import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getPublishedStoryBySlug } from "@/data/stories";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const story = await getPublishedStoryBySlug(slug);

  if (!story) return {};

  return {
    title: `${story.title} | Miti e leggende di Messina | BIMARIS`,
    description: story.excerpt,
    openGraph: story.imageUrl ? { images: [story.imageUrl] } : undefined,
  };
}

export default async function StoryDetailPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const story = await getPublishedStoryBySlug(slug);

  if (!story) notFound();

  const paragraphs = story.body.split(/\n\n+/).filter(Boolean);

  return (
    <>
      <section className="page-hero">
        <div className="kicker">{story.storyType} · Messina e lo Stretto</div>
        <h1>{story.title}</h1>
        <p>{story.excerpt}</p>
      </section>

      {story.imageUrl && (
        <section className="culture-hero-wrap">
          <figure className="culture-hero-figure">
            <img src={story.imageUrl} alt={story.imageAlt ?? story.title} decoding="async" />
            {(story.imageAuthor || story.imageLicense) && (
              <figcaption>
                Foto: {story.imageAuthor ?? "Wikimedia Commons"}
                {story.imageLicense && <> · {story.imageLicense}</>}
                {story.imageSourceUrl && (
                  <> · <a href={story.imageSourceUrl} target="_blank" rel="noreferrer">fonte</a></>
                )}
                {story.imageLicenseUrl && (
                  <> · <a href={story.imageLicenseUrl} target="_blank" rel="noreferrer">licenza</a></>
                )}
              </figcaption>
            )}
          </figure>
        </section>
      )}

      <section className="section detail-grid">
        <article>
          <div className="kicker">Il racconto</div>
          <h2 style={{ fontFamily: "Georgia,serif", fontSize: 42, marginTop: 8 }}>Tra storia e leggenda</h2>
          {paragraphs.map((paragraph, index) => (
            <p key={index} style={{ fontSize: 18, lineHeight: 1.75, color: "#4d5962" }}>
              {paragraph}
            </p>
          ))}

          {story.sourceUrl && (
            <p style={{ marginTop: 28 }}>
              <a className="text-link" href={story.sourceUrl} target="_blank" rel="noreferrer">
                Fonte di approfondimento: {story.sourceLabel ?? "Approfondimento"} →
              </a>
            </p>
          )}
        </article>

        <aside className="detail-panel">
          <div className="kicker">Sui luoghi della storia</div>
          <h3>Visita i luoghi della leggenda</h3>

          {story.places.length > 0 ? (
            <ul className="list">
              {story.places.map(place => {
                const directionsUrl = `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(place.googleMapsQuery)}`;

                return (
                  <li key={`${place.position}-${place.googleMapsQuery}`}>
                    <strong>{place.label ?? place.name}</strong>
                    {place.address && <><br />{place.address}</>}
                    {place.note && <><br /><span className="muted">{place.note}</span></>}
                    <div style={{ marginTop: 12 }}>
                      <a className="text-link" href={directionsUrl} target="_blank" rel="noreferrer">
                        Come arrivare con Google Maps →
                      </a>
                    </div>
                  </li>
                );
              })}
            </ul>
          ) : (
            <p className="muted">I luoghi collegati a questa storia sono in preparazione.</p>
          )}

          <div className="actions" style={{ marginTop: 22 }}>
            <Link className="button" href="/mappa">Apri la mappa BIMARIS</Link>
            <Link className="button ghost" href="/storie-miti-leggende">Torna alle storie</Link>
          </div>
        </aside>
      </section>
    </>
  );
}
