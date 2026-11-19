import type { Metadata } from "next";
import Link from "next/link";
import { ExperienceExplorer } from "@/components/ExperienceExplorer";
import { getPublishedExperiences } from "@/data/live";
import { getPublishedAppointments } from "@/data/public-appointments";
import { experienceCategories, isExperienceCategory } from "@/lib/experience-categories";
import "./experience-categories.css";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export const metadata: Metadata = {
  title: "Esperienze e appuntamenti a Messina | BIMARIS",
  description: "Scopri le esperienze proposte dagli operatori e gli appuntamenti verificati da BIMARIS a Messina e provincia.",
};

const views = [
  { value: "tutti", label: "Tutti", href: "/esperienze" },
  { value: "esperienze", label: "Esperienze", href: "/esperienze?tipo=esperienze" },
  { value: "appuntamenti", label: "Appuntamenti", href: "/esperienze?tipo=appuntamenti" },
] as const;

const appointmentDate = new Intl.DateTimeFormat("it-IT", {
  dateStyle: "long",
  timeStyle: "short",
  timeZone: "Europe/Rome",
});
const appointmentPrice = new Intl.NumberFormat("it-IT", { style: "currency", currency: "EUR" });

export default async function ExperiencesPage({ searchParams }: {
  searchParams?: Promise<{ categoria?: string; tipo?: string }>;
}) {
  const params = await searchParams;
  const initialCategory = isExperienceCategory(params?.categoria) ? params.categoria : "all";
  const selected = views.find(view => view.value === params?.tipo)?.value
    ?? (initialCategory === "all" ? "tutti" : "esperienze");
  const showExperiences = selected !== "appuntamenti";
  const showAppointments = selected !== "esperienze";
  const [experiences, appointments] = await Promise.all([
    showExperiences ? getPublishedExperiences() : Promise.resolve([]),
    showAppointments ? getPublishedAppointments() : Promise.resolve([]),
  ]);
  const availableCategories = new Set(experiences.map(experience => experience.category));

  return (
    <>
      <section className="ux-brand-05-hero ux-brand-05-hero--compact">
        <h1>Esperienze e appuntamenti</h1>
        <p>Trova attività proposte dagli operatori BIMARIS ed eventi verificati a Messina e provincia.</p>
      </section>

      <nav className="section experience-catalogue-nav" aria-label="Tipo di proposta">
        {views.map(view => <Link
          key={view.value}
          href={view.href}
          aria-current={selected === view.value ? "page" : undefined}
        >{view.label}</Link>)}
      </nav>

      {showAppointments && (
        <section className={`section experience-catalogue-section${appointments.length === 0 ? " experience-appointments-empty" : ""}`} aria-labelledby="public-appointments-heading">
          <div className="section-head">
            <h2 id="public-appointments-heading">Appuntamenti</h2>
            {appointments.length > 0 && <p>Eventi da fonti esterne, verificati prima della pubblicazione.</p>}
          </div>
          {appointments.length === 0 ? <p>Nessun appuntamento in programma.</p> : (
            <div className="cards">
              {appointments.map(item => <article className="card" key={item.id}>
                <div className="card-body">
                  <p><time dateTime={item.startsAt}>{appointmentDate.format(new Date(item.startsAt))}</time></p>
                  <h3>{item.title}</h3>
                  {item.location && <p>{item.location}</p>}
                  {item.price !== null && <p>{appointmentPrice.format(item.price)}</p>}
                  {item.sourceUrl && <a className="text-link" href={item.sourceUrl} target="_blank" rel="noopener noreferrer">Fonte originale ↗</a>}
                </div>
              </article>)}
            </div>
          )}
        </section>
      )}

      {showExperiences && <>
      <section className="section sand discovery-page-first experience-catalogue-section">
        <div className="section-head">
          <h2>Scegli una categoria</h2>
        </div>

        <div className="cards">
          {experienceCategories.map(category => (
            <Link
              className="card experience-category-card public-discovery-card"
              href={`/esperienze?tipo=esperienze&categoria=${encodeURIComponent(category.slug)}#esperienze-disponibili`}
              key={category.slug}
              aria-labelledby={`experience-category-${category.slug}`}
            >
              <div className="card-body">
                <div className="kicker">{availableCategories.has(category.slug) ? "Esperienze disponibili" : "Nessuna esperienza disponibile"}</div>
                <h3 id={`experience-category-${category.slug}`}>{category.title}</h3>
                <p>{category.text}</p>
                <span className="text-link" aria-hidden="true">
                  {availableCategories.has(category.slug) ? "Vedi le proposte" : "Apri la categoria"} →
                </span>
              </div>
            </Link>
          ))}
        </div>
      </section>
        <section className="section experience-catalogue-section" id="esperienze-disponibili" aria-labelledby="public-experiences-heading">
          <div className="section-head">
            <h2 id="public-experiences-heading">Esperienze</h2>
            <p>Attività proposte dagli operatori BIMARIS. Cerca per categoria e zona.</p>
          </div>
          <ExperienceExplorer experiences={experiences} initialCategory={initialCategory} />
          {experiences.length === 0 && <div className="actions">
            <Link className="text-link" href="/operatori/candidatura">Presenta la tua candidatura →</Link>
          </div>}
        </section>
      </>}
    </>
  );
}
