import type { Metadata } from "next";
import Link from "next/link";
import { getPublishedVillages } from "@/data/villages";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export const metadata: Metadata = {
  title: "Borghi di Messina | BIMARIS",
  description: "Scopri i borghi del territorio messinese attraverso schede dedicate alla loro storia, identità, paesaggio e patrimonio.",
};

export default async function VillagesPage() {
  const villages = await getPublishedVillages();

  return (
    <>
      <section className="page-hero discovery-page-hero">
        <div className="kicker">Scopri il territorio</div>
        <h1>Borghi</h1>
        <p>Storia, paesaggio, tradizioni e patrimonio dei borghi che raccontano le diverse identità del territorio messinese.</p>
      </section>

      <section className="section sand discovery-page-first">
        <div className="section-head">
          <div><div className="kicker">Borghi</div><h2>Scopri i luoghi e le loro storie.</h2></div>
          <p>Ogni borgo ha una scheda dedicata per conoscere la sua identità, la sua storia e i luoghi più significativi da vedere.</p>
        </div>

        {villages.length > 0 ? (
          <div className="cards village-cards">
            {villages.map(village => (
              <article className="card village-card" key={village.id}>
                {village.imageUrl && (
                  <div className="village-card-media">
                    <img src={village.imageUrl} alt={village.imageAlt ?? village.name} loading="lazy" decoding="async" />
                  </div>
                )}
                <div className="card-body">
                  <div className="kicker">{village.territory?.name ?? "Territorio messinese"}</div>
                  <h3>{village.name}</h3>
                  <p>{village.excerpt}</p>
                  <Link className="text-link" href={`/borghi/${village.slug}`}>Scopri il borgo →</Link>
                </div>
              </article>
            ))}
          </div>
        ) : null}
      </section>
    </>
  );
}
