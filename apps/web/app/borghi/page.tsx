import type { Metadata } from "next";
import Link from "next/link";
import { getPublishedVillages } from "@/data/villages";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export const metadata: Metadata = {
  title: "Borghi di Messina | BIMARIS",
  description: "Scopri i borghi più caratteristici del territorio messinese, la loro storia, identità e i luoghi da conoscere.",
};

export default async function VillagesPage() {
  const villages = await getPublishedVillages();

  return (
    <>
      <section className="page-hero">
        <div className="kicker">Scopri il territorio</div>
        <h1>Borghi</h1>
        <p>Paesi e piccoli centri del territorio messinese da conoscere attraverso storia, paesaggio, tradizioni e identità locali.</p>
      </section>

      <section className="section sand">
        <div className="section-head">
          <div><div className="kicker">Selezione BIMARIS</div><h2>I borghi da scoprire.</h2></div>
          <p>Non un elenco di comuni: una selezione di luoghi con un'identità precisa, una storia da raccontare e motivi concreti per essere visitati.</p>
        </div>

        {villages.length > 0 ? (
          <div className="cards">
            {villages.map(village => (
              <article className="card" key={village.id}>
                {village.imageUrl && <img src={village.imageUrl} alt={village.imageAlt ?? village.name} loading="lazy" decoding="async" />}
                <div className="card-body">
                  <div className="kicker">{village.territory?.name ?? "Territorio messinese"}</div>
                  <h3>{village.name}</h3>
                  <p>{village.excerpt}</p>
                  <Link className="text-link" href={`/borghi/${village.slug}`}>Scopri il borgo →</Link>
                </div>
              </article>
            ))}
          </div>
        ) : (
          <div className="detail-panel">
            <div className="eyebrow">In preparazione</div>
            <h3>Stiamo selezionando i primi borghi.</h3>
            <p>Le schede saranno pubblicate progressivamente, privilegiando luoghi che abbiano una storia, un'identità territoriale e motivi reali per essere scoperti.</p>
          </div>
        )}
      </section>

      <section className="section">
        <div className="section-head"><div><div className="kicker">Sulla mappa</div><h2>Costruisci il tuo percorso.</h2></div><p>I borghi pubblicati compariranno automaticamente anche nella mappa BIMARIS e potranno essere aggiunti alle altre tappe del viaggio.</p></div>
        <Link className="button secondary" href="/mappa">Esplora la mappa</Link>
      </section>
    </>
  );
}
