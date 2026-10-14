import type { Metadata } from "next";
import Link from "next/link";
import { getPublishedCultureEntries } from "@/data/live";
import { HISTORICAL_PERIODS, historicalPeriodLabel } from "@/lib/historical-periods";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export const metadata: Metadata = {
  title: "Cultura a Messina | BIMARIS",
  description: "Scopri monumenti, chiese, fontane e luoghi culturali di Messina organizzati per epoca storica, con schede dedicate e indicazioni per raggiungerli.",
};

export default async function CulturePage() {
  const entries = await getPublishedCultureEntries();
  const transverseEntries = entries.filter(entry => entry.primaryHistoricalPeriod === "trasversale");

  return (
    <>
      <section className="page-hero">
        <div className="kicker">Scopri Messina</div>
        <h1>Cultura</h1>
        <p>
          Monumenti, architetture e luoghi che raccontano la storia di Messina. I contenuti sono organizzati per epoca per aiutarti a leggere la città nel tempo e costruire una visita coerente.
        </p>
      </section>

      <section className="section sand">
        <div className="section-head">
          <div>
            <div className="kicker">Messina nel tempo</div>
            <h2>Scegli un&apos;epoca storica.</h2>
          </div>
          <p>
            Dalla città medievale alla ricostruzione del Novecento. Ogni periodo apre direttamente la mappa storica con i monumenti collegati.
          </p>
        </div>

        <div className="cards">
          {HISTORICAL_PERIODS.map(period => {
            const count = entries.filter(entry => entry.historicalPeriods.includes(period.key)).length;
            return (
              <article className="card" key={period.key}>
                <div className="card-body">
                  <div className="eyebrow">{period.range}</div>
                  <h3>{period.label}</h3>
                  <p>{period.shortDescription}</p>
                  <Link className="text-link" href={`/mappa/epoche?epoca=${period.key}`}>
                    Esplora sulla mappa ({count}) →
                  </Link>
                </div>
              </article>
            );
          })}
        </div>
      </section>

      {HISTORICAL_PERIODS.map(period => {
        const periodEntries = entries
          .filter(entry => entry.primaryHistoricalPeriod === period.key)
          .sort((a, b) => (a.historicalSortYear ?? 9999) - (b.historicalSortYear ?? 9999));

        if (!periodEntries.length) return null;

        return (
          <section className="section" key={period.key}>
            <div className="section-head">
              <div>
                <div className="kicker">{period.range}</div>
                <h2>{period.label}</h2>
              </div>
              <p>{period.shortDescription}</p>
            </div>

            <div className="cards">
              {periodEntries.map(entry => (
                <article className="card culture-card" key={entry.id}>
                  <Link className="culture-card-link" href={`/cultura/${entry.slug}`}>
                    <div className="culture-card-media">
                      {entry.imageUrl ? (
                        <img
                          src={entry.imageUrl}
                          alt={entry.imageAlt ?? entry.title}
                          loading="lazy"
                          decoding="async"
                        />
                      ) : (
                        <div className="culture-card-placeholder" />
                      )}
                      <span>{entry.category}</span>
                    </div>
                    <div className="card-body">
                      <div className="eyebrow">{historicalPeriodLabel(entry.primaryHistoricalPeriod)}</div>
                      <h3>{entry.title}</h3>
                      <p>{entry.excerpt}</p>
                      {entry.historicalPeriodNote && (
                        <p style={{ fontSize: 13, color: "#6a747b" }}>{entry.historicalPeriodNote}</p>
                      )}
                      <span className="text-link">Scopri il luogo →</span>
                    </div>
                  </Link>
                  {entry.imageAuthor && entry.imageLicense && (
                    <div className="photo-credit">
                      Foto: {entry.imageAuthor} · {entry.imageLicense}
                    </div>
                  )}
                </article>
              ))}
            </div>
          </section>
        );
      })}

      {transverseEntries.length > 0 && (
        <section className="section">
          <div className="section-head">
            <div>
              <div className="kicker">Più epoche</div>
              <h2>Luoghi che attraversano la storia.</h2>
            </div>
            <p>Alcuni contenuti, come i musei, raccontano periodi diversi e non vengono forzati dentro una sola epoca monumentale.</p>
          </div>

          <div className="cards">
            {transverseEntries.map(entry => (
              <article className="card culture-card" key={entry.id}>
                <Link className="culture-card-link" href={`/cultura/${entry.slug}`}>
                  <div className="culture-card-media">
                    {entry.imageUrl ? (
                      <img src={entry.imageUrl} alt={entry.imageAlt ?? entry.title} loading="lazy" decoding="async" />
                    ) : (
                      <div className="culture-card-placeholder" />
                    )}
                    <span>{entry.category}</span>
                  </div>
                  <div className="card-body">
                    <div className="eyebrow">Più epoche</div>
                    <h3>{entry.title}</h3>
                    <p>{entry.excerpt}</p>
                    <span className="text-link">Scopri il luogo →</span>
                  </div>
                </Link>
              </article>
            ))}
          </div>
        </section>
      )}

      <section className="section dark">
        <div className="section-head">
          <div>
            <div className="kicker">Esplora</div>
            <h2>Preferisci partire dalla mappa?</h2>
          </div>
          <p>Usa la mappa generale oppure entra nella nuova mappa storica per visitare Messina scegliendo l&apos;epoca che ti interessa.</p>
        </div>
        <div className="actions">
          <Link className="button" href="/mappa/epoche">Apri la mappa storica</Link>
          <Link className="button ghost" href="/mappa">Apri la mappa BIMARIS</Link>
        </div>
      </section>
    </>
  );
}
