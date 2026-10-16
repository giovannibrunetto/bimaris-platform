import Link from "next/link";

export const revalidate = 300;

const discoveryCategories = [
  { label: "Monumenti e cultura", href: "/cultura" },
  { label: "Miti e leggende", href: "/storie-miti-leggende" },
  { label: "Sapori e territori", href: "/sapori-territori" },
  { label: "Borghi", href: "/borghi" },
  { label: "Esperienze", href: "/esperienze" },
];

export default function Home() {
  return (
    <>
      <section className="brand-hero">
        <h1 className="sr-only">BIMARIS — Messina da Vivere</h1>
        <div className="brand-hero-visual">
          <img src="/brand/bimaris-main.jpeg" alt="BIMARIS — Messina da Vivere" />
        </div>
        <div className="brand-hero-copy">
          <div className="kicker">Tra due mari. Un territorio da vivere.</div>
          <p>BIMARIS racconta Messina attraverso luoghi, storie, sapori, paesaggi e identità capaci di esprimere il territorio oltre i percorsi più scontati.</p>
          <div className="actions">
            <a className="button" href="#scopri">Scopri Messina</a>
            <Link className="button secondary" href="/mappa">Esplora la mappa</Link>
          </div>
        </div>
      </section>

      <section className="section">
        <div className="section-head">
          <div><div className="kicker">Sei un operatore del territorio?</div><h2>BIMARIS sta costruendo la propria rete.</h2></div>
          <p>Stiamo selezionando le realtà, i produttori e le esperienze che meglio raccontano Messina e il suo territorio, attraverso qualità, autenticità e identità locale.</p>
        </div>
        <Link className="button" href="/operatori/candidatura">Presenta la tua candidatura</Link>
      </section>

      <section className="section sand" id="scopri">
        <div className="section-head">
          <div><div className="kicker">Scopri BIMARIS</div><h2>Da dove vuoi iniziare?</h2></div>
          <p>Scegli ciò che ti interessa: monumenti, storie, sapori, borghi oppure esperienze da vivere sul territorio.</p>
        </div>

        <div className="category-grid">
          {discoveryCategories.map(category => (
            <Link className="category" href={category.href} key={category.label} aria-label={`Scopri ${category.label}`}>
              {category.label}
            </Link>
          ))}
        </div>

        <div style={{ clear: "both", width: "100%", paddingTop: 34 }}>
          <Link
            href="/itinerari"
            style={{
              padding: "24px 0",
              display: "grid",
              gridTemplateColumns: "minmax(0, 1fr) auto",
              alignItems: "end",
              gap: 24,
              borderTop: "1px solid rgba(16,24,32,.16)",
              borderBottom: "1px solid rgba(16,24,32,.16)",
            }}
          >
            <div>
              <div className="kicker">Vuoi lasciarti guidare?</div>
              <h3 style={{ fontFamily: "Georgia, serif", fontSize: "clamp(25px, 3vw, 34px)", fontWeight: 500, margin: "7px 0 5px" }}>Scegli un itinerario BIMARIS</h3>
              <p style={{ color: "var(--muted)", margin: 0, lineHeight: 1.5 }}>Segui percorsi già costruiti, con tappe e tempi suggeriti, per scoprire luoghi, storie e identità del territorio.</p>
            </div>
            <strong style={{ color: "#8d6b34", whiteSpace: "nowrap" }}>Scopri gli itinerari →</strong>
          </Link>
        </div>

        <div style={{ clear: "both", width: "100%", paddingTop: 34 }}>
          <Link
            href="/mappa"
            style={{
              minHeight: "clamp(360px, 58vw, 680px)",
              width: "100%",
              borderRadius: 26,
              padding: "clamp(22px, 4vw, 34px)",
              display: "flex",
              alignItems: "flex-end",
              position: "relative",
              isolation: "isolate",
              color: "white",
              overflow: "hidden",
              backgroundColor: "#071821",
              backgroundImage: "linear-gradient(180deg, rgba(4,16,24,.04) 28%, rgba(4,16,24,.35) 58%, rgba(4,16,24,.88) 100%), url('/bimaris-map-tech.jpg')",
              backgroundSize: "cover",
              backgroundPosition: "center center",
              backgroundRepeat: "no-repeat",
              border: "1px solid rgba(255,255,255,.16)",
            }}
          >
            <div style={{ maxWidth: 560, color: "white", position: "relative", zIndex: 1, textShadow: "0 2px 14px rgba(0,0,0,.75)" }}>
              <div className="kicker">Vuoi esplorare liberamente?</div>
              <h3 style={{ color: "white", fontFamily: "Georgia, serif", fontSize: "clamp(30px, 4vw, 42px)", margin: "6px 0 8px" }}>Esplora la mappa BIMARIS</h3>
              <p style={{ color: "rgba(255,255,255,.94)", lineHeight: 1.5, margin: 0 }}>Scopri i punti di interesse, scegli quelli che vuoi visitare e costruisci il tuo percorso sul territorio.</p>
              <strong style={{ display: "inline-block", marginTop: 14, color: "#e2c58d" }}>Esplora la mappa →</strong>
            </div>
          </Link>
        </div>
      </section>
    </>
  );
}
