import Link from "next/link";
import { redirect } from "next/navigation";
import { ExperienceCard } from "@/components/ExperienceCard";
import { createUserServerClient } from "@/lib/supabase/user-server";
import { getPublishedAppointments } from "@/data/public-appointments";
import { getPublishedCultureEntries, getPublishedExperiences } from "@/data/live";
import { getPublishedVillages } from "@/data/villages";
import { getPublishedStories } from "@/data/stories";
import { rankTerritorySearch, suggestedDiscoveryIntents, type SearchItem } from "@/lib/territory-search";
import SearchForm from "./SearchForm";
import "./territory-search.css";

const dateFormat = new Intl.DateTimeFormat("it-IT", { dateStyle: "full", timeStyle: "short", timeZone: "Europe/Rome" });

export default async function SearchPage({ searchParams }: { searchParams: Promise<{ q?: string | string[] }> }) {
  const raw = (await searchParams).q;
  const query = (Array.isArray(raw) ? raw[0] : raw)?.trim().slice(0, 180) ?? "";
  const [culture, villages, stories, experiences, appointments] = query
    ? await Promise.all([getPublishedCultureEntries(), getPublishedVillages(), getPublishedStories(), getPublishedExperiences(), getPublishedAppointments()])
    : [[], [], [], [], []];
  const catalog: SearchItem[] = [
    ...culture.map((item): SearchItem => ({ title: item.title, description: item.excerpt, imageUrl: item.imageUrl, imageAlt: item.imageAlt, keywords: `cultura ${item.category ?? ""} ${item.address ?? ""}`, href: `/cultura/${item.slug}`, kind: "Luoghi" })),
    ...villages.map((item): SearchItem => ({ title: item.name, description: item.excerpt, imageUrl: item.imageUrl, imageAlt: item.imageAlt, keywords: `borgo ${item.territory?.name ?? ""} ${item.address ?? ""}`, href: `/borghi/${item.slug}`, kind: "Luoghi" })),
    ...stories.map((item): SearchItem => ({ title: item.title, description: item.excerpt, imageUrl: item.imageUrl, imageAlt: item.imageAlt, keywords: item.places.map(place => place.name).join(" "), href: `/storie-miti-leggende/${item.slug}`, kind: "Luoghi" })),
    ...experiences.map((item): SearchItem => ({ title: item.name, description: item.excerpt, keywords: `${item.categoryName} ${item.meetingPoint ?? ""}`, href: `/esperienze/${item.slug}`, kind: "Esperienze" })),
    ...appointments.map((item): SearchItem => ({ title: item.title, location: item.location, keywords: "evento appuntamento", href: item.sourceUrl ?? "/esperienze?tipo=appuntamenti", startsAt: item.startsAt, kind: "Appuntamenti" })),
  ];
  const matches = rankTerritorySearch(query, catalog);
  if (query && matches.length === 0) {
    const intents = suggestedDiscoveryIntents(query);
    const params = new URLSearchParams({ da: "ricerca" });
    if (intents.length) params.set("intent", intents.join(","));
    redirect(`/cosa-faccio-oggi?${params.toString()}`);
  }
  const experienceByHref = new Map(experiences.map(item => [`/esperienze/${item.slug}`, item]));
  const exact = matches.filter(match => !match.partial);
  const related = matches.filter(match => match.partial);
  const userClient = query ? await createUserServerClient() : null;
  const claims = await userClient?.auth.getClaims().catch(() => null);

  return (
    <main className="territory-search">
      <header className="territory-search-header">
        <h1>Che ti va di fare?</h1>
        <SearchForm query={query} />
      </header>
      {query && <div className="territory-search-results">
        {[{ title: "Risultati della ricerca", entries: exact }, { title: "Potrebbe interessarti", entries: related }].map(group =>
          group.entries.length > 0 && <section key={group.title}>
            <h2>{group.title}</h2>
            <ul>{group.entries.map(({ item, dateUnconfirmed }) => {
              const experience = experienceByHref.get(item.href);
              const availabilityNote = dateUnconfirmed ? "Disponibilità per il giorno richiesto da verificare." : undefined;
              return <li key={`${item.href}:${item.title}:${item.startsAt ?? ""}`}>
                {experience ? <ExperienceCard experience={experience} availabilityNote={availabilityNote} /> : (
                  <article className="card culture-card card-hit-area">
                    {item.imageUrl ? <div className="culture-card-media">
                      <img src={item.imageUrl} alt={item.imageAlt ?? ""} loading="lazy" decoding="async" />
                      <span>{item.kind}</span>
                    </div> : <div className="card-media territory-search-card-cover"><span>{item.kind}</span></div>}
                    <div className="card-body">
                      {item.location && <div className="eyebrow">{item.location}</div>}
                      <h3>{item.title}</h3>
                      {item.description && <p>{item.description}</p>}
                      {item.startsAt && <div className="meta-row"><time dateTime={item.startsAt}>{dateFormat.format(new Date(item.startsAt))}</time></div>}
                      {availabilityNote && <p>{availabilityNote}</p>}
                      <Link className="text-link card-primary-link" aria-label={`Scopri ${item.title}`} href={item.href}>Scopri di più →</Link>
                    </div>
                  </article>
                )}
              </li>;
            })}</ul>
          </section>
        )}
        <nav aria-label="Continua a esplorare"><Link href="/mappa">Esplora la mappa</Link><Link href="/esperienze?tipo=appuntamenti">Vedi gli appuntamenti</Link></nav>
        {!claims?.data?.claims?.sub && <section className="territory-search-registration">
          <h2>E se BIMARIS si ricordasse di ciò che ti piace?</h2>
          <p>Scopri esperienze e luoghi più vicini ai tuoi interessi. Salva ciò che ti piace e ritrova le tue scoperte.</p>
          <Link href="/accedi/utente">Personalizza BIMARIS <span aria-hidden="true">→</span></Link>
        </section>}
      </div>}
    </main>
  );
}
