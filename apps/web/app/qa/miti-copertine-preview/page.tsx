import type { CSSProperties } from "react";
import type { Metadata } from "next";
import "../../storie-miti-leggende/stories-mobile.css";
import "../../storie-miti-leggende/[slug]/story-detail-mobile.css";

export const metadata: Metadata = {
  title: "QA crop copertine Miti | BIMARIS",
  robots: { index: false, follow: false },
};

type Variant = { label: string; position: string };
type Cover = { id: string; label: string; src: string; cardVariants?: Variant[] };
type DinaMode = "cover" | "contain" | "contain-framed";

const covers: Cover[] = [
  { id: "orione-v1", label: "Orione — v1", src: "/qa/miti-copertine/Orione_copertina_v1.png", cardVariants: [
    { label: "O1 · BASELINE DESKTOP", position: "center 35%" },
  ] },
  { id: "crono-v1", label: "Crono — v1", src: "/qa/miti-copertine/Crono_copertina_v1.png", cardVariants: [
    { label: "C3 · BASELINE DESKTOP", position: "center 80%" },
  ] },
  { id: "cardines-v2", label: "Truvatura di via Cardines — v2", src: "/qa/miti-copertine/Cardines_copertina_v2.png", cardVariants: [
    { label: "CA1 · BASELINE DESKTOP", position: "center 25%" },
  ] },
];

const dina: Cover = { id: "dina-clarenza-v1", label: "Dina e Clarenza — v1", src: "/qa/miti-copertine/Dina_e_Clarenza_copertina_v1.png" };

function CardSample({ cover, label, position }: { cover: Cover; label: string; position: string }) {
  return <article className="card story-card">
    <div className="card-media story-card-media" style={{ position: "relative", minHeight: 0, height: "190px", padding: 0, overflow: "hidden", background: "linear-gradient(135deg, #8d7354, #4f3b28)" }}>
      <img src={cover.src} alt={`${cover.label} — ${label}`} decoding="async" style={{ width: "100%", height: "100%", display: "block", objectFit: "cover", objectPosition: position }} />
    </div>
    <div className="card-body story-card-body" style={{ padding: "14px 18px 16px" }}>
      <div className="eyebrow">{label}</div><h3 style={{ marginTop: 6, marginBottom: 4 }}>{cover.label}</h3>
      <p style={{ margin: 0, fontSize: 13 }}><code>object-fit: cover; object-position: {position}</code></p>
    </div>
  </article>;
}

function dinaMediaStyle(mode: DinaMode): CSSProperties {
  const common: CSSProperties = { width: "100%", height: "100%", display: "block", objectPosition: "center center" };
  if (mode === "cover") return { ...common, objectFit: "cover" };
  if (mode === "contain") return { ...common, objectFit: "contain" };
  return { ...common, objectFit: "contain", width: "calc(100% - 20px)", height: "calc(100% - 20px)", margin: 10, borderRadius: 8, boxShadow: "0 4px 18px rgba(0,0,0,.18)" };
}

function modeLabel(mode: DinaMode) {
  if (mode === "cover") return "ORIGINALE · COVER";
  if (mode === "contain") return "DINA-A · CONTAIN";
  return "DINA-B · CONTAIN INCORNICIATO";
}

function DinaCardSample({ mode }: { mode: DinaMode }) {
  const framed = mode === "contain-framed";
  return <article className="card story-card">
    <div className="card-media story-card-media" style={{ position: "relative", minHeight: 0, height: "190px", padding: 0, overflow: "hidden", background: framed ? "linear-gradient(135deg, #153f43, #082d31)" : "linear-gradient(135deg, #8d7354, #4f3b28)" }}>
      <img src={dina.src} alt={`${dina.label} — ${modeLabel(mode)}`} decoding="async" style={dinaMediaStyle(mode)} />
    </div>
    <div className="card-body story-card-body" style={{ padding: "14px 18px 16px" }}>
      <div className="eyebrow">{modeLabel(mode)}</div><h3 style={{ marginTop: 6, marginBottom: 4 }}>{dina.label}</h3>
      <p style={{ margin: 0, fontSize: 13 }}>{mode === "cover" ? <code>object-fit: cover</code> : mode === "contain" ? <code>object-fit: contain</code> : <code>contain + cornice interna su fondo ottanio</code>}</p>
    </div>
  </article>;
}

