import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Borghi di Messina | BIMARIS",
  description: "Scopri i borghi più caratteristici del territorio messinese, la loro storia, identità e i luoghi da conoscere.",
};

export default function VillagesPage() {
  return (
    <>
      <section className="page-hero">
        <div className="kicker">Scopri il territorio</div>
        <h1>Borghi</h1>
        <p>
          Paesi e piccoli centri del territorio messinese da conoscere attraverso storia, paesaggio, tradizioni e identità locali.
        </p>
      </section>

      <section className="section sand">
        <div className="section-head">
          <div>
            <div className="kicker">Selezione BIMARIS</div>
            <h2>I borghi da scoprire.</h2>
          </div>
          <p>
            Questa sezione raccoglierà una selezione dei borghi più caratteristici, con una scheda dedicata a ciò che li rende unici e ai luoghi da non perdere.
          </p>
        </div>

        <div className="detail-panel">
          <div className="eyebrow">In costruzione</div>
          <h3>Stiamo preparando le prime schede dei borghi.</h3>
          <p>
            I contenuti saranno pubblicati progressivamente, evitando elenchi generici e privilegiando luoghi che abbiano una storia e un&apos;identità territoriale da raccontare.
          </p>
          <div className="actions">
            <Link className="button secondary" href="/mappa">Esplora intanto la mappa</Link>
          </div>
        </div>
      </section>
    </>
  );
}
