import type { Metadata } from "next";
import Link from "next/link";
import { getPublishedVillages, massesContext } from "@/data/villages";

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
      <section
        className="page-hero discovery-page-hero"
        style={{
          background: "linear-gradient(135deg, #0b3040 0%, #061624 58%, #02090f 100%)",
          color: "#ffffff",
        }}
      >
        <div className="kicker" style={{ color: "#e0bd78" }}>Scopri il territorio</div>
        <h1 style={{ color: "#ffffff" }}>Borghi</h1>
        <p style={{ color: "#e2e8ed" }}>Storia, paesaggio, tradizioni e patrimonio dei borghi che raccontano le diverse identità del territorio messinese.</p>
      </section>

      <section className="section sand discovery-page-first">
        <div className="section-head">
          <div><div className="kicker">Borghi</div><h2>Scopri i luoghi e le loro storie.</h2></div>
          <p>Ogni borgo ha una scheda dedicata per conoscere la sua identità, la sua storia e i luoghi più significativi da vedere.</p>
        </div>

        <section id="le-masse-di-messina" style={{maxWidth:920,margin:"0 auto 46px",padding:"28px 30px",border:"1px solid #dfe4e8",borderRadius:18,background:"#fff"}}>
          <div className="kicker">Contesto comune</div>
          <h2 style={{fontFamily:"Georgia,serif",fontSize:"clamp(1.8rem,4vw,2.45rem)",margin:"8px 0 4px"}}>Le Masse di Messina</h2>
          <h3 style={{fontFamily:"Georgia,serif",fontSize:"clamp(1.15rem,2.5vw,1.45rem)",margin:"0 0 20px",fontWeight:500}}>{massesContext.title}</h3>
          {massesContext.paragraphs.map((paragraph,index)=><p key={index} style={{fontSize:17,lineHeight:1.75,color:"#4d5962"}}>{paragraph}</p>)}
        </section>

        {villages.length > 0 ? (
          <div className="cards village-cards">
            {villages.map(village => (
              <article className="card village-card" key={village.id}>
                {village.imageUrl && (
                  <div className="village-card-media">
                    <img src={village.imageUrl} alt={village.imageAlt ?? village.name} loading="lazy" decoding="async" />
                    {village.slug === "san-marco-d-alunzio" && (
                      <div style={{ fontSize: "0.72rem", lineHeight: 1.35, padding: "0.35rem 0.55rem", color: "#5f6368" }}>
                        Fonte immagine: <a href="https://www.comune.sanmarcodalunzio.me.it/" target="_blank" rel="noreferrer">Comune di San Marco d’Alunzio</a>
                      </div>
                    )}
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
