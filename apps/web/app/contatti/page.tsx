"use client";
import Link from "next/link";
import { FormEvent, useState } from "react";

export default function ContactPage(){
  const [sent,setSent]=useState(false);
  const [error,setError]=useState("");
  const [sending,setSending]=useState(false);

  async function submit(e:FormEvent<HTMLFormElement>){
    e.preventDefault();
    setError("");
    setSending(true);
    const form = new FormData(e.currentTarget);
    const payload = Object.fromEntries(form.entries());
    try {
      const response = await fetch("/api/contact", {
        method:"POST",
        headers:{"Content-Type":"application/json"},
        body:JSON.stringify(payload),
      });
      if(!response.ok) throw new Error("submit_failed");
      setSent(true);
    } catch {
      setError("Non è stato possibile inviare il messaggio. Riprova tra poco.");
    } finally {
      setSending(false);
    }
  }

  return <>
    <section className="page-hero"><div className="kicker">Contatti</div><h1>Parla con BIMARIS</h1><p>Per informazioni sul progetto, collaborazioni o segnalazioni puoi scriverci direttamente da qui.</p></section>
    <section className="section contact-section">
      {sent ? <div className="detail-panel"><h3>Messaggio inviato</h3><p>Abbiamo ricevuto il tuo messaggio.</p></div> :
      <form className="form contact-form" onSubmit={submit}>
        <label>Nome<input required name="name" /></label>
        <label>Email<input required type="email" name="email" /></label>
        <label className="wide">Oggetto<input name="subject" /></label>
        <label className="wide">Messaggio<textarea required name="message" /></label>
        <label className="wide contact-consent"><span><input required type="checkbox" name="privacy_consent" value="yes" /> Ho letto l'<Link href="/privacy">informativa privacy</Link> e acconsento al trattamento dei dati necessari a rispondere alla richiesta.</span></label>
        {error && <div className="wide detail-panel"><p>{error}</p></div>}
        <div className="wide"><button className="button" type="submit" disabled={sending}>{sending ? "Invio in corso..." : "Invia messaggio"}</button></div>
      </form>}
    </section>
  </>;
}
