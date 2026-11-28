import Link from "next/link";
import { ExperienceCard } from "@/components/ExperienceCard";
import { createUserServerClient } from "@/lib/supabase/user-server";
import { getPublishedAppointments } from "@/data/public-appointments";
import { getPublishedCultureEntries, getPublishedExperiences } from "@/data/live";
import { getPublishedVillages } from "@/data/villages";
import { getPublishedStories } from "@/data/stories";
import { rankTerritorySearch, searchInterestKeys, suggestedDiscoveryIntents, type SearchItem } from "@/lib/territory-search";
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
    ...culture.map((item): SearchItem => ({ title: item.title, description: item.excerpt, imageUrl: item.imageUrl, imageAlt: item.imageAlt, keywords: `cultura ${item.category ?? ""} ${item.address ?? ""}`, href: `/cultura/${item.slug}`, kind: "Luoghi", interestKeys: ["cultura"] })),
    ...villages.map((item): SearchItem => ({ title: item.name, description: item.excerpt, imageUrl: item.imageUrl, imageAlt: item.imageAlt, keywords: `borgo ${item.territory?.name ?? ""} ${item.address ?? ""}`, href: `/borghi/${item.slug}`, kind: "Luoghi", interestKeys: ["borghi"] })),
    ...stories.map((item): SearchItem => ({ title: item.title, description: item.excerpt, imageUrl: item.imageUrl, imageAlt: item.imageAlt, keywords: item.places.map(place => place.name).join(" "), href: `/storie-miti-leggende/${item.slug}`, kind: "Luoghi", interestKeys: ["miti-leggende"] })),
    ...experiences.map((item): SearchItem => ({ title: item.name, description: item.excerpt, keywords: `${item.categoryName} ${item.meetingPoint ?? ""}`, href: `/esperienze/${item.slug}`, kind: "Esperienze", interestKeys: ["esperienze", ({ degustazioni: "sapori", mare: "mare", avventura: "avventura", "trekking-natura": "natura-trekking" } as Record<string, string>)[item.category] ?? "esperienze"] })),
    ...appointments.map((item): SearchItem => ({ title: item.title, location: item.location, keywords: "evento appuntamento", href: item.sourceUrl ?? "/esperienze?tipo=appuntamenti", startsAt: item.startsAt, kind: "Appuntamenti" })),
  ];
  const userClient = query ? await createUserServerClient() : null;
  const claims = await userClient?.auth.getClaims().catch(() => null);
  const userId = claims?.data?.claims?.sub;
  let interests: ReadonlySet<string> = new Set();
  if (userClient && typeof userId === "string" && userId) {
    try {
      const { data, error } = await userClient.from("user_interests").select("interest_key,explicit_score").eq("user_id", userId);
      if (!error && data) interests = searchInterestKeys(data);
    } catch { /* Generic search remains available if preferences cannot be loaded. */ }
  }
  const matches = rankTerritorySearch(query, catalog, new Date(), interests);
  const discoveryParams = new URLSearchParams({ da: "ricerca" });
  const intents = suggestedDiscoveryIntents(query);
  if (intents.length) discoveryParams.set("intent", intents.join(","));
  const experienceByHref = new Map(experiences.map(item => [`/esperienze/${item.slug}`, item]));
  const exact = matches.filter(match => !match.partial);
  const related = matches.filter(match => match.partial);

  return (
    <main className="territory-search">
      <header className="territory-search-header">
        <h1>Che ti va di fare?</h1>
        <SearchForm query={query} />
      </header>
      {query && <div className="territory-search-results">
        {matches.length === 0 && <section><h2>Nessun risultato per questa ricerca</h2><p>Non abbiamo trovato contenuti corrispondenti. Prova altre parole oppure esplora le opportunità disponibili.</p><Link href={`/cosa-faccio-oggi?${discoveryParams.toString()}`}>Esplora altre idee</Link></section>}
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
          <p>Salva ciò che ti interessa, ritrova le tue scoperte e personalizza il tuo modo di vivere Messina.</p>
          <Link href="/accedi/utente">Crea il tuo spazio BIMARIS <span aria-hidden="true">→</span></Link>
        </section>}
      </div>}
    </main>
  );
}
