import type { Metadata } from "next";
import Link from "next/link";
import { getPublishedCultureEntries } from "@/data/live";
import { HISTORICAL_PERIODS } from "@/lib/historical-periods";
import "./storytelling.css";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export const metadata: Metadata = {
  title: "Ti racconto Messina | BIMARIS",
  description: "Scopri Messina attraverso epoche, eventi e temi storici collegati ai luoghi culturali selezionati da BIMARIS.",
};

const MIN_PLACES_FOR_STORY = 2;

const featuredStories = [
  {
    key: "medioevo",
    kicker: "XI–XIII secolo",
    title: "La Messina medievale",
    text: "Chiese e architetture sopravvissute raccontano una città mediterranea cresciuta tra dominazioni, commerci e grandi fondazioni religiose.",
    period: "medioevo",
  },
  {
    key: "cinquecento",
    kicker: "XVI secolo",
    title: "La città del Cinquecento",
    text: "Fortificazioni, fontane monumentali e nuovi linguaggi artistici raccontano una Messina strategica nel Mediterraneo e protagonista del Rinascimento.",
    period: "rinascimento-cinquecento",
  },
  {
    key: "1908-rinascita",
    kicker: "1908 · ricostruzione",
    title: "La città che rinasce",
    text: "Il terremoto del 1908 cambia per sempre Messina. Alcuni luoghi sopravvivono, altri vengono ricostruiti e nuovi simboli urbani raccontano la rinascita della città.",
    slugs: [
      "teatro-vittorio-emanuele-ii",
      "duomo-messina-tesoro-cattedrale",
      "galleria-vittorio-emanuele-iii",
      "campanile-orologio-astronomico-messina",
    ],
  },
] as const;

export default async function HistoricalMapPage() {
  const entries = await getPublishedCultureEntries();
  const bySlug = new Map(entries.map(entry => [entry.slug, entry]));

  const stories = featuredStories.map(story => {
    const places = "slugs" in story
      ? story.slugs.map(slug => bySlug.get(slug)).filter((entry): entry is NonNullable<typeof entry> => Boolean(entry))
      : entries
          .filter(entry => entry.historicalPeriods.includes(story.period))
          .sort((a, b) => (a.historicalSortYear ?? 9999) - (b.historicalSortYear ?? 9999));
    return { ...story, places };
  }).filter(story => story.places.length >= MIN_PLACES_FOR_STORY);

  const otherPeriods = HISTORICAL_PERIODS
    .map(period => ({
      ...period,
      count: entries.filter(entry => entry.historicalPeriods.includes(period.key)).length,
    }))
    .filter(period => period.count >= MIN_PLACES_FOR_STORY && !["medioevo", "rinascimento-cinquecento"].includes(period.key));

  return (
    <div className="storytelling-page">
      <section className="page-hero bimaris-ambient-hero storytelling-hero">
        <div className="kicker">Ti racconto Messina</div>
        <h1>Ogni luogo è un pezzo di una storia più grande.</h1>
        <p>
          Non scegliere soltanto cosa vedere. Scegli quale Messina vuoi conoscere: BIMARIS collega eventi, epoche e luoghi per accompagnarti dentro la storia della città.
        </p>
      </section>

      <section className="section bimaris-ambient-section storytelling-intro">
        <div className="storytelling-intro-copy">
          <div className="kicker">Da dove vuoi cominciare?</div>
          <h2>Scegli un racconto.</h2>
          <p>Ogni racconto segue un filo storico preciso. I monumenti non sono tappe da completare: sono i luoghi attraverso cui la storia diventa visibile.</p>
        </div>

        <div className="storytelling-grid">
          {stories.map((story, index) => (
            <article className={`storytelling-card${index === 0 ? " storytelling-card-featured" : ""}`} key={story.key}>
              <div className="storytelling-number">0{index + 1}</div>
              <div className="kicker">{story.kicker}</div>
              <h3>{story.title}</h3>
              <p>{story.text}</p>
              <div className="storytelling-places">
                {story.places.slice(0, 4).map(place => <span key={place.id}>{place.title}</span>)}
              </div>
              <Link className="text-link" href={`/mappa/epoche/${story.key}`}>Entra nel racconto →</Link>
            </article>
          ))}
        </div>
      </section>

      {otherPeriods.length > 0 && (
        <section className="section storytelling-more">
          <div className="section-head">
            <div><div className="kicker">Messina nel tempo</div><h2>Altre epoche da esplorare.</h2></div>
            <p>La biblioteca narrativa crescerà insieme alla ricerca storica BIMARIS. Mostriamo un racconto solo quando i luoghi disponibili permettono di costruire un collegamento significativo.</p>
          </div>
          <div className="storytelling-periods">
            {otherPeriods.map(period => (
              <div className="storytelling-period" key={period.key}>
                <div><span>{period.range}</span><strong>{period.label}</strong></div>
                <p>{period.shortDescription}</p>
                <span className="storytelling-period-count">{period.count} luoghi collegati</span>
              </div>
            ))}
          </div>
        </section>
      )}

      <section className="section dark storytelling-exit">
        <div className="section-head">
          <div><div className="kicker">Preferisci scegliere tu?</div><h2>Esplora Messina liberamente.</h2></div>
          <p>Puoi lasciare il racconto in qualsiasi momento e tornare ai singoli monumenti oppure alla mappa generale BIMARIS.</p>
        </div>
        <div className="actions">
          <Link className="button" href="/cultura#monumenti">Esplora i monumenti</Link>
          <Link className="button ghost" href="/mappa">Apri la mappa BIMARIS</Link>
        </div>
      </section>
    </div>
  );
}
