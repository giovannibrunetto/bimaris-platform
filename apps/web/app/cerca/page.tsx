import Link from "next/link";
import { createUserServerClient } from "@/lib/supabase/user-server";
import { getPublishedAppointments } from "@/data/public-appointments";
import { getPublishedCultureEntries, getPublishedExperiences } from "@/data/live";
import { getPublishedVillages } from "@/data/villages";
import { getPublishedStories } from "@/data/stories";
import { rankTerritorySearch, type SearchItem } from "@/lib/territory-search";
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
    ...culture.map((item): SearchItem => ({ title: item.title, description: item.excerpt, keywords: `cultura ${item.category ?? ""} ${item.address ?? ""}`, href: `/cultura/${item.slug}`, kind: "Luoghi" })),
    ...villages.map((item): SearchItem => ({ title: item.name, description: item.excerpt, keywords: `borgo ${item.territory?.name ?? ""} ${item.address ?? ""}`, href: `/borghi/${item.slug}`, kind: "Luoghi" })),
    ...stories.map((item): SearchItem => ({ title: item.title, description: item.excerpt, keywords: item.places.map(place => place.name).join(" "), href: `/storie-miti-leggende/${item.slug}`, kind: "Luoghi" })),
    ...experiences.map((item): SearchItem => ({ title: item.name, description: item.excerpt, keywords: `${item.categoryName} ${item.meetingPoint ?? ""}`, href: `/esperienze/${item.slug}`, kind: "Esperienze" })),
    ...appointments.map((item): SearchItem => ({ title: item.title, description: item.location, keywords: "evento appuntamento", href: item.sourceUrl ?? "/esperienze?tipo=appuntamenti", startsAt: item.startsAt, kind: "Appuntamenti" })),
  ];
  const matches = rankTerritorySearch(query, catalog);
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
            <ul>{group.entries.map(({ item, dateUnconfirmed }) =>
              <li key={`${item.href}:${item.title}:${item.startsAt ?? ""}`}>
                <small>{item.kind}</small>
                <h3><Link href={item.href}>{item.title}</Link></h3>
                {item.description && <p>{item.description}</p>}
                {item.startsAt && <p><time dateTime={item.startsAt}>{dateFormat.format(new Date(item.startsAt))}</time></p>}
                {dateUnconfirmed && <p>Disponibilità per il giorno richiesto da verificare.</p>}
              </li>
            )}</ul>
          </section>
        )}
        {matches.length === 0 && <section>
          <h2>Nessuna proposta utile per questa ricerca</h2>
          <p>Prova a indicare il nome di un luogo o a semplificare la frase.</p>
          <Link href="/cosa-faccio-oggi">Prova con i filtri →</Link>
        </section>}
        <nav aria-label="Continua a esplorare"><Link href="/mappa">Esplora la mappa</Link><Link href="/esperienze?tipo=appuntamenti">Vedi gli appuntamenti</Link></nav>
        {!claims?.data?.claims?.sub && <section className="territory-search-registration">
          <h2>E se BIMARIS si ricordasse di ciò che ti piace?</h2>
          <p>Salva ciò che ti interessa, ritrova le tue scoperte e personalizza il tuo modo di vivere Messina.</p>
          <Link href="/accedi/utente">Crea il tuo spazio BIMARIS →</Link>
        </section>}
      </div>}
    </main>
  );
}
