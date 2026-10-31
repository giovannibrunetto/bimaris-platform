import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getPublishedCultureEntries } from "@/data/live";
import "../storytelling.css";
import "./story-detail.css";

export const dynamic = "force-dynamic";
export const revalidate = 0;

type StoryDefinition = {
  kicker: string;
  title: string;
  intro: string;
  period?: string;
  slugs?: string[];
  opening: string;
  closing: string;
};

const STORIES: Record<string, StoryDefinition> = {
  medioevo: {
    kicker: "XI–XIII secolo",
    title: "La Messina medievale",
    intro: "Prima dei terremoti e delle grandi ricostruzioni, Messina era già una città proiettata sul Mediterraneo. Alcune architetture permettono ancora di attraversare quella storia.",
    period: "medioevo",
    opening: "Il racconto comincia dalle architetture che hanno attraversato i secoli. Non sono semplicemente monumenti della stessa epoca: ciascuna conserva una traccia diversa della città medievale.",
    closing: "Questi luoghi non ricostruiscono da soli tutta la Messina medievale. Insieme, però, rendono visibili alcune delle sue permanenze più importanti nel paesaggio urbano contemporaneo.",
  },
  cinquecento: {
    kicker: "XVI secolo",
    title: "La città del Cinquecento",
    intro: "Nel Cinquecento Messina rafforza le proprie difese e rinnova il proprio volto monumentale. Fortezze e fontane raccontano due dimensioni della stessa città mediterranea.",
    period: "rinascimento-cinquecento",
    opening: "La posizione sullo Stretto rende Messina strategica. Il rafforzamento militare convive con una stagione artistica capace di lasciare alla città opere monumentali ancora riconoscibili.",
    closing: "Difesa, acqua e rappresentazione pubblica convivono così nello stesso secolo. È una Messina che protegge il proprio porto e, nello stesso tempo, costruisce una nuova immagine di sé.",
  },
  "1908-rinascita": {
    kicker: "1908 · ricostruzione",
    title: "La città che rinasce",
    intro: "Il terremoto del 28 dicembre 1908 spezza la continuità urbana di Messina. La città che vediamo oggi nasce anche dalle scelte compiute negli anni della ricostruzione.",
    slugs: ["teatro-vittorio-emanuele-ii", "duomo-messina-tesoro-cattedrale", "galleria-vittorio-emanuele-iii", "campanile-orologio-astronomico-messina"],
    opening: "Per capire la ricostruzione bisogna guardare insieme ciò che sopravvisse, ciò che venne ricostruito e ciò che nacque nella nuova città. I luoghi diventano così capitoli consecutivi dello stesso evento.",
    closing: "Il 1908 non è quindi soltanto una data di distruzione. Attraverso questi luoghi si può leggere il passaggio dalla città perduta alla Messina ricostruita e ai nuovi simboli del Novecento.",
  },
};

export async function generateMetadata({ params }: { params: Promise<{ story: string }> }): Promise<Metadata> {
  const { story } = await params;
  const definition = STORIES[story];
  if (!definition) return {};
  return { title: `${definition.title} | Ti racconto Messina | BIMARIS`, description: definition.intro };
}

export default async function StoryPage({ params }: { params: Promise<{ story: string }> }) {
  const { story } = await params;
  const definition = STORIES[story];
  if (!definition) notFound();
  const entries = await getPublishedCultureEntries();
  const bySlug = new Map(entries.map(entry => [entry.slug, entry]));
  const places = definition.slugs
    ? definition.slugs.map(slug => bySlug.get(slug)).filter((entry): entry is NonNullable<typeof entry> => Boolean(entry))
    : entries.filter(entry => entry.historicalPeriods.includes(definition.period!)).sort((a,b)=>(a.historicalSortYear??9999)-(b.historicalSortYear??9999));
  if (places.length < 2) notFound();

  return <div className="story-detail-page">
    <section className="page-hero bimaris-ambient-hero story-detail-hero">
      <Link className="story-back" href="/mappa/epoche">← Ti racconto Messina</Link>
      <div className="kicker">{definition.kicker}</div>
      <h1>{definition.title}</h1>
      <p>{definition.intro}</p>
    </section>

    <section className="section bimaris-ambient-section story-detail-opening">
      <div className="kicker">Il racconto</div>
      <p>{definition.opening}</p>
    </section>

    <section className="story-chapters">
      {places.map((place,index)=><article className="story-chapter" key={place.id}>
        <div className="story-chapter-number">{String(index+1).padStart(2,"0")}</div>
        <div className="story-chapter-copy">
          <div className="kicker">Capitolo {index+1}</div>
          <h2>{place.title}</h2>
          <p>{place.excerpt}</p>
          <div className="story-chapter-actions">
            <Link className="text-link" href={`/cultura/${place.slug}`}>Scopri il luogo →</Link>
            {place.googleMapsQuery && <a className="text-link story-map-link" href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(place.googleMapsQuery)}`} target="_blank" rel="noreferrer">Trovalo sulla mappa ↗</a>}
          </div>
        </div>
        {place.imageUrl && <Link className="story-chapter-media" href={`/cultura/${place.slug}`}><img src={place.imageUrl} alt={place.imageAlt??place.title} loading="lazy" decoding="async"/></Link>}
      </article>)}
    </section>

    <section className="section story-detail-closing">
      <div className="story-detail-closing-copy"><div className="kicker">Il filo continua</div><h2>Una storia, molti luoghi.</h2><p>{definition.closing}</p></div>
      <div className="actions"><Link className="button" href="/mappa">Vedi Messina sulla mappa</Link><Link className="button ghost" href="/mappa/epoche">Scegli un altro racconto</Link></div>
    </section>
  </div>;
}
