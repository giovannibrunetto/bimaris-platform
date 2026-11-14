"use client";

import { useState } from "react";
import { createBrowserClient } from "@supabase/ssr";

function client() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ?? process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !key || new URL(url).hostname !== "nzdeoimwikhoidtladnu.supabase.co") return null;
  return createBrowserClient(url, key);
}

export default function AdminIndividualLogin() {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  async function login(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (busy) return;
    setBusy(true);
    setError("");
    try {
      const form = new FormData(event.currentTarget);
      const supabase = client();
      if (!supabase) throw new Error("Ambiente Staging non configurato.");
      const { error: authError } = await supabase.auth.signInWithPassword({
        email: String(form.get("email") ?? ""),
        password: String(form.get("password") ?? ""),
      });
      if (authError) throw new Error("Credenziali non valide.");
      window.location.assign("/admin/mfa");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Accesso non disponibile.");
      setBusy(false);
    }
  }
  async function googleLogin() {
    if (busy) return;
    setBusy(true); setError("");
    const supabase = client();
    if (!supabase) { setError("Ambiente Staging non configurato."); setBusy(false); return; }
    // OAuth PKCE must begin and finish on the same allowlisted origin.
    // Do not silently fall back to Supabase Site URL on ephemeral previews.
    const allowedOrigin = "https://bimaris-platform-git-staging-giovannibrunetto84-1508.vercel.app";
    if (window.location.origin !== allowedOrigin) {
      setError("Accesso Google MFA disponibile soltanto sul dominio Staging autorizzato. Usa email e password per questo collaudo Preview.");
      setBusy(false);
      return;
    }
    const { error: oauthError } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: { redirectTo: allowedOrigin + "/auth/callback?admin=1" },
    });
    if (oauthError) { setError("Accesso Google non disponibile."); setBusy(false); }
  }
  return <form className="admin-login__form" onSubmit={login}>
    <label htmlFor="individual-email">Email individuale</label>
    <input id="individual-email" name="email" type="email" autoComplete="username" required />
    <label htmlFor="individual-password">Password individuale</label>
    <div className="admin-login__password-field">
      <input id="individual-password" name="password" type={showPassword ? "text" : "password"} autoComplete="current-password" required />
      <button type="button" className="admin-login__password-toggle" aria-label={showPassword ? "Nascondi password" : "Mostra password"} aria-pressed={showPassword} onClick={() => setShowPassword(value => !value)}><svg aria-hidden="true" viewBox="0 0 24 24" width="21" height="21" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">{showPassword ? <><path d="M3 3l18 18"/><path d="M10.6 5.2A10.8 10.8 0 0 1 12 5c5.2 0 9.3 4.4 10 7a12.7 12.7 0 0 1-3.2 4.8"/><path d="M6.1 6.1A12.6 12.6 0 0 0 2 12c.7 2.6 4.8 7 10 7 1.5 0 2.9-.4 4.1-1.1"/><path d="M10 10a2.8 2.8 0 0 0 4 4"/></> : <><path d="M2 12s3.6-7 10-7 10 7 10 7-3.6 7-10 7S2 12 2 12Z"/><circle cx="12" cy="12" r="3"/></>}</svg></button>
    </div>
    <button type="button" disabled={busy} onClick={googleLogin}>Continua con Google (Staging)</button>
    {error && <p className="admin-login__error" role="alert">{error}</p>}
    <button type="submit" disabled={busy}>{busy ? "Verifica in corso…" : "Continua con MFA"}</button>
  </form>;
}
