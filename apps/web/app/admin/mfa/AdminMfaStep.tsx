"use client";

import { useEffect, useState } from "react";
import { createBrowserClient } from "@supabase/ssr";

type Factor = { id: string; status: string };
function client() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ?? process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !key || new URL(url).hostname !== "nzdeoimwikhoidtladnu.supabase.co") return null;
  return createBrowserClient(url, key);
}

export default function AdminMfaStep() {
  const [factor, setFactor] = useState<Factor | null>(null);
  const [qr, setQr] = useState("");
  const [secret, setSecret] = useState("");
  const [otp, setOtp] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [ready, setReady] = useState(false);

  useEffect(() => {
    let mounted = true;
    const supabase = client();
    if (!supabase) { setError("Ambiente Staging non disponibile."); return; }
    supabase.auth.mfa.listFactors().then(({ data, error: e }) => {
      if (!mounted) return;
      if (e) setError("Impossibile verificare i fattori MFA.");
      else setFactor(data?.totp?.find(f => f.status === "verified") ?? null);
      setReady(true);
    });
    return () => { mounted = false; };
  }, []);

  async function enroll() {
    const supabase = client();
    if (!supabase || busy) return;
    setBusy(true); setError("");
    const { data, error: e } = await supabase.auth.mfa.enroll({ factorType: "totp", friendlyName: "BIMARIS Admin" });
    if (e || !data?.totp) setError("Impossibile registrare il fattore MFA.");
    else {
      setFactor({ id: data.id, status: "unverified" });
      setQr(data.totp.qr_code);
      setSecret(data.totp.secret);
    }
    setBusy(false);
  }

  async function verify(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const supabase = client();
    if (!supabase || !factor || busy) return;
    setBusy(true); setError("");
    const { data: challenge, error: challengeError } = await supabase.auth.mfa.challenge({ factorId: factor.id });
    if (challengeError || !challenge) { setError("Impossibile avviare la verifica."); setBusy(false); return; }
    const { error: verifyError } = await supabase.auth.mfa.verify({ factorId: factor.id, challengeId: challenge.id, code: otp });
    if (verifyError) { setError("Codice non valido o scaduto."); setBusy(false); return; }
    const { data: assurance, error: assuranceError } = await supabase.auth.mfa.getAuthenticatorAssuranceLevel();
    if (assuranceError || assurance?.currentLevel !== "aal2") { setError("Livello MFA non confermato."); setBusy(false); return; }
    window.location.assign("/admin");
  }

  return <div className="admin-login__form">
    {!ready && <p>Verifica dei fattori in corso…</p>}
    {ready && !factor && <button type="button" disabled={busy} onClick={enroll}>Registra autenticatore individuale</button>}
    {qr && <div>
      <p>Scansiona il codice con la tua app Authenticator. Non condividere il codice o la chiave.</p>
      {/* The QR is produced by Supabase Auth, not by an external service. */}
      <img src={qr} alt="QR per registrazione autenticatore" width={220} height={220} />
      <details><summary>Inserimento manuale</summary><code style={{overflowWrap:"anywhere"}}>{secret}</code></details>
    </div>}
    {ready && factor && <form className="admin-login__form" onSubmit={verify}>
      <label htmlFor="admin-individual-otp">Codice temporaneo dell'autenticatore</label>
      <input id="admin-individual-otp" value={otp} onChange={e => setOtp(e.target.value)} type="text" inputMode="numeric" pattern="[0-9]{6}" maxLength={6} autoComplete="one-time-code" required />
      <button type="submit" disabled={busy}>{busy ? "Verifica…" : "Verifica codice MFA"}</button>
    </form>}
    {error && <p role="alert" className="admin-login__error">{error}</p>}
  </div>;
}
