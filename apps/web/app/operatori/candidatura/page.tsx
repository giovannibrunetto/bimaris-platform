"use client";

import Link from "next/link";
import { FormEvent, useState } from "react";
import { track } from "@/lib/analytics";

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
      <section className="page-hero">
        <div className="kicker">Per gli operatori</div>
        <h1>Presenta la tua realtà</h1>
        <p>
          BIMARIS sta costruendo una selezione di operatori, produttori ed esperienze capaci di rappresentare Messina con qualità, autenticità e forte legame con il territorio.
        </p>
      </section>

      <section className="section">
        {sent ? (
          <div className="detail-panel">
            <h3>Candidatura ricevuta</h3>
            <p>
              Grazie per averci presentato la tua realtà. La candidatura sarà valutata in base alla coerenza con il progetto BIMARIS e con i criteri di qualità, autenticità e valore territoriale. L'invio non comporta l'inserimento automatico nella selezione.
            </p>
            <div className="actions">
              <Link className="button ghost" href="/operatori">Torna agli operatori</Link>
            </div>
          </div>
        ) : (
          <form className="form" onSubmit={submit} onFocus={() => track("operator_application_started")}>
            <label>Nome attività<input required name="business_name" /></label>
            <label>Referente<input required name="contact_name" /></label>
            <label>Email<input required type="email" name="email" /></label>
            <label>Telefono<input name="phone" /></label>
            <label>WhatsApp<input name="whatsapp" placeholder="Se diverso dal telefono" /></label>
            <label>Categoria
              <select name="category">
                <option>Esperienze</option>
                <option>Mare</option>
                <option>Natura</option>
                <option>Gastronomia</option>
                <option>Cultura</option>
                <option>Artigianato</option>
              </select>
            </label>
            <label>Località<input required name="location" placeholder="Es. Messina, Milazzo, Taormina" /></label>
            <label>Indirizzo<input name="address" placeholder="Sede o punto di incontro" /></label>
            <label className="wide">Sito web<input name="website" /></label>
            <label className="wide">Instagram<input name="instagram" placeholder="Profilo o URL" /></label>
            <label className="wide">Raccontaci cosa proponi<textarea required name="description" /></label>
            <label className="wide privacy-check">
              <input required type="checkbox" name="privacy_consent" value="yes" />
              <span>Ho letto l'<Link href="/privacy">informativa privacy</Link> e acconsento al trattamento dei dati necessari alla valutazione della candidatura.</span>
            </label>
            {error && <div className="wide detail-panel"><p>{error}</p></div>}
            <div className="wide"><button className="button" type="submit" disabled={sending}>{sending ? "Invio in corso..." : "Invia candidatura"}</button></div>
          </form>
        )}
      </section>
    </>
  );
}
