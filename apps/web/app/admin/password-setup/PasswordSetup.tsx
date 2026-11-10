"use client";
import { useEffect, useState } from "react";
import { createBrowserClient } from "@supabase/ssr";
const STAGING = "https://nzdeoimwikhoidtladnu.supabase.co";
function getClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ?? process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (url !== STAGING || !key) return null;
  return createBrowserClient(url, key);
}
export default function PasswordSetup() {
  const [email,setEmail] = useState("");
  const [password,setPassword] = useState("");
  const [confirmed,setConfirmed] = useState("");
  const [mode,setMode] = useState<"request"|"update"|"done">("request");
  const [busy,setBusy] = useState(false);
  const [message,setMessage] = useState("");
  useEffect(() => {
    const supabase=getClient();
    if(!supabase) { setMessage("Ambiente Staging non disponibile."); return; }
    let live=true;
    // Supabase SSR processes the PKCE code in the callback route.
    supabase.auth.getUser().then(({data}) => { if(live && data.user) setMode("update"); });
    return () => {live=false;};
  },[]);
  async function request(event:React.FormEvent) {
    event.preventDefault(); if(busy) return;
    const supabase=getClient(); if(!supabase) return;
    setBusy(true);setMessage("");
    await supabase.auth.resetPasswordForEmail(email.trim(),{
      redirectTo: `${window.location.origin}/admin/password-setup/callback`
    });
    // Same response regardless of account existence.
    setMessage("Se l'indirizzo è abilitato, riceverai un collegamento. Controlla anche lo spam.");
    setBusy(false);
  }
  async function update(event:React.FormEvent) {
    event.preventDefault();if(busy)return;
    if(password.length<12 || password!==confirmed){setMessage("Usa almeno 12 caratteri e verifica che le password coincidano.");return;}
    const supabase=getClient();if(!supabase)return;
    setBusy(true);setMessage("");
    const {error}=await supabase.auth.updateUser({password});
    if(error){setMessage("Impossibile aggiornare la password. Richiedi un nuovo collegamento.");setBusy(false);return;}
    await supabase.auth.signOut();
    setPassword("");setConfirmed("");setMode("done");setBusy(false);
  }
  if(mode==="done")return <p>Password impostata. <a href="/admin/login">Accedi e configura MFA</a>.</p>;
  return <div className="admin-login__form">
    {mode==="request" ? <form className="admin-login__form" onSubmit={request}>
      <label htmlFor="setup-email">Email personale</label>
      <input id="setup-email" type="email" required value={email} onChange={e=>setEmail(e.target.value)} autoComplete="email"/>
      <button disabled={busy}>{busy?"Invio…":"Richiedi collegamento"}</button>
    </form> : <form className="admin-login__form" onSubmit={update}>
      <label htmlFor="setup-password">Nuova password (almeno 12 caratteri)</label>
      <input id="setup-password" type="password" minLength={12} required autoComplete="new-password" value={password} onChange={e=>setPassword(e.target.value)}/>
      <label htmlFor="setup-confirm">Conferma password</label>
      <input id="setup-confirm" type="password" minLength={12} required autoComplete="new-password" value={confirmed} onChange={e=>setConfirmed(e.target.value)}/>
      <button disabled={busy}>{busy?"Salvataggio…":"Imposta password"}</button>
    </form>}
    {message && <p role="status">{message}</p>}
  </div>;
}
