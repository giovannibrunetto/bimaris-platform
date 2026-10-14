import type { Metadata } from "next";
import Link from "next/link";
import { getPublishedOperators } from "@/data/operators";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export const metadata: Metadata = {
  title: "Operatori selezionati | BIMARIS",
  description: "Scopri operatori, produttori e realtà del territorio selezionati da BIMARIS per qualità, autenticità e legame con Messina.",
};

export default async function OperatorsPage() {
  const operators = await getPublishedOperators();

  return (
    <>
      <section className="page-hero">
        <div className="kicker">Selezione BIMARIS</div>
        <h1>Operatori del territorio</h1>
        <p>
          Una selezione in costruzione di operatori, produttori e realtà locali scelti per qualità, autenticità e capacità di raccontare Messina attraverso ciò che fanno.
        </p>
        <div className="actions">
          <Link className="button" href="/operatori/candidatura">Presenta la tua candidatura</Link>
        </div>
      </section>

      <section className="section">
        <div className="section-head">
          <div>
            <div className="kicker">Realtà selezionate</div>
            <h2>Chi trovi su BIMARIS</h2>
          </div>
          <p>
            La presenza su BIMARIS non è automatica: ogni realtà viene valutata prima della pubblicazione.
          </p>
        </div>

        {operators.length > 0 ? (
          <div className="cards">
            {operators.map(operator => (
              <Link className="card culture-card" href={`/operatori/${operator.slug}`} key={operator.id}>
                {operator.imageUrl ? (
                  <div className="culture-card-media">
                    <img src={operator.imageUrl} alt={operator.imageAlt ?? operator.name} loading="lazy" decoding="async" />
                    <span>{operator.category ?? "Operatore BIMARIS"}</span>
                  </div>
                ) : (
                  <div className="card-media">
                    <span>{operator.category ?? "Operatore BIMARIS"}</span>
                  </div>
                )}
                <div className="card-body">
                  <div className="eyebrow">{operator.territoryName ?? operator.address ?? "Messina e provincia"}</div>
                  <h3>{operator.name}</h3>
                  <p>{operator.description}</p>
                  {operator.whySelected && <p><strong>Perché BIMARIS:</strong> {operator.whySelected}</p>}
                  <span className="text-link">Scopri la realtà →</span>
                </div>
              </Link>
            ))}
          </div>
        ) : (
          <div className="detail-panel">
            <h3>La selezione è in corso</h3>
            <p>
              Stiamo valutando le prime realtà da pubblicare. Preferiamo una selezione ridotta e verificata piuttosto che riempire il catalogo con contenuti non ancora validati.
            </p>
            <div className="actions">
              <Link className="button" href="/operatori/candidatura">Invia una candidatura</Link>
            </div>
          </div>
        )}
      </section>
    </>
  );
}
