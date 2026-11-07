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
  return <form className="admin-login__form" onSubmit={login}>
    <label htmlFor="individual-email">Email individuale</label>
    <input id="individual-email" name="email" type="email" autoComplete="username" required />
    <label htmlFor="individual-password">Password individuale</label>
    <input id="individual-password" name="password" type="password" autoComplete="current-password" required />
    {error && <p className="admin-login__error" role="alert">{error}</p>}
    <button type="submit" disabled={busy}>{busy ? "Verifica in corso…" : "Continua con MFA"}</button>
  </form>;
}
