import type { Metadata } from "next";
import Link from "next/link";
import { getPublishedCultureEntries } from "@/data/live";
import { getPublishedHistoricalStories } from "@/data/historical-editorial";
import "./storytelling.css";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export const metadata: Metadata = {
  title: "Ti racconto la storia di Messina | BIMARIS",
  description: "Racconti per conoscere Messina attraverso i luoghi del catalogo Cultura BIMARIS.",
};

const STORY_CHOICE_PERIODS: Record<string, string> = {
  medioevo: "Messina medievale · XII–XIII secolo",
  cinquecento: "Messina rinascimentale · XVI secolo",
  "1908-rinascita": "Terremoto e ricostruzione · 1908–1943",
};

export default async function HistoricalMapPage() {
  const [entries, definitions] = await Promise.all([getPublishedCultureEntries(), getPublishedHistoricalStories()]);
  const bySlug = new Map(entries.map(entry => [entry.slug, entry]));
  const stories = definitions.map(story => {
    const resolvedChapters = story.chapters.map(chapter => ({ chapter, place: chapter.slug ? bySlug.get(chapter.slug) : undefined }));
    const hasInvalidSlug = resolvedChapters.some(({ chapter, place }) => chapter.slug && !place);
    return {
      ...story,
      hasInvalidSlug,
      places: resolvedChapters.map(item => item.place).filter((entry): entry is NonNullable<typeof entry> => Boolean(entry)),
    };
  }).filter(story => !story.hasInvalidSlug);

  return (
    <div className="storytelling-page">
      <section className="ux-brand-05-hero ux-brand-05-hero--compact">
        <h1>Ti racconto la storia di Messina</h1>
        <p>Non scegliere soltanto cosa vedere. Scegli quale Messina vuoi conoscere: BIMARIS collega eventi, epoche e luoghi per accompagnarti dentro la storia della città.</p>
      </section>

      <section className="section bimaris-ambient-section storytelling-intro">
        <div className="storytelling-intro-copy">
          <div><div className="kicker">Da dove vuoi cominciare?</div><h2 className="public-discovery-section-title">Scegli un racconto</h2></div>
          <p>Scegli l’epoca che vuoi conoscere. I luoghi e i capitoli ti accompagneranno dentro il racconto.</p>
        </div>

        <div className="storytelling-grid">
          {stories.map((story,index)=><Link className="storytelling-card public-discovery-card" href={`/ti-racconto-la-storia-di-messina/${story.key}`} key={story.key} aria-label={`Entra nel racconto: ${story.title}`}>
            <div className="storytelling-number">{String(index + 1).padStart(2, "0")}</div>
            <div className="kicker">{STORY_CHOICE_PERIODS[story.key] ?? story.theme}</div>
            <h3>{story.title}</h3>
            <p className="storytelling-card-summary">{story.subtitle}</p>
            <span className="text-link" aria-hidden="true">Entra nel racconto →</span>
          </Link>)}
        </div>
      </section>

      <section className="section dark storytelling-exit">
        <div className="storytelling-exit-copy">
          <div><div className="kicker">Esplora liberamente</div><h2>Preferisci scegliere tu?</h2></div>
          <p>Vai ai monumenti o apri la mappa.</p>
        </div>
        <div className="actions"><Link className="button" href="/cultura/monumenti">Monumenti</Link><Link className="button ghost" href="/mappa">Mappa BIMARIS</Link></div>
      </section>
    </div>
  );
}
