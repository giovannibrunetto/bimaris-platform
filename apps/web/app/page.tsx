import Link from "next/link";
import { getActiveTerritories } from "@/data/live";
import { itineraries, events } from "@/data/mock";

export const revalidate = 300;

const categories = ["Mangiare", "Esperienze", "Mare", "Natura", "Cultura", "Shopping e artigianato", "Famiglia", "Vicino a te"];

const inspirations = [
  {
    title: "Sapori e territori",
    text: "Vini, prodotti, cucina e tradizioni raccontati attraverso i luoghi da cui nascono.",
  },
  {
    title: "Mare e Stretto",
    text: "Esperienze legate al mare, allo Stretto e al paesaggio unico che unisce due coste.",
  },
  {
    title: "Natura e borghi",
    text: "Peloritani, Nebrodi, sentieri e piccoli centri da scoprire con uno sguardo autentico.",
  },
];

export default async function Home() {
  const territories = await getActiveTerritories();

  return (
    <>
      <section className="brand-hero">
        <h1 className="sr-only">BIMARIS — Messina da Vivere</h1>
        <div className="brand-hero-visual">
          <img src="/brand/bimaris-main.jpeg" alt="BIMARIS — Messina da Vivere" />
        </div>
        <div className="brand-hero-copy">
          <div className="kicker">Tra due mari. Un territorio da vivere.</div>
          <p>BIMARIS nasce per raccontare Messina attraverso esperienze, sapori, luoghi e realtà capaci di esprimere l'identità del territorio.</p>
          <div className="search-box">
            <input aria-label="Cerca" placeholder="Cosa vuoi vivere a Messina?" />
            <Link className="button" href="/esperienze">Scopri</Link>
          </div>
          <div className="actions">
            <Link className="button" href="/esperienze">Scopri Messina</Link>
            <Link className="button secondary" href="/mappa">Esplora la mappa</Link>
          </div>
        </div>
      </section>

      <section className="section sand">
        <div className="section-head"><div><div className="kicker">Scopri</div><h2>Cosa vuoi vivere oggi?</h2></div><p>BIMARIS organizza il territorio per esperienze e interessi, per aiutarti a scoprire Messina oltre i percorsi più scontati.</p></div>
        <div className="category-grid">{categories.map(c => <div className="category" key={c}>{c}</div>)}</div>
      </section>

      <section className="section">
        <div className="section-head"><div><div className="kicker">Il territorio che vogliamo raccontare</div><h2>Idee di esperienza</h2></div><p>Questi sono gli ambiti su cui BIMARIS sta costruendo la propria selezione editoriale e la futura rete di realtà del territorio.</p></div>
        <div className="itinerary-grid">
          {inspirations.map(item => <div className="itinerary itinerary-light" key={item.title}><h3>{item.title}</h3><p>{item.text}</p></div>)}
        </div>
      </section>

      <section className="section dark">
        <div className="section-head"><div><div className="kicker">Mappa BIMARIS</div><h2>Messina, intorno a te.</h2></div><p>Una lettura del territorio pensata per collegare luoghi, interessi ed esperienze in modo semplice e immediato.</p></div>
        <Link href="/mappa" className="map-shell" style={{display:"block"}}>
          <div className="map-label"><div className="kicker">Esplora</div><h3>Apri la mappa BIMARIS</h3><p>Scopri le aree e i punti di interesse del territorio messinese.</p></div>
        </Link>
      </section>

      <section className="section dark" style={{paddingTop: 10}}>
        <div className="territory-grid">{territories.map(t => <div className="territory" key={t.slug}><h3>{t.name}</h3><p>{t.text}</p></div>)}</div>
      </section>

      <section className="section sand">
        <div className="section-head"><div><div className="kicker">Percorsi</div><h2>Itinerari BIMARIS</h2></div><Link className="text-link" href="/itinerari">Tutti gli itinerari →</Link></div>
        <div className="itinerary-grid">{itineraries.map(i => <div className="itinerary itinerary-light" key={i.title}><div className="eyebrow">{i.target}</div><h3>{i.title}</h3><p>{i.duration} · {i.stops} tappe</p></div>)}</div>
      </section>

      <section className="section">
        <div className="section-head"><div><div className="kicker">Agenda</div><h2>Cosa succede a Messina</h2></div><Link className="text-link" href="/eventi">Calendario →</Link></div>
        <ul className="list">{events.map(e => <li key={e.title}><strong>{e.date}</strong> · {e.title} — {e.place} <span className="eyebrow">{e.category}</span></li>)}</ul>
      </section>

      <section className="section dark">
        <div className="section-head"><div><div className="kicker">Per gli operatori</div><h2>Costruiamo la selezione BIMARIS.</h2></div><p>BIMARIS sta costruendo una selezione di operatori, produttori ed esperienze capaci di rappresentare Messina con qualità, autenticità e legame con il territorio. Se pensi che la tua realtà sia in linea con questa visione, puoi presentarci la tua candidatura.</p></div>
        <Link className="button" href="/operatori/candidatura">Presenta la tua realtà</Link>
      </section>
    </>
  );
}
