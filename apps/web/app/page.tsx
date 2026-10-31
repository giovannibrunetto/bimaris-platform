import Link from "next/link";
import { PrelaunchHome } from "@/components/PrelaunchHome";
import { isPrelaunchEnabled } from "@/lib/prelaunch-mode";

export const revalidate = 300;

const discoveryCategories = [
  { label: "Monumenti e cultura", href: "/cultura" },
  { label: "Miti e leggende", href: "/storie-miti-leggende" },
  { label: "Sapori e territori", href: "/sapori-territori" },
  { label: "Borghi", href: "/borghi" },
  { label: "Esperienze", href: "/esperienze" },
];

export default function Home() {
  if (isPrelaunchEnabled()) return <PrelaunchHome />;

  return (
    <>
      <section className="brand-hero brand-hero-compact">
        <h1 className="sr-only">BIMARIS — Messina da Vivere</h1>
        <div className="brand-hero-visual">
          <img src="/brand/bimaris-home-hero.jpg" alt="BIMARIS — Messina da Vivere" />
        </div>
      </section>

      <section className="section sand home-audience home-visitors" id="visitatori">
        <div className="home-audience-intro">
          <div className="kicker">Sei qui per scoprire Messina?</div>
          <h2>Vivi il territorio con BIMARIS.</h2>
          <p>Scegli ciò che ti interessa e scopri Messina attraverso cultura, storie, territori ed esperienze.</p>
        </div>

        <div className="category-grid home-category-grid">
          {discoveryCategories.map(category => (
            <Link className="category" href={category.href} key={category.label} aria-label={`Scopri ${category.label}`}>
              {category.label}
            </Link>
          ))}
        </div>
      </section>

      <section className="home-journey" aria-labelledby="home-journey-title">
        <div className="home-journey-inner">
          <div className="home-journey-intro">
            <div className="kicker">Il tuo viaggio comincia qui</div>
            <h2 id="home-journey-title">Scopri il mondo BIMARIS.</h2>
            <p>Messina non si scopre in un solo modo. Puoi lasciarti raccontare la città, vivere un’esperienza oppure esplorarla liberamente.</p>
          </div>

          <div className="home-journey-paths home-journey-paths-v2">
            <Link className="home-journey-path home-journey-story" href="/mappa/epoche">
              <span className="home-journey-number">01</span>
              <div className="home-journey-path-copy">
                <span className="home-journey-label">Lasciati raccontare la città</span>
                <h3>Ti racconto Messina</h3>
                <p>Storie, epoche e luoghi collegati in un racconto che ti accompagna dentro l’identità della città.</p>
                <span className="home-journey-action">Scopri i racconti <b>→</b></span>
              </div>
            </Link>

            <div className="home-journey-secondary">
              <Link className="home-journey-path home-journey-experiences" href="/esperienze">
                <span className="home-journey-number">02</span>
                <div className="home-journey-path-copy">
                  <span className="home-journey-label">Vivi il territorio</span>
                  <h3>Esperienze BIMARIS</h3>
                  <p>Degustazioni, mare, natura, visite e attività selezionate per vivere Messina e il suo territorio.</p>
                  <span className="home-journey-action">Scopri le esperienze <b>→</b></span>
                </div>
              </Link>

              <Link className="home-journey-path home-journey-map" href="/mappa">
                <span className="home-journey-number">03</span>
                <div className="home-journey-path-copy">
                  <span className="home-journey-label">Esplora liberamente</span>
                  <h3>Mappa BIMARIS</h3>
                  <p>Scegli ciò che ti incuriosisce e scopri luoghi, cultura ed esperienze direttamente sulla mappa.</p>
                  <span className="home-journey-action">Apri la mappa <b>→</b></span>
                </div>
              </Link>
            </div>
          </div>
        </div>
      </section>

      <section className="section home-audience home-operators">
        <div className="home-operator-inner">
          <div>
            <div className="kicker">Sei un operatore del territorio?</div>
            <h2>Costruiamo insieme il racconto di Messina.</h2>
          </div>
          <div className="home-operator-copy">
            <p>BIMARIS vuole creare una rete di operatori, produttori e realtà del territorio che condividono qualità, autenticità e identità locale.</p>
            <Link className="button" href="/operatori/candidatura">Scopri come partecipare</Link>
          </div>
        </div>
      </section>
    </>
  );
}
