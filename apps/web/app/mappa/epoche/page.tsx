import type { Metadata } from "next";
import Link from "next/link";
import { getPublishedCultureEntries } from "@/data/live";
import { CULTURE_STORIES } from "@/data/ti-racconto-messina";
import "./storytelling.css";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export const metadata: Metadata = {
  title: "Ti racconto Messina | BIMARIS",
  description: "Tre racconti per conoscere Messina attraverso i luoghi del catalogo Cultura BIMARIS.",
};

export default async function HistoricalMapPage() {
  const entries = await getPublishedCultureEntries();
  const bySlug = new Map(entries.map(entry => [entry.slug, entry]));
  const stories = CULTURE_STORIES.map(story => ({
    ...story,
    places: story.chapters.map(chapter => bySlug.get(chapter.slug)).filter((entry): entry is NonNullable<typeof entry> => Boolean(entry)),
  })).filter(story => story.places.length === story.chapters.length);

  return (
    <div className="storytelling-page">
      <section className="page-hero bimaris-ambient-hero storytelling-hero">
        <div className="kicker">Ti racconto Messina</div>
        <h1>Ogni luogo è un pezzo di una storia più grande.</h1>
        <p>Non scegliere soltanto cosa vedere. Scegli quale Messina vuoi conoscere: BIMARIS collega eventi, epoche e luoghi per accompagnarti dentro la storia della città.</p>
      </section>

      <section className="section bimaris-ambient-section storytelling-intro">
        <div className="storytelling-intro-copy">
          <div><div className="kicker">Da dove vuoi cominciare?</div><h2>Scegli un racconto.</h2></div>
          <p>Tre racconti pilota, costruiti su undici capitoli e dieci luoghi del catalogo Cultura. L’ordine è narrativo: non è un itinerario pedonale.</p>
        </div>

        <div className="storytelling-grid">
          {stories.map((story,index)=><article className={`storytelling-card${index===0?" storytelling-card-featured":""}`} key={story.key}>
            <div className="storytelling-number">0{index+1}</div>
            <div className="kicker">{story.theme}</div>
            <h3>{story.title}</h3>
            <p>{story.subtitle}</p>
            <div className="storytelling-places">{story.chapters.map(chapter=><span key={chapter.slug}>{chapter.placeTitle}</span>)}</div>
            <Link className="text-link" href={`/mappa/epoche/${story.key}`}>Entra nel racconto →</Link>
          </article>)}
        </div>
      </section>

      <section className="section dark storytelling-exit">
        <div className="section-head">
          <div><div className="kicker">Preferisci scegliere tu?</div><h2>Esplora Messina liberamente.</h2></div>
          <p>Puoi lasciare il racconto in qualsiasi momento e tornare ai singoli monumenti oppure alla mappa generale BIMARIS.</p>
        </div>
        <div className="actions"><Link className="button" href="/cultura/monumenti">Esplora i monumenti</Link><Link className="button ghost" href="/mappa">Apri la mappa BIMARIS</Link></div>
      </section>
    </div>
  );
}
