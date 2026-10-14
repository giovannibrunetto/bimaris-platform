import type { Metadata } from "next";
import Link from "next/link";
import { getPublishedCultureEntries } from "@/data/live";

export const revalidate = 300;

export const metadata: Metadata = {
  title: "Cultura a Messina | BIMARIS",
  description: "Scopri monumenti, chiese, fontane e luoghi culturali di Messina, con schede dedicate e indicazioni per raggiungerli.",
};

export default async function CulturePage() {
  const entries = await getPublishedCultureEntries();

  return (
    <>
      <section className="page-hero">
        <div className="kicker">Scopri Messina</div>
        <h1>Cultura</h1>
        <p>Monumenti, architetture e luoghi che raccontano la storia di Messina. Scegli cosa scoprire e raggiungilo direttamente con Google Maps.</p>
      </section>

      <section className="section">
        <div className="section-head">
          <div>
            <div className="kicker">Luoghi da conoscere</div>
            <h2>Messina attraverso i suoi monumenti</h2>
          </div>
          <p>Ogni scheda raccoglie una breve introduzione storica, l'indirizzo e un collegamento diretto per raggiungere il luogo.</p>
        </div>

        {entries.length > 0 ? (
          <div className="cards">
            {entries.map(entry => (
              <Link className="card" href={`/cultura/${entry.slug}`} key={entry.id}>
                <div className="card-media"><span>{entry.category}</span></div>
                <div className="card-body">
                  <div className="eyebrow">{entry.address ?? "Messina"}</div>
                  <h3>{entry.title}</h3>
                  <p>{entry.excerpt}</p>
                  <span className="text-link">Scopri il luogo →</span>
                </div>
              </Link>
            ))}
          </div>
        ) : (
          <div className="detail-panel">
            <h3>Contenuti in preparazione</h3>
            <p>Stiamo completando la selezione culturale BIMARIS.</p>
          </div>
        )}
      </section>

      <section className="section sand">
        <div className="section-head">
          <div><div className="kicker">Esplora</div><h2>Preferisci partire dalla mappa?</h2></div>
          <p>Apri la mappa BIMARIS e orientati nel territorio messinese.</p>
        </div>
        <Link className="button" href="/mappa">Apri la mappa BIMARIS</Link>
      </section>
    </>
  );
}
