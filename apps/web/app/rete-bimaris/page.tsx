import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Esplora la rete BIMARIS | Operatori ed esperienze",
  description: "Scopri gli operatori aderenti alla rete BIMARIS e le esperienze pubblicate per vivere Messina e il suo territorio.",
};

export default function ReteBimarisPage() {
  return (
    <>
      <section
        className="page-hero discovery-page-hero"
        style={{ background: "linear-gradient(135deg, #0b3040 0%, #061624 58%, #02090f 100%)", color: "#ffffff" }}
      >
        <div className="kicker" style={{ color: "#e0bd78" }}>La rete BIMARIS</div>
        <h1 style={{ color: "#ffffff" }}>Esplora la rete BIMARIS</h1>
        <p style={{ color: "#e2e8ed" }}>
          Scopri le realtà aderenti e le esperienze selezionate per conoscere Messina e il suo territorio.
        </p>
      </section>

      <section className="section sand discovery-page-first">
        <div className="section-head">
          <div>
            <div className="kicker">Due modi di scoprire la rete</div>
            <h2>Operatori ed esperienze.</h2>
          </div>
          <p>Le attività aderenti sono consultabili anche quando non propongono esperienze.</p>
        </div>
        <div className="cards">
          <article className="card">
            <div className="card-body">
              <div className="kicker">Realtà aderenti</div>
              <h3>Operatori BIMARIS</h3>
              <p>Esplora le schede delle attività selezionate e pubblicate nella rete BIMARIS, anche senza esperienze disponibili.</p>
              <Link className="text-link" href="/operatori">Scopri gli operatori →</Link>
            </div>
          </article>
          <article className="card">
            <div className="card-body">
              <div className="kicker">Proposte da vivere</div>
              <h3>Esperienze</h3>
              <p>Scopri le esperienze pubblicate dagli operatori della rete: mare, sapori, natura, cultura e attività del territorio.</p>
              <Link className="text-link" href="/esperienze">Scopri le esperienze →</Link>
            </div>
          </article>
        </div>
      </section>
    </>
  );
}
