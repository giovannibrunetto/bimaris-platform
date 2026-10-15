import Link from "next/link";

export const revalidate = 300;

const discoveryCategories = [
  { label: "Monumenti e cultura", href: "/cultura" },
  { label: "Miti e leggende", href: "/storie-miti-leggende" },
  { label: "Sapori e territori", href: "/sapori-territori" },
  { label: "Mare e Stretto", href: "/mare-stretto" },
  { label: "Natura e borghi", href: "/natura-borghi" },
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
          <p>Stiamo selezionando operatori, produttori ed esperienze capaci di rappresentare Messina con qualità, autenticità e forte legame con il territorio.</p>
        </div>
        <Link className="button" href="/operatori/candidatura">Presenta la tua candidatura</Link>
      </section>

      <section className="section sand" id="scopri">
        <div className="section-head">
          <div><div className="kicker">Scopri BIMARIS</div><h2>Da dove vuoi iniziare?</h2></div>
          <p>Scegli ciò che ti interessa e scopri Messina attraverso i suoi luoghi, le sue storie, i sapori, il mare e il territorio.</p>
        </div>

        <div className="category-grid">
          {discoveryCategories.map(category => (
            <Link className="category" href={category.href} key={category.label} aria-label={`Scopri ${category.label}`}>
              {category.label}
            </Link>
          ))}
        </div>

        <Link
          href="/itinerari"
          style={{
            marginTop: 34,
            padding: "24px 0",
            display: "flex",
            alignItems: "end",
            justifyContent: "space-between",
            gap: 24,
            borderTop: "1px solid rgba(16,24,32,.16)",
            borderBottom: "1px solid rgba(16,24,32,.16)",
          }}
        >
          <div>
            <div className="kicker">Percorsi BIMARIS</div>
            <h3 style={{ fontFamily: "Georgia, serif", fontSize: "clamp(25px, 3vw, 34px)", fontWeight: 500, margin: "7px 0 5px" }}>Lasciati guidare da un itinerario</h3>
            <p style={{ color: "var(--muted)", margin: 0, lineHeight: 1.5 }}>Percorsi già costruiti per scoprire luoghi, storie e identità del territorio.</p>
          </div>
          <strong style={{ color: "#8d6b34", whiteSpace: "nowrap" }}>Scopri i percorsi →</strong>
        </Link>

        <Link href="/mappa" className="map-shell" style={{ display: "block", marginTop: 34, color: "white" }}>
          <div className="map-label" style={{ color: "white", textShadow: "0 2px 14px rgba(0,0,0,.65)" }}>
            <div className="kicker">Esplora</div>
            <h3 style={{ color: "white" }}>Apri la mappa di BIMARIS</h3>
            <p style={{ color: "rgba(255,255,255,.88)", lineHeight: 1.5 }}>Scopri le aree e i punti di interesse del territorio messinese.</p>
            <strong style={{ display: "inline-block", marginTop: 8, color: "#e2c58d" }}>Apri la mappa →</strong>
          </div>
        </Link>
      </section>
    </>
  );
}
