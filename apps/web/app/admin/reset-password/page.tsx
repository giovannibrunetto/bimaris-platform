"use client";

import { useEffect, useState } from "react";
import { createBrowserClient } from "@supabase/ssr";

const STAGING_HOST = "nzdeoimwikhoidtladnu.supabase.co";

function authClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ?? process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !key || new URL(url).hostname !== STAGING_HOST) return null;
  return createBrowserClient(url, key);
}

export default function AdminPasswordRecovery() {
  const [ready, setReady] = useState(false);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  const [recovery, setRecovery] = useState(false);
  const [rateLimited, setRateLimited] = useState(false);

  useEffect(() => {
    const supabase = authClient();
    if (!supabase) { setMessage("Recupero disponibile solo in Staging."); return; }
    let active = true;
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event) => {
      if (active && event === "PASSWORD_RECOVERY") { setRecovery(true); setReady(true); }
    });
    // Supabase may process the recovery URL before this component subscribes.
    // A verified session alone is not enough: only a recovery event grants this UI.
    setReady(true);
    return () => { active = false; subscription.unsubscribe(); };
  }, []);

  async function requestReset(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const supabase = authClient();
    if (!supabase || busy || rateLimited) return;
    setBusy(true); setMessage("");
    const email = String(new FormData(event.currentTarget).get("email") ?? "").trim();
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: window.location.origin + "/admin/reset-password",
    });
    setMessage(error ? "Richiesta non completata. Verificare la configurazione dei redirect Staging." : "Se l'indirizzo è registrato, riceverai un link per reimpostare la password.");
    setBusy(false);
  }

  async function updatePassword(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const supabase = authClient();
    if (!supabase || busy || !recovery) return;
    const form = new FormData(event.currentTarget);
    const password = String(form.get("password") ?? "");
    const confirm = String(form.get("confirm") ?? "");
    if (password.length < 12 || password !== confirm) { setMessage("Usa almeno 12 caratteri e conferma la stessa password."); return; }
    setBusy(true); setMessage("");
    const { error } = await supabase.auth.updateUser({ password });
    if (error) { setMessage("Impossibile aggiornare la password. Richiedi un nuovo link."); setBusy(false); return; }
    await supabase.auth.signOut({ scope: "global" });
    window.location.replace("/admin/login");
  }

  return <main style={{maxWidth:480,margin:"8vh auto",padding:24,fontFamily:"Arial,sans-serif"}}>
    <h1>Recupero password amministratore</h1>
    <p>Ambiente di collaudo Staging. Non inserire credenziali di Production.</p>
    {recovery ? <form onSubmit={updatePassword}>
      <label>Nuova password <input name="password" type="password" autoComplete="new-password" minLength={12} required /></label>
      <label>Conferma password <input name="confirm" type="password" autoComplete="new-password" minLength={12} required /></label>
      <button disabled={busy} type="submit">Aggiorna password</button>
    </form> : <form onSubmit={requestReset}>
      <label>Email account di test <input name="email" type="email" autoComplete="email" required /></label>
      <button disabled={!ready || busy || rateLimited} type="submit">Invia link di recupero</button>
    </form>}
    {message && <p role="status">{message}</p>}
  </main>;
}
