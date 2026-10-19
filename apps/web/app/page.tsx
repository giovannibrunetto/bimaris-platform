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
            <a className="button" href="#visitatori">Scopri Messina</a>
            <Link className="button secondary" href="/mappa">Esplora la mappa</Link>
          </div>
        </div>
      </section>

      <section className="section sand home-audience home-visitors" id="visitatori">
        <div className="home-audience-intro">
          <div className="kicker">Sei qui per scoprire Messina?</div>
          <h2>Vivi il territorio con BIMARIS.</h2>
          <p>Scegli ciò che ti interessa e decidi come esplorare Messina: seguendo un percorso BIMARIS oppure costruendo liberamente il tuo viaggio sulla mappa.</p>
        </div>

        <div className="category-grid home-category-grid">
          {discoveryCategories.map(category => (
            <Link className="category" href={category.href} key={category.label} aria-label={`Scopri ${category.label}`}>
              {category.label}
            </Link>
          ))}
        </div>

        <div className="home-discovery-choice">
          <div className="home-discovery-heading">
            <div className="kicker">Come vuoi scoprire Messina?</div>
            <h3>Scegli il tuo modo di esplorare.</h3>
          </div>
          <div className="home-explore-grid">
            <Link className="home-explore-card home-itinerary-card" href="/itinerari">
              <div className="kicker">Lasciati guidare</div>
              <h4>Itinerari BIMARIS</h4>
              <p>Percorsi già costruiti, con tappe e tempi suggeriti, per scoprire luoghi, storie e identità del territorio.</p>
              <strong>Scopri gli itinerari →</strong>
            </Link>

            <Link className="home-explore-card home-map-card" href="/mappa">
              <div>
                <div className="kicker">Esplora liberamente</div>
                <h4>Mappa BIMARIS</h4>
                <p>Scegli i punti di interesse che vuoi visitare e costruisci liberamente il tuo percorso sul territorio.</p>
                <strong>Esplora la mappa →</strong>
              </div>
            </Link>
          </div>
        </div>
      </section>

      <section className="section home-audience home-operators">
        <div className="home-operator-inner">
          <div>
            <div className="kicker">Sei un operatore del territorio?</div>
            <h2>Entra nella rete BIMARIS.</h2>
          </div>
          <div className="home-operator-copy">
            <p>Stiamo selezionando realtà, produttori ed esperienze che raccontano Messina attraverso qualità, autenticità e identità locale.</p>
            <Link className="button" href="/operatori/candidatura">Presenta la tua candidatura</Link>
          </div>
        </div>
      </section>
    </>
  );
}
