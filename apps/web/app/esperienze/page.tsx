import type { Metadata } from "next";
import Link from "next/link";
import { ExperienceExplorer } from "@/components/ExperienceExplorer";
import { getPublishedExperiences } from "@/data/live";
import { experienceCategories, isExperienceCategory } from "@/lib/experience-categories";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export const metadata: Metadata = {
  title: "Esperienze a Messina | BIMARIS",
  description: "Esperienze selezionate a Messina e provincia: degustazioni, mare, avventura, trekking, visite guidate e laboratori scelti da BIMARIS.",
};

export default async function ExperiencesPage({ searchParams }: { searchParams?: Promise<{ categoria?: string }> }) {
  const experiences = await getPublishedExperiences();
  const availableCategories = new Set(experiences.map(experience => experience.category));
  const params = searchParams ? await searchParams : undefined;
  const requestedCategory = params?.categoria;
  const initialCategory = isExperienceCategory(requestedCategory)
    ? requestedCategory
    : "all";

  return (
    <>
      <section className="page-hero discovery-page-hero bimaris-ambient-hero">
        <h1>Esperienze BIMARIS</h1>
        <p>
          Non un elenco di attività, ma una selezione di modi autentici per vivere Messina e il suo territorio: mare, sapori, natura, cultura e saperi locali.
        </p>
      </section>

      <section className="section sand discovery-page-first">
        <div className="section-head">
          <div>
            <div className="kicker">Cosa vuoi fare?</div>
            <h2>Scegli come vivere il territorio.</h2>
          </div>
          <p>Esplora le categorie BIMARIS. Le proposte saranno visibili dopo la verifica e la pubblicazione delle singole esperienze.</p>
        </div>

        <div className="cards">
          {experienceCategories.map(category => (
            <article className="card" key={category.slug}>
              <div className="card-body">
                <div className="kicker">{availableCategories.has(category.slug) ? "Esperienze disponibili" : "Nessuna esperienza disponibile"}</div>
                <h3>{category.title}</h3>
                <p>{category.text}</p>
                <Link className="text-link" href={`/esperienze?categoria=${encodeURIComponent(category.slug)}#esperienze-disponibili`}>
                  {availableCategories.has(category.slug) ? "Vedi le proposte" : "Apri la categoria"} →
                </Link>
              </div>
            </article>
          ))}
        </div>
      </section>

      <section className="section" id="esperienze-disponibili">
        <div className="section-head">
          <div>
            <div className="kicker">Selezione BIMARIS</div>
            <h2>{experiences.length > 0 ? "Esperienze disponibili." : "La selezione delle esperienze."}</h2>
          </div>
          <p>{experiences.length > 0 ? "Filtra le proposte per categoria e territorio e scopri l'operatore che le realizza." : "Ogni esperienza sarà pubblicata solo dopo la verifica della realtà che la propone e della sua coerenza con il territorio."}</p>
        </div>

        <ExperienceExplorer experiences={experiences} initialCategory={initialCategory} />
        {experiences.length === 0 && (
          <div className="detail-panel">
            <div className="kicker">Prima della pubblicazione</div>
            <h3>Stiamo costruendo la rete di esperienze BIMARIS.</h3>
            <p>
              Le attività non vengono inserite automaticamente: selezioniamo operatori, produttori e realtà locali in base a qualità, autenticità e legame con Messina e il suo territorio.
            </p>
            <div className="actions">
              <Link className="button" href="/operatori/candidatura">Presenta la tua candidatura</Link>
            </div>
          </div>
        )}
      </section>
    </>
  );
}
