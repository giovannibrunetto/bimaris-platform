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

        <Link href="/itinerari" className="discovery-link">
          <div>
            <div className="kicker">Percorsi BIMARIS</div>
            <h3>Lasciati guidare da un itinerario</h3>
            <p>Percorsi già costruiti per scoprire luoghi, storie e identità del territorio.</p>
          </div>
          <span>Scopri i percorsi →</span>
        </Link>

        <Link href="/mappa" className="map-shell home-map-shell">
          <div className="map-label">
            <div className="kicker">Esplora</div>
            <h3>Apri la mappa di BIMARIS</h3>
            <p>Scopri le aree e i punti di interesse del territorio messinese.</p>
            <span className="map-action">Apri la mappa →</span>
          </div>
        </Link>
      </section>
    </>
  );
}
