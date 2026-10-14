import Link from "next/link";
import { getActiveTerritories } from "@/data/live";
import { getPublishedItineraries } from "@/data/itineraries";

export const revalidate = 300;

const categories = [
  { label: "Monumenti e cultura", href: "/cultura" },
  { label: "Miti e leggende", href: "/storie-miti-leggende" },
  { label: "Itinerari", href: "/itinerari" },
  { label: "Esplora la mappa", href: "/mappa" },
];

const inspirations = [
  {
    title: "Sapori e territori",
    text: "Vini, prodotti, cucina e tradizioni raccontati attraverso i luoghi da cui nascono.",
  },
  {
    title: "Mare e Stretto",
    text: "Storie, paesaggi e percorsi legati allo Stretto e al rapporto unico tra Messina e il mare.",
  },
  {
    title: "Natura e borghi",
    text: "Peloritani, Nebrodi, sentieri e piccoli centri da scoprire con uno sguardo autentico.",
  },
];

export default async function Home() {
  const [territories, itineraries] = await Promise.all([
    getActiveTerritories(),
    getPublishedItineraries(),
  ]);
  const featuredItineraries = itineraries.filter(item => item.featured).slice(0, 2);
  const homeItineraries = featuredItineraries.length > 0 ? featuredItineraries : itineraries.slice(0, 2);

  return (
    <>
      <section className="brand-hero">
        <h1 className="sr-only">BIMARIS — Messina da Vivere</h1>
        <div className="brand-hero-visual">
          <img src="/brand/bimaris-main.jpeg" alt="BIMARIS — Messina da Vivere" />
        </div>
        <div className="brand-hero-copy">
          <div className="kicker">Tra due mari. Un territorio da vivere.</div>
          <p>BIMARIS racconta Messina attraverso luoghi, storie, itinerari e identità capaci di esprimere il territorio oltre i percorsi più scontati.</p>
          <div className="actions">
            <Link className="button" href="/itinerari">Scopri Messina</Link>
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

      <section className="section sand">
        <div className="section-head">
          <div><div className="kicker">Scopri</div><h2>Da dove vuoi iniziare?</h2></div>
          <p>Esplora i contenuti già disponibili su BIMARIS: luoghi, racconti e percorsi verificati dedicati a Messina e allo Stretto.</p>
        </div>
        <div className="category-grid">
          {categories.map(category => (
            <Link className="category" href={category.href} key={category.label} aria-label={`Scopri ${category.label}`}>
              {category.label}
            </Link>
          ))}
        </div>
      </section>

      <section className="section">
        <div className="section-head">
          <div><div className="kicker">Il territorio che vogliamo raccontare</div><h2>Messina oltre le tappe</h2></div>
          <p>BIMARIS cresce come racconto del territorio: cultura, paesaggio, sapori e comunità entreranno progressivamente in una selezione editoriale coerente.</p>
        </div>
        <div className="itinerary-grid">
          {inspirations.map(item => <div className="itinerary itinerary-light" key={item.title}><h3>{item.title}</h3><p>{item.text}</p></div>)}
        </div>
      </section>

      <section className="section dark">
        <div className="section-head">
          <div><div className="kicker">Mappa BIMARIS</div><h2>Messina, intorno a te.</h2></div>
          <p>Una lettura del territorio pensata per collegare luoghi, racconti e percorsi in modo semplice e immediato.</p>
        </div>
        <Link href="/mappa" className="map-shell" style={{display:"block"}}>
          <div className="map-label"><div className="kicker">Esplora</div><h3>Apri la mappa BIMARIS</h3><p>Scopri le aree e i punti di interesse del territorio messinese.</p></div>
        </Link>
      </section>

      <section className="section dark" style={{paddingTop: 10}}>
        <div className="territory-grid">{territories.map(t => <div className="territory" key={t.slug}><h3>{t.name}</h3><p>{t.text}</p></div>)}</div>
      </section>

      <section className="section sand">
        <div className="section-head">
          <div><div className="kicker">Percorsi BIMARIS</div><h2>Scopri Messina attraverso i nostri itinerari</h2></div>
          <Link className="text-link" href="/itinerari">Vedi tutti gli itinerari →</Link>
        </div>
        <p style={{maxWidth: 760, lineHeight: 1.65, color: "var(--muted)", marginBottom: 28}}>Percorsi editoriali costruiti per collegare luoghi, storie e identità del territorio, con tappe e tempi verificati da BIMARIS.</p>
        {homeItineraries.length > 0 ? (
          <div className="cards">
            {homeItineraries.map(item => (
              <Link className="card" href={`/itinerari/${item.slug}`} key={item.id}>
                <div className="card-media" style={item.imageUrl ? {backgroundImage: `linear-gradient(rgba(6,22,36,.18), rgba(6,22,36,.55)), url(${item.imageUrl})`, backgroundSize: "cover", backgroundPosition: "center"} : undefined}>
                  <span>{item.duration}</span>
                </div>
                <div className="card-body">
                  <div className="eyebrow">{item.territory ?? "Messina"}</div>
                  <h3>{item.title}</h3>
                  <p>{item.excerpt}</p>
                  <div className="meta-row"><span>{item.stops.length} tappe</span><span>Scopri il percorso →</span></div>
                </div>
              </Link>
            ))}
          </div>
        ) : (
          <p>Gli itinerari BIMARIS saranno disponibili a breve.</p>
        )}
      </section>

      <section className="section dark">
        <div className="section-head">
          <div><div className="kicker">Per gli operatori</div><h2>Costruiamo la selezione BIMARIS.</h2></div>
          <p>BIMARIS sta costruendo una rete di operatori, produttori ed esperienze capaci di rappresentare Messina con qualità, autenticità e legame con il territorio. Le candidature sono già aperte.</p>
        </div>
        <Link className="button" href="/operatori/candidatura">Presenta la tua realtà</Link>
      </section>
    </>
  );
}
