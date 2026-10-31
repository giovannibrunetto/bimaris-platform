import Link from "next/link";
import { PrelaunchHome } from "@/components/PrelaunchHome";
import { isPrelaunchEnabled } from "@/lib/prelaunch-mode";
import "./home-journey-v2.css";

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
            <p>Messina non si scopre in un solo modo. Puoi entrare nella sua storia, vivere un’esperienza oppure esplorarla liberamente.</p>
          </div>

          <div className="home-journey-paths home-journey-paths-v2">
            <Link className="home-journey-path home-journey-story" href="/mappa/epoche">
              <span className="home-journey-number">01</span>
              <div className="home-journey-path-copy">
                <span className="home-journey-label">Entra nella storia della città</span>
                <h3>Ti racconto Messina</h3>
                <p>Epoche, eventi e luoghi si collegano per farti conoscere Messina attraverso le sue storie.</p>
                <span className="home-journey-action">Inizia a scoprire <b>→</b></span>
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
            <h2>Porta la tua attività dentro BIMARIS.</h2>
          </div>
          <div className="home-operator-copy">
            <p>Entra nella rete di operatori, produttori e realtà locali che condividono qualità, autenticità e identità del territorio.</p>
            <Link className="button" href="/operatori/candidatura">Scopri come partecipare</Link>
          </div>
        </div>
      </section>
    </>
  );
}
