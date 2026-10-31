import type { Metadata } from "next";
import Link from "next/link";
import "./culture-compact.css";

export const metadata: Metadata = {
  title: "Cultura a Messina | BIMARIS",
  description: "Lasciati raccontare Messina attraverso epoche e storie collegate, oppure esplora liberamente monumenti, musei e luoghi culturali selezionati da BIMARIS.",
};

export default function CulturePage() {
  return (
    <div className="culture-page culture-landing-page">
      <section className="page-hero discovery-page-hero">
        <h1>Cultura</h1>
        <p>
          Non solo luoghi da visitare. Scegli se farti accompagnare nella storia di Messina oppure esplorare liberamente monumenti, musei e architetture della città.
        </p>
      </section>

      <div className="culture-entry-zone">
        <section className="section culture-entry-section discovery-page-first">
          <div className="culture-entry-head">
            <div>
              <div className="kicker">Due modi di scoprire la città</div>
              <h2>Da dove vuoi iniziare?</h2>
            </div>
            <p>BIMARIS può raccontarti Messina collegando luoghi e periodi storici, oppure lasciarti libero di scegliere direttamente cosa approfondire.</p>
          </div>

          <div className="culture-entry-grid">
            <article className="culture-entry-card culture-entry-card-story">
              <div className="culture-entry-number">01</div>
              <div className="kicker">L'esperienza editoriale BIMARIS</div>
              <h2>Ti racconto Messina</h2>
              <p>
                Entra nella storia della città per epoche e temi. I monumenti non sono più schede isolate: diventano tappe di un racconto che mostra come Messina si è trasformata nel tempo.
              </p>
              <Link className="button" href="/mappa/epoche">Inizia il racconto →</Link>
            </article>

            <article className="culture-entry-card culture-entry-card-places">
              <div className="culture-entry-number">02</div>
              <div className="kicker">Esplorazione libera</div>
              <h2>Esplora i monumenti</h2>
              <p>
                Consulta direttamente tutti i luoghi culturali selezionati da BIMARIS e apri la scheda del monumento, museo o architettura che vuoi conoscere.
              </p>
              <Link className="button ghost" href="/cultura/monumenti">Esplora i luoghi →</Link>
            </article>
          </div>
        </section>
      </div>
    </div>
  );
}