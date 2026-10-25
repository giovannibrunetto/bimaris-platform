import { redirect } from "next/navigation";
import { isAdminAuthenticated, isAdminConfigured, isAdminTotpEnabled } from "@/lib/admin-auth";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export default async function AdminLoginPage({ searchParams }: { searchParams: Promise<{ error?: string }> }) {
  if (await isAdminAuthenticated()) redirect("/admin");

  const { error } = await searchParams;
  const configured = isAdminConfigured();
  const totpEnabled = isAdminTotpEnabled();

  return (
    <section className="section" style={{ maxWidth: 720, margin: "0 auto" }}>
      <div className="detail-panel">
        <div className="kicker">Area privata</div>
        <h1 style={{ fontFamily: "Georgia,serif", marginBottom: 8 }}>Amministrazione BIMARIS</h1>
        <p className="muted">Accesso riservato alla gestione di candidature, operatori e analytics.</p>

        {!configured && (
          <div style={{ padding: 14, borderRadius: 12, background: "#fff4df", margin: "18px 0" }}>
            <strong>Accesso non ancora configurato.</strong>
            <p style={{ marginBottom: 0 }}>Imposta <code>BIMARIS_ADMIN_PASSWORD</code> (almeno 12 caratteri) e <code>BIMARIS_ADMIN_SESSION_SECRET</code> (almeno 32 caratteri) nelle variabili private Vercel.</p>
          </div>
        )}

        {error === "otp" && <p role="alert" style={{ color: "#9d2626" }}>Codice di autenticazione non valido o scaduto.</p>}
        {error === "invalid" && <p style={{ color: "#9d2626" }}>Password non corretta.</p>}
        {error === "not-configured" && <p style={{ color: "#9d2626" }}>Password amministratore non configurata.</p>}

        <form method="post" action="/api/admin/login" className="form" style={{ gridTemplateColumns: "1fr" }}>
          <label className="wide">
            Password
            <input name="password" type="password" autoComplete="current-password" required minLength={12} disabled={!configured} />
          </label>
          {totpEnabled && <label className="wide">Codice Google Authenticator<input name="otp" type="text" inputMode="numeric" pattern="[0-9]{6}" maxLength={6} autoComplete="one-time-code" required placeholder="6 cifre" disabled={!configured} /></label>}
          <div className="wide">
            <button className="button" type="submit" disabled={!configured}>Accedi</button>
          </div>
        </form>
      </div>
    </section>
  );
}
