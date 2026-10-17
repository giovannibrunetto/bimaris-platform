"use client";

import Link from "next/link";
import { FormEvent, useState } from "react";
import { createBrowserSupabaseClient } from "@/lib/supabase/browser";

export default function AccediPage() {
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);

  async function sendMagicLink(event: FormEvent) {
    event.preventDefault();
    const supabase = createBrowserSupabaseClient();
    if (!supabase) {
      setMessage("Accesso non disponibile in questo momento.");
      return;
    }

    setLoading(true);
    setMessage("");
    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: { emailRedirectTo: `${window.location.origin}/auth/callback?next=/profilo` },
    });
    setLoading(false);
    setMessage(error ? "Non è stato possibile inviare il link. Riprova." : "Controlla la tua email: ti abbiamo inviato il link per accedere a BIMARIS.");
  }

  return (
    <div className="container" style={{ padding: "56px 20px 80px", maxWidth: 760 }}>
      <div className="kicker">Il tuo BIMARIS</div>
      <h1 style={{ marginBottom: 12 }}>Accedi e costruisci la tua Messina</h1>
      <p style={{ maxWidth: 620, marginBottom: 30 }}>Salva luoghi ed esperienze e, nel tempo, ricevi suggerimenti più vicini ai tuoi interessi.</p>

      <div className="card" style={{ padding: 26, display: "grid", gap: 18 }}>
        <form onSubmit={sendMagicLink} style={{ display: "grid", gap: 12 }}>
          <label htmlFor="email"><strong>Email</strong></label>
          <input id="email" type="email" required value={email} onChange={e => setEmail(e.target.value)} placeholder="nome@email.it" style={{ minHeight: 48, borderRadius: 12, border: "1px solid rgba(0,0,0,.18)", padding: "0 14px", font: "inherit" }} />
          <button className="button" type="submit" disabled={loading}>{loading ? "Invio…" : "Ricevi il link di accesso"}</button>
        </form>
        {message && <p role="status" style={{ margin: 0 }}>{message}</p>}
        <p style={{ margin: 0, fontSize: 14, opacity: .72 }}>Accedendo accetti le condizioni d'uso e confermi di aver letto l'informativa privacy. L'iscrizione alla newsletter resta separata e facoltativa.</p>
      </div>

      <p style={{ marginTop: 22 }}><Link href="/">← Torna a BIMARIS</Link></p>
    </div>
  );
}
