import type { Metadata } from "next";
import "../../storie-miti-leggende/stories-mobile.css";
import "../../storie-miti-leggende/[slug]/story-detail-mobile.css";

export const metadata: Metadata = {
  title: "QA crop copertine Miti | BIMARIS",
  robots: { index: false, follow: false },
};

type Variant = { label: string; position: string };
type Cover = { id: string; label: string; src: string; cardVariants?: Variant[]; detailVariants?: Variant[] };

const covers: Cover[] = [
  { id: "orione-v1", label: "Orione — v1", src: "/qa/miti-copertine/Orione_copertina_v1.png", cardVariants: [
    { label: "O1", position: "center 35%" }, { label: "O2", position: "center 25%" }, { label: "O3", position: "center 15%" },
  ] },
  { id: "crono-v1", label: "Crono — v1", src: "/qa/miti-copertine/Crono_copertina_v1.png", cardVariants: [
    { label: "C1", position: "center 35%" }, { label: "C2", position: "center 65%" }, { label: "C3", position: "center 80%" },
  ] },
  { id: "dina-clarenza-v1", label: "Dina e Clarenza — v1", src: "/qa/miti-copertine/Dina_e_Clarenza_copertina_v1.png", cardVariants: [
    { label: "DC1", position: "center 25%" }, { label: "DC2", position: "center 40%" }, { label: "DC3", position: "center 60%" }, { label: "DC4", position: "center 75%" },
  ], detailVariants: [
    { label: "DCD1", position: "center 40%" }, { label: "DCD2", position: "center 60%" }, { label: "DCD3", position: "center 75%" },
  ] },
  { id: "cardines-v2", label: "Truvatura di via Cardines — v2", src: "/qa/miti-copertine/Cardines_copertina_v2.png", cardVariants: [
    { label: "CA1", position: "center 25%" }, { label: "CA2", position: "center 40%" }, { label: "CA3", position: "center 60%" }, { label: "CA4", position: "center 75%" },
  ] },
];

function CardSample({ cover, label, position }: { cover: Cover; label: string; position: string }) {
  return <article className="card story-card">
    <div className="card-media story-card-media" style={{ position: "relative", minHeight: 0, height: "190px", padding: 0, overflow: "hidden", background: "linear-gradient(135deg, #8d7354, #4f3b28)" }}>
      <img src={cover.src} alt={`${cover.label} — ${label}`} decoding="async" style={{ width: "100%", height: "100%", display: "block", objectFit: "cover", objectPosition: position }} />
    </div>
    <div className="card-body story-card-body" style={{ padding: "14px 18px 16px" }}>
      <div className="eyebrow">{label}</div><h3 style={{ marginTop: 6, marginBottom: 4 }}>{cover.label}</h3>
      <p style={{ margin: 0, fontSize: 13 }}><code>object-position: {position}</code></p>
    </div>
  </article>;
}

function DetailSample({ cover, label, position }: { cover: Cover; label: string; position: string }) {
  return <div className="story-detail-hero-grid" style={{ display: "grid", gridTemplateColumns: "minmax(280px,.72fr) minmax(0,1.38fr)", gap: 30, alignItems: "start", marginBottom: 28 }}>
    <div className="story-detail-media-column"><figure className="culture-hero-figure story-detail-figure" style={{ margin: 0, overflow: "hidden" }}>
      <img src={cover.src} alt={`${cover.label} — ${label}`} decoding="async" style={{ width: "100%", height: 286, objectFit: "cover", objectPosition: position, display: "block" }} />
    </figure></div>
    <article className="story-detail-article"><div className="kicker">{label}</div><h3 style={{ fontFamily: "Georgia,serif", fontSize: "clamp(28px,2.4vw,38px)", lineHeight: 1.05, margin: "7px 0 9px" }}>{cover.label}</h3><p style={{ fontSize: 15, lineHeight: 1.5, color: "#344448", margin: 0 }}><code>object-position: {position}</code></p></article>
  </div>;
}

export default function MitiCopertineQaPreviewPage() {
  return <>
    <section className="page-hero discovery-page-hero bimaris-ambient-hero stories-page-hero" style={{ minHeight: 0 }}><h1 style={{ marginTop: 0, marginBottom: 14 }}>QA crop — Miti e leggende</h1><p style={{ marginBottom: 0 }}>Confronto isolato fra crop originale e varianti object-position. PNG, contenitori e object-fit restano invariati.</p></section>
    <section className="section discovery-page-first bimaris-ambient-section stories-page-first">
      <div className="section-head"><div><div className="kicker stories-section-kicker">QA · card desktop</div><h2>FAIL card: originale + varianti focali</h2></div><p>190 px desktop, 170 px sotto 760 px, object-fit cover. La prima card di ogni gruppo è il rendering originale center center.</p></div>
      {covers.map(cover => <div key={cover.id} style={{ marginBottom: 44 }}><h3 style={{ marginBottom: 14 }}>{cover.label}</h3><div className="cards stories-cards"><CardSample cover={cover} label="ORIGINALE" position="center center" />{(cover.cardVariants ?? []).map(v => <CardSample key={v.label} cover={cover} label={v.label} position={v.position} />)}</div></div>)}
    </section>
    <section className="section sand story-detail-context" style={{ paddingTop: 20, paddingBottom: 20 }}>
      <div className="section-head"><div><div className="kicker">QA · dettaglio desktop</div><h2>Dina e Clarenza: originale + varianti focali</h2></div><p>286 px desktop, 220 px sotto 760 px, object-fit cover. Gli altri tre dettagli restano PASS e non vengono modificati.</p></div>
      {covers.filter(c => c.detailVariants?.length).map(cover => <div key={cover.id}><DetailSample cover={cover} label="ORIGINALE" position="center center" />{(cover.detailVariants ?? []).map(v => <DetailSample key={v.label} cover={cover} label={v.label} position={v.position} />)}</div>)}
    </section>
  </>;
}
