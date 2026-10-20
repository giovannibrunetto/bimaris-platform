"use client";

import Link from "next/link";
import { FormEvent, useState } from "react";
import { track } from "@/lib/analytics";

const fieldStyle = { display: "grid", gap: 8, fontSize: 13, fontWeight: 700, color: "#24323b" } as const;
const inputStyle = { width: "100%", minHeight: 48, padding: "0 14px", border: "1px solid #d7d9d6", borderRadius: 12, background: "#fff", color: "#101820", outline: "none" } as const;

export default function ApplicationPage() {
  const [sent, setSent] = useState(false);
  const [error, setError] = useState("");
  const [sending, setSending] = useState(false);

  async function submit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError("");
    setSending(true);
    const form = new FormData(e.currentTarget);
    const payload = Object.fromEntries(form.entries());

    try {
      const response = await fetch("/api/operator-applications", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (!response.ok) throw new Error("submit_failed");
      await track("operator_application_submitted");
      setSent(true);
    } catch {
      setError("Non è stato possibile inviare la candidatura. Riprova tra poco.");
    } finally {
      setSending(false);
    }
  }

  return (
    <>
      <section style={{ background: "linear-gradient(135deg,#0c3448 0%,#061624 58%,#02090f 100%)", color: "#fff", padding: "clamp(48px,7vw,82px) 6vw" }}>
        <div style={{ maxWidth: 1120, margin: "0 auto" }}>
          <div className="kicker">Per gli operatori</div>
          <h1 style={{ margin: "10px 0 14px", fontFamily: "Georgia,serif", fontSize: "clamp(38px,5vw,64px)", lineHeight: 1.02, color: "#fff" }}>Presenta la tua realtà</h1>
          <p style={{ maxWidth: 760, margin: 0, color: "#dce5ea", fontSize: 17, lineHeight: 1.6 }}>
            BIMARIS seleziona operatori, produttori ed esperienze capaci di rappresentare Messina con qualità, autenticità e forte legame con il territorio.
          </p>
        </div>
      </section>

      <section style={{ padding: "clamp(38px,6vw,72px) 20px", background: "#f7f3eb" }}>
        <div style={{ maxWidth: 920, margin: "0 auto" }}>
          {sent ? (
            <div className="detail-panel">
              <h3>Candidatura ricevuta</h3>
              <p>Grazie per averci presentato la tua realtà. La candidatura sarà valutata in base alla coerenza con il progetto BIMARIS e con i criteri di qualità, autenticità e valore territoriale. L'invio non comporta l'inserimento automatico nella selezione.</p>
              <div className="actions"><Link className="button ghost" href="/operatori">Torna agli operatori</Link></div>
            </div>
          ) : (
            <div style={{ background: "#fff", border: "1px solid #e1d7c7", borderRadius: 22, padding: "clamp(22px,4vw,38px)", boxShadow: "0 16px 45px rgba(7,24,35,.07)" }}>
              <div style={{ marginBottom: 28 }}>
                <div className="eyebrow">Candidatura</div>
                <h2 style={{ margin: "6px 0 7px", fontFamily: "Georgia,serif", fontSize: "clamp(28px,4vw,38px)" }}>Raccontaci chi sei</h2>
                <p style={{ margin: 0, color: "#6e7680", lineHeight: 1.55 }}>Inserisci i dati della tua attività. Valuteremo la proposta prima di attivare l'Area Operatore.</p>
              </div>
              <form onSubmit={submit} onFocus={() => track("operator_application_started")} style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(280px,1fr))", gap: 18 }}>
                <label style={fieldStyle}>Nome attività<input style={inputStyle} required name="business_name" /></label>
                <label style={fieldStyle}>Referente<input style={inputStyle} required name="contact_name" /></label>
                <label style={fieldStyle}>Email<input style={inputStyle} required type="email" name="email" /></label>
                <label style={fieldStyle}>Telefono<input style={inputStyle} name="phone" /></label>
                <label style={fieldStyle}>WhatsApp<input style={inputStyle} name="whatsapp" placeholder="Se diverso dal telefono" /></label>
                <label style={fieldStyle}>Categoria<select style={inputStyle} name="category"><option>Esperienze</option><option>Mare</option><option>Natura</option><option>Gastronomia</option><option>Cultura</option><option>Artigianato</option></select></label>
                <label style={fieldStyle}>Località<input style={inputStyle} required name="location" placeholder="Es. Messina, Milazzo, Taormina" /></label>
                <label style={fieldStyle}>Indirizzo<input style={inputStyle} name="address" placeholder="Sede o punto di incontro" /></label>
                <label style={fieldStyle}>Sito web<input style={inputStyle} name="website" /></label>
                <label style={fieldStyle}>Instagram<input style={inputStyle} name="instagram" placeholder="Profilo o URL" /></label>
                <label style={{ ...fieldStyle, gridColumn: "1 / -1" }}>Raccontaci cosa proponi<textarea required name="description" style={{ ...inputStyle, minHeight: 140, padding: 14, resize: "vertical" }} placeholder="Descrivi brevemente la tua realtà, ciò che proponi e il legame con il territorio." /></label>
                <label style={{ gridColumn: "1 / -1", display: "flex", gap: 10, alignItems: "flex-start", fontSize: 13, color: "#53606a", lineHeight: 1.45 }}>
                  <input required type="checkbox" name="privacy_consent" value="yes" style={{ marginTop: 2, width: 18, height: 18, flex: "0 0 auto" }} />
                  <span>Ho letto l' <Link href="/privacy" style={{ textDecoration: "underline", textUnderlineOffset: 2 }}>informativa privacy</Link> e acconsento al trattamento dei dati necessari alla valutazione della candidatura.</span>
                </label>
                {error && <div className="detail-panel" style={{ gridColumn: "1 / -1" }}><p>{error}</p></div>}
                <div style={{ gridColumn: "1 / -1", paddingTop: 4 }}><button className="button" type="submit" disabled={sending}>{sending ? "Invio in corso..." : "Invia candidatura"}</button></div>
              </form>
            </div>
          )}
        </div>
      </section>
    </>
  );
}
