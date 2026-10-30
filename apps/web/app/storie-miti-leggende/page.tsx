import type { Metadata } from "next";
import Link from "next/link";
import { getPublishedStories } from "@/data/stories";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export const metadata: Metadata = {
  title: "Storia, miti e leggende di Messina | BIMARIS",
  description: "Scopri miti e leggende di Messina e dello Stretto: Colapesce, Mata e Grifone, Fata Morgana, Scilla e Cariddi e i luoghi reali cui sono legati.",
};

const editorialIllustrations: Record<string, string> = {
  "scilla-e-cariddi": "/storie-miti-leggende/scilla-e-cariddi.webp",
  colapesce: "/storie-miti-leggende/colapesce.webp",
  "fata-morgana-stretto": "/storie-miti-leggende/fata-morgana.png?v=20261030-3",
  "mata-e-grifone": "/storie-miti-leggende/mata-e-grifone.webp",
  "madonna-della-lettera": "/storie-miti-leggende/madonna-della-lettera.webp",
  "leggende-madonna-dinnammare": "/storie-miti-leggende/madonna-dinnammare.webp",
  "risa-citta-sommersa-ganzirri": "/storie-miti-leggende/risa-citta-sommersa-ganzirri.webp",
};

function storyTypeLabel(storyType: string) {
  const normalized = storyType.trim().toLowerCase();

  if (normalized.includes("fenomeno naturale")) return "Leggenda naturale";
  if (normalized.includes("religioso") || normalized.includes("devozionale")) return "Tradizione devozionale";
  if (normalized.includes("mito")) return "Mito";
  if (normalized.includes("leggenda popolare")) return "Leggenda popolare";
  if (normalized.includes("tradizione popolare")) return "Tradizione popolare";
  if (normalized.includes("leggenda")) return "Leggenda";
  if (normalized.includes("tradizione")) return "Tradizione";

  return storyType;
}

export default async function StoriesPage() {
  const stories = await getPublishedStories();

  return (
    <>
      <section
        className="page-hero discovery-page-hero"
        style={{ paddingTop: 42, paddingBottom: 42, minHeight: 0 }}
      >
        <div className="kicker">Messina da raccontare</div>
        <h1 style={{ marginTop: 14, marginBottom: 14 }}>Storia, miti e leggende</h1>
        <p style={{ marginBottom: 0 }}>
          Racconti che nascono dal mare, dai quartieri e dalla memoria della città. Leggi la storia e poi raggiungi i luoghi reali cui è legata.
        </p>
      </section>

      <section className="section discovery-page-first">
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
            {stories.map(story => {
              const cardImage = editorialIllustrations[story.slug] ?? story.imageUrl;
              const cardAlt = editorialIllustrations[story.slug]
                ? `Illustrazione BIMARIS dedicata a ${story.title}`
                : story.imageAlt ?? story.title;

              return (
                <Link className="card" href={`/storie-miti-leggende/${story.slug}`} key={story.id}>
                  <div
                    className="card-media"
                    style={{
                      position: "relative",
                      minHeight: 0,
                      height: "190px",
                      padding: 0,
                      overflow: "hidden",
                      background: "linear-gradient(135deg, #8d7354, #4f3b28)",
                    }}
                  >
                    {cardImage && (
                      <img
                        src={cardImage}
                        alt={cardAlt}
                        loading="lazy"
                        decoding="async"
                        style={{ width: "100%", height: "100%", display: "block", objectFit: "cover" }}
                      />
                    )}
                    <span style={{ position: "absolute", top: 12, right: 12 }}>{storyTypeLabel(story.storyType)}</span>
                  </div>
                  <div className="card-body" style={{ padding: "18px 20px 20px" }}>
                    <div className="eyebrow">
                      {story.places.length > 0
                        ? `${story.places.length} ${story.places.length === 1 ? "luogo da raggiungere" : "luoghi da raggiungere"}`
                        : "Messina e lo Stretto"}
                    </div>
                    <h3 style={{ marginTop: 8, marginBottom: 8 }}>{story.title}</h3>
                    <p style={{ marginBottom: 14 }}>{story.excerpt}</p>
                    <span className="text-link">Leggi la storia →</span>
                  </div>
                </Link>
              );
            })}
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
