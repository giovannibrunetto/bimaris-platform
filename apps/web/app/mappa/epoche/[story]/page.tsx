import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getPublishedCultureEntries } from "@/data/live";
import { CULTURE_STORIES_BY_KEY } from "@/data/ti-racconto-messina";
import "../storytelling.css";
import "./story-detail.css";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export async function generateMetadata({ params }: { params: Promise<{ story: string }> }): Promise<Metadata> {
  const { story } = await params;
  const definition = CULTURE_STORIES_BY_KEY.get(story);
  if (!definition) return {};
  return { title: `${definition.title} | Ti racconto Messina | BIMARIS`, description: definition.subtitle };
}

export default async function StoryPage({ params }: { params: Promise<{ story: string }> }) {
  const { story } = await params;
  const definition = CULTURE_STORIES_BY_KEY.get(story);
  if (!definition) notFound();

  const entries = await getPublishedCultureEntries();
  const bySlug = new Map(entries.map(entry => [entry.slug, entry]));
  const chapters = definition.chapters.map(chapter => ({ chapter, place: bySlug.get(chapter.slug) }));
  if (chapters.some(item => !item.place)) notFound();

  return <div className="story-detail-page">
    <section className="page-hero bimaris-ambient-hero story-detail-hero">
      <Link className="story-back" href="/mappa/epoche">← Ti racconto Messina</Link>
      <div className="kicker">{definition.theme}</div>
      <h1>{definition.title}</h1>
      <p className="story-detail-subtitle">{definition.subtitle}</p>
    </section>

    <section className="section bimaris-ambient-section story-detail-opening">
      <div className="kicker">Il racconto</div>
      <div className="story-public-copy">{definition.intro.map((paragraph,index)=><p key={index}>{paragraph}</p>)}</div>
    </section>

    <section className="story-chapters">
      {chapters.map(({chapter,place},index)=>{
        const resolvedPlace=place!;
        return <div className="story-chapter-block" key={chapter.slug}>
          <article className="story-chapter">
            <div className="story-chapter-number">{String(chapter.number).padStart(2,"0")}</div>
            <div className="story-chapter-copy">
              <div className="kicker">Capitolo {chapter.number} · {chapter.placeTitle}</div>
              <h2>{chapter.title}</h2>
              <div className="story-public-copy story-chapter-text">{chapter.paragraphs.map((paragraph,pIndex)=><p key={pIndex}>{paragraph}</p>)}</div>
              <div className="story-chapter-actions">
                <Link className="text-link" href={`/cultura/${resolvedPlace.slug}`}>Scopri il luogo →</Link>
                {resolvedPlace.googleMapsQuery && <a className="text-link story-map-link" href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(resolvedPlace.googleMapsQuery)}`} target="_blank" rel="noreferrer">Trovalo sulla mappa ↗</a>}
              </div>
            </div>
            {resolvedPlace.imageUrl && <Link className="story-chapter-media" href={`/cultura/${resolvedPlace.slug}`}><img src={resolvedPlace.imageUrl} alt={resolvedPlace.imageAlt??resolvedPlace.title} loading="lazy" decoding="async"/></Link>}
          </article>
          {chapter.transition.length>0 && <aside className="story-transition" aria-label={`Transizione dal capitolo ${chapter.number} al capitolo ${chapter.number+1}`}>
            <div className="kicker">Il filo continua</div>
            <div>{chapter.transition.map((paragraph,tIndex)=><p key={tIndex}>{paragraph}</p>)}</div>
          </aside>}
        </div>;
      })}
    </section>

    <section className="section story-detail-closing">
      <div className="story-detail-closing-copy">
        <div className="kicker">Conclusione</div>
        <h2>{definition.title}</h2>
        <div className="story-public-copy">{definition.conclusion.map((paragraph,index)=><p key={index}>{paragraph}</p>)}</div>
      </div>
      <div className="actions"><Link className="button" href="/mappa">Vedi Messina sulla mappa</Link><Link className="button ghost" href="/mappa/epoche">Scegli un altro racconto</Link></div>
    </section>
  </div>;
}
