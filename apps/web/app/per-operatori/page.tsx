import Link from "next/link";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "BIMARIS per la tua attività | Messina da vivere",
  description: "Scopri come BIMARIS valorizza la tua attività e favorisce nuove collaborazioni sul territorio.",
  robots: { index: false, follow: false },
};

const gold = "#caa86a";
const ivory = "#f7f3e9";
const panel = { border: "1px solid rgba(202,168,106,.55)", borderRadius: 18, padding: "clamp(22px,4vw,34px)", background: "rgba(255,255,255,.035)" } as const;

export default function ForOperatorsPage() {
  return (
    <main style={{ background: "#032126", color: ivory, minHeight: "100vh", padding: "clamp(40px,7vw,80px) 20px" }}>
      <div style={{ maxWidth: 960, margin: "0 auto" }}>
        <Link href="/in-arrivo" style={{ color: gold, textDecoration: "none" }}>← Torna a BIMARIS</Link>
        <p style={{ color: gold, letterSpacing: ".15em", textTransform: "uppercase", fontSize: 13, marginTop: 52 }}>BIMARIS per gli operatori</p>
        <h1 style={{ fontSize: "clamp(2.3rem,6vw,4rem)", lineHeight: 1.12, margin: "14px 0 20px" }}>La tua attività, nuove opportunità.</h1>
        <p style={{ fontSize: "clamp(1rem,2vw,1.2rem)", lineHeight: 1.7, maxWidth: 760, color: "#d6dedd" }}>
          BIMARIS nasce per aiutare le persone a scoprire Messina e il suo territorio. Per chi opera qui, significa valorizzare ciò che offre e creare connessioni utili con altre realtà locali.
        </p>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(250px,1fr))", gap: 18, marginTop: 42 }}>
          <section style={panel}>
            <h2 style={{ color: gold, fontSize: 21, marginTop: 0 }}>Fatti scoprire</h2>
            <p style={{ lineHeight: 1.7, color: "#d6dedd" }}>Le persone cercano luoghi, attività ed esperienze. BIMARIS rende più semplice incontrare chi è interessato a ciò che proponi.</p>
          </section>
          <section style={panel}>
            <h2 style={{ color: gold, fontSize: 21, marginTop: 0 }}>Crea collaborazioni</h2>
            <p style={{ lineHeight: 1.7, color: "#d6dedd" }}>Conosci operatori e produttori con interessi compatibili e scopri possibilità di collaborazione tra attività del territorio.</p>
          </section>
          <section style={panel}>
            <h2 style={{ color: gold, fontSize: 21, marginTop: 0 }}>Comprendi la domanda</h2>
            <p style={{ lineHeight: 1.7, color: "#d6dedd" }}>In futuro, dati aggregati sulle ricerche e sugli interessi degli utenti potranno aiutarti a interpretare nuove opportunità.</p>
          </section>
        </div>
        <section style={{ ...panel, marginTop: 30, textAlign: "center" }}>
          <h2 style={{ fontSize: "clamp(1.5rem,3vw,2rem)", marginTop: 0 }}>Vuoi conoscere meglio BIMARIS?</h2>
          <p style={{ lineHeight: 1.7, color: "#d6dedd" }}>Raccontaci la tua attività e il tuo interesse. Ti terremo aggiornato sul progetto e sulle opportunità dedicate agli operatori.</p>
          <Link href="/operatori/candidatura" style={{ display: "inline-block", background: gold, color: "#102c2b", borderRadius: 10, padding: "14px 22px", fontWeight: 700, textDecoration: "none", marginTop: 12 }}>Presenta la tua attività</Link>
          <p style={{ fontSize: 12, opacity: .75, marginTop: 18 }}>Il modulo attuale è in fase di adeguamento al nuovo percorso informativo.</p>
        </section>
      </div>
    </main>
  );
}
