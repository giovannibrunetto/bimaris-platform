import Link from "next/link";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "BIMARIS sta arrivando | Messina da vivere",
  description: "Un nuovo modo di scoprire Messina, i suoi luoghi, le storie e le esperienze. BIMARIS sta arrivando.",
  robots: { index: false, follow: false },
};

export default function ComingSoonPage() {
  return (
    <section style={{ minHeight: "80vh", display: "grid", placeItems: "center", padding: "72px 20px", background: "#032126", color: "#f7f3e9" }}>
      <div style={{ width: "100%", maxWidth: 720, textAlign: "center" }}>
        <p style={{ letterSpacing: ".18em", textTransform: "uppercase", fontSize: 14, opacity: .8 }}>BIMARIS · Messina da vivere</p>
        <h1 style={{ fontSize: "clamp(2.4rem,6vw,4.5rem)", lineHeight: 1.08, margin: "24px 0" }}>Messina ha ancora tanto da raccontarti.</h1>
        <p style={{ fontSize: "clamp(1.05rem,2vw,1.3rem)", lineHeight: 1.7, opacity: .9 }}>Stiamo costruendo un nuovo modo di scoprire luoghi, storie, esperienze e persone del territorio.</p>
        <h2 style={{ marginTop: 32, fontSize: "clamp(1.7rem,4vw,2.5rem)" }}>BIMARIS sta arrivando.</h2>
        <div style={{ marginTop: 44, padding: "24px", border: "1px solid #caa86a", borderRadius: 16, background: "rgba(2, 31, 34, .22)", boxShadow: "0 16px 44px rgba(0, 15, 17, .18), inset 0 0 0 1px rgba(202, 168, 106, .16)" }}>
          <h3 style={{ fontSize: 21, marginBottom: 12 }}>Nuove connessioni. Nuove opportunità.</h3>
          <p style={{ lineHeight: 1.6, opacity: .9 }}>BIMARIS valorizza le attività del territorio, favorisce nuove collaborazioni e crea opportunità per operatori, produttori e professionisti.</p>
          <Link href="/operatori/candidatura" style={{ display: "inline-block", marginTop: 18, padding: "13px 20px", borderRadius: 10, background: "#caa86a", color: "#102c2b", fontWeight: 700, textDecoration: "none" }}>Scopri BIMARIS per la tua attività</Link>
        </div>
        <p style={{ marginTop: 28, fontSize: 13, opacity: .7 }}>La data del lancio sarà comunicata quando la piattaforma sarà pronta.</p>
      </div>
    </section>
  );
}
