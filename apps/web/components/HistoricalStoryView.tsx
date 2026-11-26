import Link from "next/link";
import { editorialCoverUrl } from "@/lib/editorial-media";
import type { CultureEntry } from "@/lib/types";
import type { CultureStory } from "@/data/ti-racconto-messina";

export default function HistoricalStoryView({ definition, entries, preview = false }: {
  definition: CultureStory;
  entries: CultureEntry[];
  preview?: boolean;
}) {
  const bySlug = new Map(entries.map(entry => [entry.slug, entry]));
  const chapters = definition.chapters.map(chapter => ({ chapter, place: chapter.slug ? bySlug.get(chapter.slug) : undefined }));
  const cover = definition.cover;
  const coverUrl = cover && editorialCoverUrl(cover, preview);
  return <div className="story-detail-page">
    <section className="page-hero bimaris-ambient-hero story-detail-hero">
      {!preview && <Link className="story-back" href="/ti-racconto-la-storia-di-messina">← Ti racconto la storia di Messina</Link>}
      <div className="kicker">{definition.theme}</div>
      <h1>{definition.title}</h1>
      <p className="story-detail-subtitle">{definition.subtitle}</p>
    </section>

    <section className="section bimaris-ambient-section story-detail-opening">
      <div className="kicker">Il racconto</div>
      {cover && coverUrl && <figure>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={coverUrl} alt={cover.alt ?? definition.title} loading="lazy" decoding="async" style={{ maxWidth: "100%" }} />
        {(cover.author || cover.license || cover.source || cover.licenseUrl) && <figcaption>
          {[cover.author, cover.license].filter(Boolean).join(" · ")}
          {cover.source && <> · <a href={cover.source}>Fonte</a></>}
          {cover.licenseUrl && <> · <a href={cover.licenseUrl}>Licenza</a></>}
        </figcaption>}
      </figure>}
      <div className="story-public-copy">{definition.intro.map((paragraph,index)=><p key={index}>{paragraph}</p>)}</div>
    </section>

    <section className="story-chapters">
      {chapters.map(({chapter,place})=>{
        return <div className="story-chapter-block" key={chapter.number}>
          <article className="story-chapter">
            <div className="story-chapter-number">{String(chapter.number).padStart(2,"0")}</div>
            <div className="story-chapter-copy">
              <div className="kicker">Capitolo {chapter.number}{chapter.placeTitle ? ` · ${chapter.placeTitle}` : ""}</div>
              <h2>{chapter.title}</h2>
              <div className="story-public-copy story-chapter-text">{chapter.paragraphs.map((paragraph,pIndex)=><p key={pIndex}>{paragraph}</p>)}</div>
              {place && <div className="story-chapter-actions">
                <Link className="text-link" href={`/cultura/${place.slug}`}>Scopri il luogo →</Link>
                {place.googleMapsQuery && <a className="text-link story-map-link" href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(place.googleMapsQuery)}`} target="_blank" rel="noreferrer">Trovalo sulla mappa ↗</a>}
              </div>}
            </div>
            {place?.imageUrl && <Link className="story-chapter-media" href={`/cultura/${place.slug}`}><img src={place.imageUrl} alt={place.imageAlt??place.title} loading="lazy" decoding="async"/></Link>}
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
        {Boolean(definition.sources?.length) && <section>
          <h3>Fonti e riferimenti</h3>
          <ul>{definition.sources?.map((source, index) => <li key={index}>
            {source.url ? <a href={source.url}>{source.label}</a> : source.label}
            {source.note && <> · {source.note}</>}
          </li>)}</ul>
        </section>}
      </div>
      {!preview && <div className="actions"><Link className="button" href="/mappa">Vedi Messina sulla mappa</Link><Link className="button ghost" href="/ti-racconto-la-storia-di-messina">Scegli un altro racconto</Link></div>}
    </section>
  </div>;
}

