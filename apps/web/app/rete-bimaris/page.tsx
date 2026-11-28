import type { Metadata } from "next";
import Link from "next/link";
import { getPublishedOperators } from "@/data/operators";
import { getPublishedExperiences } from "@/data/live";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export const metadata: Metadata = {
  title: "Rete BIMARIS | Operatori ed esperienze a Messina",
  description: "Esplora le attività del territorio e le esperienze pubblicate nella rete BIMARIS a Messina e provincia.",
};

export default async function ReteBimarisPage() {
  const [operators, experiences] = await Promise.all([getPublishedOperators(), getPublishedExperiences()]);
  const visibleOperators = operators.slice(0, 6);
  const visibleExperiences = experiences.slice(0, 6);

  return (
    <main className="bimaris-network-page">
      <div className="bimaris-network-shell">
        <header className="bimaris-network-hero">
          <div className="bimaris-network-eyebrow">SCOPRI IL TERRITORIO · BIMARIS</div>
          <h1>La rete BIMARIS</h1>
          <p>Persone, attività ed esperienze da scoprire a Messina e provincia.</p>
          <nav className="bimaris-network-jump" aria-label="Esplora la rete">
            <a href="#operatori-bimaris">Operatori <span aria-hidden="true">↓</span></a>
            <a href="#esperienze-bimaris">Esperienze <span aria-hidden="true">↓</span></a>
          </nav>
        </header>

        <section className="bimaris-network-section" id="operatori-bimaris" aria-labelledby="bimaris-network-operators-title">
          <div className="bimaris-network-section-head">
            <div>
              <div className="bimaris-network-eyebrow">LE REALTÀ DEL TERRITORIO</div>
              <h2 id="bimaris-network-operators-title">Operatori BIMARIS</h2>
              <p>Conosci le attività presenti nella rete.</p>
            </div>
            <Link href="/operatori" className="bimaris-network-more">Tutti gli operatori <span aria-hidden="true">→</span></Link>
          </div>
          {visibleOperators.length ? (
            <div className="bimaris-network-grid">
              {visibleOperators.map(operator => (
                <Link key={operator.id} href={`/operatori/${operator.slug}`} className="bimaris-network-card">
                  {operator.imageUrl ? <div className="bimaris-network-card-media"><img src={operator.imageUrl} alt={operator.imageAlt ?? operator.name} loading="lazy" decoding="async" /></div> : <div className="bimaris-network-card-media bimaris-network-card-media--empty" aria-hidden="true">✦</div>}
                  <div className="bimaris-network-card-copy">
                    <div className="bimaris-network-card-kicker">{operator.category ?? "Operatore BIMARIS"}{operator.territoryName ? ` · ${operator.territoryName}` : ""}</div>
                    <h3>{operator.name}</h3>
                    <p>{operator.description}</p>
                    <span className="bimaris-network-card-cta">Scopri l'attività <span aria-hidden="true">→</span></span>
                  </div>
                </Link>
              ))}
            </div>
          ) : (
            <div className="bimaris-network-empty">
              <p>Stiamo preparando le prime schede degli operatori selezionati.</p>
              <Link href="/operatori">Esplora la sezione operatori →</Link>
            </div>
          )}
        </section>

        <section className="bimaris-network-section" id="esperienze-bimaris" aria-labelledby="bimaris-network-experiences-title">
          <div className="bimaris-network-section-head">
            <div>
              <div className="bimaris-network-eyebrow">PROPOSTE DA VIVERE</div>
              <h2 id="bimaris-network-experiences-title">Esperienze</h2>
              <p>Scopri cosa propongono gli operatori della rete.</p>
            </div>
            <Link href="/esperienze?tipo=esperienze" className="bimaris-network-more">Tutte le esperienze <span aria-hidden="true">→</span></Link>
          </div>
          {visibleExperiences.length ? (
            <div className="bimaris-network-grid">
              {visibleExperiences.map(experience => (
                <Link key={experience.id} href={`/esperienze/${experience.slug}`} className="bimaris-network-card">
                  {experience.imageUrl ? <div className="bimaris-network-card-media"><img src={experience.imageUrl} alt={experience.imageAlt ?? experience.name} loading="lazy" decoding="async" /></div> : <div className="bimaris-network-card-media bimaris-network-card-media--empty" aria-hidden="true">✦</div>}
                  <div className="bimaris-network-card-copy">
                    <div className="bimaris-network-card-kicker">{experience.categoryName} · {experience.location}</div>
                    <h3>{experience.name}</h3>
                    <p>{experience.excerpt}</p>
                    <span className="bimaris-network-card-cta">Scopri l'esperienza <span aria-hidden="true">→</span></span>
                  </div>
                </Link>
              ))}
            </div>
          ) : (
            <div className="bimaris-network-empty">
              <p>Le prossime esperienze saranno disponibili qui dopo la pubblicazione.</p>
              <Link href="/esperienze?tipo=esperienze">Esplora la sezione esperienze →</Link>
            </div>
          )}
        </section>
      </div>
    </main>
  );
}