function DinaDetailSample({ mode }: { mode: DinaMode }) {
  const framed = mode === "contain-framed";
  return <div className="story-detail-hero-grid" style={{ display: "grid", gridTemplateColumns: "minmax(280px,.72fr) minmax(0,1.38fr)", gap: 30, alignItems: "start", marginBottom: 28 }}>
    <div className="story-detail-media-column"><figure className="culture-hero-figure story-detail-figure" style={{ margin: 0, height: 286, overflow: "hidden", background: framed ? "linear-gradient(135deg, #153f43, #082d31)" : "linear-gradient(135deg, #8d7354, #4f3b28)" }}>
      <img src={dina.src} alt={`${dina.label} — ${modeLabel(mode)}`} decoding="async" style={dinaMediaStyle(mode)} />
    </figure></div>
    <article className="story-detail-article"><div className="kicker">{modeLabel(mode)}</div><h3 style={{ fontFamily: "Georgia,serif", fontSize: "clamp(28px,2.4vw,38px)", lineHeight: 1.05, margin: "7px 0 9px" }}>{dina.label}</h3><p style={{ fontSize: 15, lineHeight: 1.5, color: "#344448", margin: 0 }}>{mode === "cover" ? "Rendering ordinario: crop centrale." : mode === "contain" ? "PNG integralmente visibile; spazio residuo assorbito dal fondo della collana." : "PNG integralmente visibile con margine interno controllato e fondo ottanio."}</p></article>
  </div>;
}

export default function MitiCopertineQaPreviewPage() {
  return <>
    <section className="page-hero discovery-page-hero bimaris-ambient-hero stories-page-hero" style={{ minHeight: 0 }}><h1 style={{ marginTop: 0, marginBottom: 14 }}>QA copertine — Miti e leggende</h1><p style={{ marginBottom: 0 }}>Baseline desktop approvate e studio correttivo isolato per Dina e Clarenza. I PNG restano invariati.</p></section>

    <section className="section discovery-page-first bimaris-ambient-section stories-page-first">
      <div className="section-head"><div><div className="kicker stories-section-kicker">QA · baseline desktop consolidate</div><h2>Orione, Crono e Cardines</h2></div><p>Rendering originale + sola variante approvata dalla Direzione Strategica.</p></div>
      {covers.map(cover => <div key={cover.id} style={{ marginBottom: 44 }}><h3 style={{ marginBottom: 14 }}>{cover.label}</h3><div className="cards stories-cards"><CardSample cover={cover} label="ORIGINALE" position="center center" />{(cover.cardVariants ?? []).map(v => <CardSample key={v.label} cover={cover} label={v.label} position={v.position} />)}</div></div>)}
    </section>

    <section className="section sand" style={{ paddingTop: 24, paddingBottom: 24 }}>
      <div className="section-head"><div><div className="kicker">QA · studio correttivo</div><h2>Dina e Clarenza — card</h2></div><p>Confronto senza modifica del PNG: cover originale, contain integrale e alternativa contain incorniciata.</p></div>
      <div className="cards stories-cards"><DinaCardSample mode="cover" /><DinaCardSample mode="contain" /><DinaCardSample mode="contain-framed" /></div>
    </section>

    <section className="section sand story-detail-context" style={{ paddingTop: 20, paddingBottom: 20 }}>
      <div className="section-head"><div><div className="kicker">QA · studio correttivo</div><h2>Dina e Clarenza — dettaglio</h2></div><p>Stesso confronto nel contenitore dettaglio: 286 px desktop, 220 px sotto 760 px.</p></div>
      <DinaDetailSample mode="cover" /><DinaDetailSample mode="contain" /><DinaDetailSample mode="contain-framed" />
    </section>
  </>;
}
