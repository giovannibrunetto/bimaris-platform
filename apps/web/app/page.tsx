import Link from "next/link";
import { ExperienceCard } from "@/components/ExperienceCard";
import { getActiveTerritories, getPublishedExperiences } from "@/data/live";
import { itineraries, events } from "@/data/mock";

export const revalidate = 300;

const categories = ["Mangiare", "Esperienze", "Mare", "Natura", "Cultura", "Shopping e artigianato", "Famiglia", "Vicino a te"];

export default async function Home() {
  const [experiences, territories] = await Promise.all([
    getPublishedExperiences(),
    getActiveTerritories(),
  ]);

  return (
    <>
      <section className="hero">
        <div className="hero-content">
          <div className="kicker">Tra due mari. Un territorio da vivere.</div>
          <h1>BIMARIS</h1>
          <h2>Messina da Vivere</h2>
          <p>Esperienze, sapori e luoghi selezionati per chi vuole conoscere Messina oltre i percorsi più scontati.</p>
          <div className="search-box">
            <input aria-label="Cerca" placeholder="Cosa vuoi fare a Messina?" />
            <Link className="button" href="/esperienze">Scopri</Link>
          </div>
          <div className="actions">
            <Link className="button" href="/esperienze">Scopri Messina</Link>
            <Link className="button secondary" href="/mappa">Esplora la mappa</Link>
          </div>
        </div>
      </section>

      <section className="section sand">
        <div className="section-head"><div><div className="kicker">Scopri</div><h2>Cosa vuoi vivere oggi?</h2></div><p>Non serve sapere già cosa cercare. BIMARIS organizza il territorio per esperienze e interessi.</p></div>
        <div className="category-grid">{categories.map(c => <div className="category" key={c}>{c}</div>)}</div>
      </section>

      <section className="section">
        <div className="section-head"><div><div className="kicker">Selezionati da BIMARIS</div><h2>Esperienze in evidenza</h2></div><Link className="text-link" href="/esperienze">Vedi tutte →</Link></div>
        <div className="cards">{experiences.filter(e => e.featured).map(e => <ExperienceCard key={e.id} experience={e} />)}</div>
      </section>

      <section className="section dark">
        <div className="section-head"><div><div className="kicker">Mappa intelligente</div><h2>Messina, intorno a te.</h2></div><p>La versione definitiva collegherà operatori, esperienze, filtri e geolocalizzazione in tempo reale.</p></div>
        <Link href="/mappa" className="map-shell" style={{display:"block"}}>
          <div className="map-label"><div className="kicker">Esplora</div><h3>Apri la mappa BIMARIS</h3><p>Trova esperienze e luoghi in base alla posizione e ai tuoi interessi.</p></div>
        </Link>
      </section>

      <section className="section dark" style={{paddingTop: 10}}>
        <div className="territory-grid">{territories.map(t => <div className="territory" key={t.slug}><h3>{t.name}</h3><p>{t.text}</p></div>)}</div>
      </section>

      <section className="section sand">
        <div className="section-head"><div><div className="kicker">Percorsi</div><h2>Itinerari BIMARIS</h2></div><Link className="text-link" href="/itinerari">Tutti gli itinerari →</Link></div>
        <div className="itinerary-grid">{itineraries.map(i => <div className="itinerary" style={{background:"white", borderColor:"#dfe4e8"}} key={i.title}><div className="eyebrow">{i.target}</div><h3>{i.title}</h3><p>{i.duration} · {i.stops} tappe</p></div>)}</div>
      </section>

      <section className="section">
        <div className="section-head"><div><div className="kicker">Agenda</div><h2>Cosa succede a Messina</h2></div><Link className="text-link" href="/eventi">Calendario →</Link></div>
        <ul className="list">{events.map(e => <li key={e.title}><strong>{e.date}</strong> · {e.title} — {e.place} <span className="eyebrow">{e.category}</span></li>)}</ul>
      </section>

      <section className="section dark">
        <div className="section-head"><div><div className="kicker">Per gli operatori</div><h2>Vuoi farne parte?</h2></div><p>BIMARIS sta selezionando operatori, produttori ed esperienze d'eccellenza del territorio. La candidatura non comporta l'inserimento automatico.</p></div>
        <Link className="button" href="/operatori/candidatura">Presenta la tua candidatura</Link>
      </section>
    </>
  );
}
