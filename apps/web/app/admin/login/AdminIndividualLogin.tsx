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
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
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
    <div className="admin-login__password-control">
      <input id="individual-password" name="password" type={showPassword ? "text" : "password"} autoComplete="current-password" required />
      <button type="button" className="admin-login__password-toggle" aria-pressed={showPassword} aria-controls="individual-password" onClick={() => setShowPassword(value => !value)}>{showPassword ? "Nascondi password" : "Mostra password"}</button>
    </div>
    <button type="button" disabled={busy} onClick={googleLogin}>Continua con Google (Staging)</button>
    {error && <p className="admin-login__error" role="alert">{error}</p>}
    <button type="submit" disabled={busy}>{busy ? "Verifica in corso…" : "Continua con MFA"}</button>
  </form>;
}
