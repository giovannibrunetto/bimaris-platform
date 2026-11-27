import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { getPublishedStories } from "@/data/stories";
import "./stories-mobile.css";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export const metadata: Metadata = {
  title: "Messina, tra mito e leggenda | BIMARIS",
  description: "Scopri miti e leggende di Messina e dello Stretto: Colapesce, Mata e Grifone, Fata Morgana, Scilla e Cariddi e i luoghi reali cui sono legati.",
  alternates: {
    canonical: "/storie-miti-leggende",
  },
};

const cardImagePositions: Record<string, string> = {
  "orione-origini-mitiche-messina": "center 35%",
  "crono-falce-porto": "center 80%",
  "truvatura-via-cardines": "center 25%",
  "dina-e-clarenza": "center 32%",
};

const cardImageFits: Record<string, "cover" | "contain"> = {};

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

function placeLabel(count: number) {
  if (count === 1) return "1 luogo collegato";
  if (count > 1) return `${count} luoghi collegati`;
  return "Racconto dello Stretto";
}

export default async function StoriesPage() {
  const stories = await getPublishedStories();
  return (
    <>
      <section className="page-hero discovery-page-hero bimaris-ambient-hero stories-page-hero ux-brand-05-hero ux-brand-05-hero--standard" style={{ minHeight: 0 }}>
        <h1 style={{ marginTop: 0, marginBottom: 14 }}>Messina, tra mito e leggenda</h1>
        <p style={{ marginBottom: 0 }}>Racconti che nascono dal mare, dai quartieri e dalla memoria della città. Leggi la storia e poi raggiungi i luoghi reali cui è legata.</p>
      </section>

      <section className="section discovery-page-first bimaris-ambient-section stories-page-first">
        <div className="section-head">
          <div><div className="kicker stories-section-kicker ux-brand-05-section-kicker">Tra racconto e territorio</div><h2>Le storie dello Stretto</h2></div>
          <p>Ogni scheda collega il racconto ai luoghi di Messina che permettono di leggerlo direttamente nel paesaggio.</p>
        </div>

        {stories.length > 0 ? (
          <div className="cards stories-cards">
            {stories.map((story, index) => {
              const cardImage = story.imageUrl;
              const cardAlt = story.imageAlt ?? story.title;
              const isBundledImage = Boolean(cardImage?.startsWith("/storie-miti-leggende/"));
              const cardImagePosition = cardImagePositions[story.slug] ?? "center";
              const cardImageFit = cardImageFits[story.slug] ?? "cover";
              const containClass = cardImageFit === "contain" ? " story-card-media--contain" : "";
              return (
                <Link className="card story-card public-discovery-card" href={`/storie-miti-leggende/${story.slug}`} key={story.id}>
                  <div className={`card-media story-card-media${containClass}`} style={{ position: "relative", minHeight: 0, height: "190px", padding: 0, overflow: "hidden", background: "linear-gradient(135deg, #8d7354, #4f3b28)" }}>
                    {cardImage && cardImageFit === "contain" && (
                      <img src={cardImage} alt="" aria-hidden="true" loading="lazy" decoding="async" style={{ position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "cover", objectPosition: "center", filter: "blur(24px) brightness(.76)", transform: "scale(1.14)", pointerEvents: "none" }} />
                    )}
                    {cardImage && (isBundledImage ? (
                      <Image src={cardImage} alt={cardAlt} fill unoptimized={story.slug === "fata-morgana-stretto"} sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw" loading={index === 0 ? "eager" : "lazy"} fetchPriority={index === 0 ? "high" : undefined} style={{ objectFit: cardImageFit, objectPosition: cardImagePosition }} />
                    ) : (
                      <img src={cardImage} alt={cardAlt} loading={index === 0 ? "eager" : "lazy"} fetchPriority={index === 0 ? "high" : undefined} decoding="async" style={{ width: "100%", height: "100%", display: "block", objectFit: cardImageFit, objectPosition: cardImagePosition }} />
                    ))}
                    <span style={{ position: "absolute", top: 12, right: 12 }}>{storyTypeLabel(story.storyType)}</span>
                  </div>
                  <div className="card-body story-card-body" style={{ padding: "18px 20px 20px" }}>
                    <div className="eyebrow">{placeLabel(story.places.length)}</div>
                    <h3 style={{ marginTop: 8, marginBottom: 8 }}>{story.title}</h3>
                    <p className="story-card-excerpt" style={{ marginBottom: 14 }}>{story.excerpt}</p>
                    <span className="text-link">Leggi la storia →</span>
                  </div>
                </Link>
              );
            })}
          </div>
        ) : (
          <div className="detail-panel"><h3>Contenuti in preparazione</h3><p>Stiamo raccogliendo le storie, i miti e le leggende del territorio messinese.</p></div>
        )}
      </section>

      <section className="section sand bimaris-ambient-section stories-map-cta">
        <div className="section-head">
          <div><div className="kicker">Esplora</div><h2>Trova le storie sulla mappa.</h2></div>
          <p>Orientati tra Messina e lo Stretto.</p>
        </div>
        <Link className="button" href="/mappa">Apri la mappa BIMARIS</Link>
      </section>
    </>
  );
}
