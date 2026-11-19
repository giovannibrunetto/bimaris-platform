import type { Metadata } from "next";
import Link from "next/link";
import "./culture-compact.css";

export const metadata: Metadata = {
  title: "Cultura a Messina | BIMARIS",
  description: "Lasciati raccontare Messina attraverso epoche e storie collegate, oppure esplora liberamente monumenti, musei e luoghi culturali selezionati da BIMARIS.",
  alternates: {
    canonical: "/cultura",
  },
};

export default function CulturePage() {
  return (
    <div className="culture-page culture-landing-page">
      <section className="page-hero discovery-page-hero ux-brand-05-hero ux-brand-05-hero--standard">
        <h1>Cultura</h1>
        <p>
          Scopri la storia di Messina attraverso i racconti o esplora i suoi monumenti, musei e architetture.
        </p>
      </section>

      <div className="culture-entry-zone">
        <section className="section culture-entry-section discovery-page-first">
          <div className="culture-entry-grid">
            <Link className="culture-entry-card culture-entry-card-story public-discovery-card" href="/ti-racconto-la-storia-di-messina">
              <div className="kicker">L'esperienza editoriale BIMARIS</div>
              <h2>Ti racconto la storia di Messina</h2>
              <p>
                Segui le epoche della città attraverso i luoghi che raccontano come Messina è cambiata nel tempo.
              </p>
              <span className="button">Inizia il racconto →</span>
            </Link>

            <Link className="culture-entry-card culture-entry-card-places public-discovery-card" href="/cultura/monumenti">
              <div className="kicker">Esplorazione libera</div>
              <h2>Esplora i monumenti</h2>
              <p>
                Scegli un luogo e scopri la sua storia nella scheda dedicata.
              </p>
              <span className="button ghost">Esplora i luoghi →</span>
            </Link>
          </div>
        </section>
      </div>
    </div>
  );
}