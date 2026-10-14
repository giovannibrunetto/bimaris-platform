import type { Metadata } from "next";
import Link from "next/link";
import { getPublishedStories } from "@/data/stories";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export const metadata: Metadata = {
  title: "Storia, miti e leggende di Messina | BIMARIS",
  description: "Scopri miti e leggende di Messina e dello Stretto: Colapesce, Mata e Grifone, Fata Morgana, Scilla e Cariddi e i luoghi reali cui sono legati.",
};

export default async function StoriesPage() {
  const stories = await getPublishedStories();

  return (
    <>
      <section className="page-hero">
        <div className="kicker">Messina da raccontare</div>
        <h1>Storia, miti e leggende</h1>
        <p>
          Racconti che nascono dal mare, dai quartieri e dalla memoria della città. Leggi la storia e poi raggiungi i luoghi reali cui è legata.
        </p>
      </section>

      <section className="section">
        <div className="section-head">
          <div>
            <div className="kicker">Tra racconto e territorio</div>
            <h2>Le storie dello Stretto</h2>
          </div>
          <p>
            Ogni scheda collega il racconto ai luoghi di Messina che permettono di leggerlo direttamente nel paesaggio.
          </p>
        </div>

        {stories.length > 0 ? (
          <div className="cards">
            {stories.map(story => (
              <Link className="card" href={`/storie-miti-leggende/${story.slug}`} key={story.id}>
                <div className="card-media">
                  <span>{story.storyType}</span>
                </div>
                <div className="card-body">
                  <div className="eyebrow">
                    {story.places.length > 0
                      ? `${story.places.length} ${story.places.length === 1 ? "luogo da raggiungere" : "luoghi da raggiungere"}`
                      : "Messina e lo Stretto"}
                  </div>
                  <h3>{story.title}</h3>
                  <p>{story.excerpt}</p>
                  <span className="text-link">Leggi la storia →</span>
                </div>
              </Link>
            ))}
          </div>
        ) : (
          <div className="detail-panel">
            <h3>Contenuti in preparazione</h3>
            <p>Stiamo raccogliendo le storie, i miti e le leggende del territorio messinese.</p>
          </div>
        )}
      </section>

      <section className="section sand">
        <div className="section-head">
          <div>
            <div className="kicker">Esplora</div>
            <h2>Vuoi vedere dove nascono queste storie?</h2>
          </div>
          <p>Apri la mappa BIMARIS per orientarti nello Stretto e nel territorio di Messina.</p>
        </div>
        <Link className="button" href="/mappa">Apri la mappa BIMARIS</Link>
      </section>
    </>
  );
}
