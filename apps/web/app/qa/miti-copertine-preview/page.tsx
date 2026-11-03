import type { Metadata } from "next";
import "../../storie-miti-leggende/stories-mobile.css";
import "../../storie-miti-leggende/[slug]/story-detail-mobile.css";

export const metadata: Metadata = {
  title: "QA copertine Miti | BIMARIS",
  robots: { index: false, follow: false },
};

const covers = [
  { id: "colapesce", label: "Colapesce — riferimento", src: "/storie-miti-leggende/colapesce.webp" },
  { id: "orione-v1", label: "Orione — v1", src: "/qa/miti-copertine/Orione_copertina_v1.png" },
  { id: "crono-v1", label: "Crono — v1", src: "/qa/miti-copertine/Crono_copertina_v1.png" },
  { id: "dina-clarenza-v1", label: "Dina e Clarenza — v1", src: "/qa/miti-copertine/Dina_e_Clarenza_copertina_v1.png" },
  { id: "cardines-v2", label: "Truvatura di via Cardines — v2", src: "/qa/miti-copertine/Cardines_copertina_v2.png" },
] as const;

export default function MitiCopertineQaPreviewPage() {
  return (
    <>
      <section className="page-hero discovery-page-hero bimaris-ambient-hero stories-page-hero" style={{ minHeight: 0 }}>
        <h1 style={{ marginTop: 0, marginBottom: 14 }}>QA copertine — Miti e leggende</h1>
        <p style={{ marginBottom: 0 }}>Anteprima tecnica isolata. Nessuna delle quattro nuove leggende è integrata nel catalogo BIMARIS.</p>
      </section>

      <section className="section discovery-page-first bimaris-ambient-section stories-page-first">
        <div className="section-head">
          <div><div className="kicker stories-section-kicker">QA · componente reale</div><h2>Card landing</h2></div>
          <p>Stesso contenitore immagine della landing: 190 px desktop, 170 px sotto 760 px, object-fit cover, posizione centrale.</p>
        </div>
        <div className="cards stories-cards">
          {covers.map(cover => (
            <article className="card story-card" key={cover.id}>
              <div className="card-media story-card-media" style={{ position: "relative", minHeight: 0, height: "190px", padding: 0, overflow: "hidden", background: "linear-gradient(135deg, #8d7354, #4f3b28)" }}>
                <img src={cover.src} alt={cover.label} decoding="async" style={{ width: "100%", height: "100%", display: "block", objectFit: "cover" }} />
              </div>
              <div className="card-body story-card-body" style={{ padding: "18px 20px 20px" }}>
                <div className="eyebrow">Preview QA</div>
                <h3 style={{ marginTop: 8, marginBottom: 8 }}>{cover.label}</h3>
              </div>
            </article>
          ))}
        </div>
      </section>

      <section className="section sand story-detail-context" style={{ paddingTop: 20, paddingBottom: 20 }}>
        <div className="section-head">
          <div><div className="kicker">QA · componente reale</div><h2>Immagine dettaglio</h2></div>
          <p>Stesso contenitore immagine del dettaglio: 286 px desktop, 220 px sotto 760 px, object-fit cover, object-position center center.</p>
        </div>
        {covers.map(cover => (
          <div className="story-detail-hero-grid" key={cover.id} style={{ display: "grid", gridTemplateColumns: "minmax(280px,.72fr) minmax(0,1.38fr)", gap: 30, alignItems: "start", marginBottom: 28 }}>
            <div className="story-detail-media-column">
              <figure className="culture-hero-figure story-detail-figure" style={{ margin: 0, overflow: "hidden" }}>
                <img src={cover.src} alt={cover.label} decoding="async" style={{ width: "100%", height: 286, objectFit: "cover", objectPosition: "center center", display: "block" }} />
              </figure>
            </div>
            <article className="story-detail-article">
              <div className="kicker">Preview QA</div>
              <h3 style={{ fontFamily: "Georgia,serif", fontSize: "clamp(28px,2.4vw,38px)", lineHeight: 1.05, margin: "7px 0 9px" }}>{cover.label}</h3>
              <p style={{ fontSize: 15, lineHeight: 1.5, color: "#344448", margin: 0 }}>Verificare leggibilità del soggetto, taglio verticale e coerenza visuale rispetto al riferimento Colapesce.</p>
            </article>
          </div>
        ))}
      </section>
    </>
  );
}
