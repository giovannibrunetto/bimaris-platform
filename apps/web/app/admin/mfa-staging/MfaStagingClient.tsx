"use client";

import { useEffect, useState } from "react";
import { createBrowserClient } from "@supabase/ssr";

const STAGING_URL = "https://nzdeoimwikhoidtladnu.supabase.co";
const key = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ?? process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const supabase = key && process.env.NEXT_PUBLIC_SUPABASE_URL === STAGING_URL
  ? createBrowserClient(STAGING_URL, key) : null;

export default function MfaStagingClient() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [code, setCode] = useState("");
  const [factorId, setFactorId] = useState("");
  const [qr, setQr] = useState("");
  const [loggedIn, setLoggedIn] = useState(false);
  const [aal, setAal] = useState("unknown");
  const [status, setStatus] = useState("Ambiente di collaudo. Non utilizzare credenziali personali.");
  const [busy, setBusy] = useState(false);

  async function refresh() {
    if (!supabase) return;
    const { data: user } = await supabase.auth.getUser();
    setLoggedIn(Boolean(user.user && user.user.email === email));
    if (!user.user || user.user.email !== email) {
      setAal("none"); setFactorId(""); setQr(""); return;
    }
    const { data: assurance } = await supabase.auth.mfa.getAuthenticatorAssuranceLevel();
    setAal(assurance?.currentLevel ?? "unknown");
    const { data: factors } = await supabase.auth.mfa.listFactors();
    const verified = factors?.totp?.find(f => f.status === "verified");
    if (verified) setFactorId(verified.id);
  }

  useEffect(() => { void refresh(); }, []);

  async function run(action: () => Promise<void>) {
    setBusy(true);
    try { await action(); await refresh(); }
    catch { setStatus("Operazione non riuscita. Verifica i dati e riprova; nessun segreto è stato registrato."); }
    finally { setBusy(false); setCode(""); }
  }

  async function login() {
    await run(async () => {
      if (!supabase) throw new Error("staging config");
      if (!/^[^\s@]+@bimaris\.invalid$/.test(email)) throw new Error("technical test identity required");
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      setPassword("");
      if (error) throw error;
      setStatus("Login Supabase riuscito. La sola autenticazione non conferisce privilegi amministrativi.");
    });
  }

  async function enroll() {
    await run(async () => {
      if (!supabase) throw new Error("staging config");
      const { data: factors } = await supabase.auth.mfa.listFactors();
      if (factors?.totp?.some(f => f.status === "verified")) {
        setStatus("Fattore già verificato. Utilizza la verifica TOTP."); return;
      }
      const { data, error } = await supabase.auth.mfa.enroll({ factorType: "totp", friendlyName: "BIMARIS Staging Test" });
      if (error || !data?.id || !data.totp?.qr_code) throw error ?? new Error("enroll");
      setFactorId(data.id);
      // QR remains in browser memory; never sent to application logs or documents.
      setQr(data.totp.qr_code);
      setStatus("Scansiona il QR con un'app Authenticator. Non condividere QR o codice.");
    });
  }

  async function verify() {
    await run(async () => {
      if (!supabase || !factorId || !/^\d{6}$/.test(code)) throw new Error("invalid input");
      const { error } = await supabase.auth.mfa.challengeAndVerify({ factorId, code });
      if (error) throw error;
      setQr("");
      setStatus("TOTP verificato. Controlla AAL2; il ruolo amministrativo viene verificato separatamente lato server.");
    });
  }

  async function logout() {
    await run(async () => {
      if (!supabase) throw new Error("staging config");
      const { error } = await supabase.auth.signOut({ scope: "local" });
      if (error) throw error;
      setQr(""); setFactorId(""); setLoggedIn(false); setAal("none");
      setStatus("Logout Supabase richiesto. La revoca immediata delle operazioni privilegiate richiede collaudo separato.");
    });
  }

  return <main style={{ maxWidth: 560, margin: "48px auto", padding: 24 }}>
    <h1>Collaudo MFA individuale — Staging</h1>
    <p>Solo identità tecnica autorizzata. Il login legacy resta separato e invariato.</p>
    <p><strong>Ambiente:</strong> BIMARIS Staging · <strong>AAL:</strong> {aal}</p>
    <p role="status">{status}</p>
    {!supabase ? <p role="alert">Configurazione Staging non valida: operazioni disabilitate.</p> : !loggedIn ? <form onSubmit={e => { e.preventDefault(); void login(); }}>
      <label htmlFor="test-email">Email dell’identità tecnica</label>
      <input id="test-email" type="email" autoComplete="username" value={email} onChange={e => setEmail(e.target.value.trim())} required style={{ display: "block", width: "100%", margin: "12px 0" }} />
      <label htmlFor="test-password">Password dell'identità tecnica</label>
      <input id="test-password" type="password" autoComplete="current-password" value={password} onChange={e => setPassword(e.target.value)} required style={{ display: "block", width: "100%", margin: "12px 0" }} />
      <button type="submit" disabled={busy}>Accedi come account tecnico</button>
    </form> : <section>
      <button disabled={busy || aal === "aal2"} onClick={() => void enroll()}>Registra fattore TOTP di prova</button>
      {qr && <div><p>QR TOTP riservato: non acquisire screenshot.</p><img alt="QR riservato per la registrazione del fattore TOTP" src={qr} width={220} height={220} /></div>}
      {aal !== "aal2" && <form onSubmit={e => { e.preventDefault(); void verify(); }}>
        <label htmlFor="test-totp">Codice TOTP (6 cifre)</label>
        <input id="test-totp" type="text" inputMode="numeric" pattern="[0-9]{6}" maxLength={6} autoComplete="one-time-code" value={code} onChange={e => setCode(e.target.value)} required style={{ display: "block", margin: "12px 0" }} />
        <button type="submit" disabled={busy || !factorId}>Verifica TOTP e AAL2</button>
      </form>}
      <p><button disabled={busy} onClick={() => void logout()}>Logout sessione di prova</button></p>
      <p>Il raggiungimento di AAL2 non implica autorizzazione Super Admin. Verificare separatamente il guard server-side.</p>
    </section>}
  </main>;
}
