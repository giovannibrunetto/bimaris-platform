import { redirect } from "next/navigation";
import { isAdminAuthenticated, isAdminConfigured, isAdminTotpEnabled } from "@/lib/admin-auth";
import "./admin-login.css";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export default async function AdminLoginPage({ searchParams }: { searchParams: Promise<{ error?: string }> }) {
  if (await isAdminAuthenticated()) redirect("/admin");

  const { error } = await searchParams;
  const configured = isAdminConfigured();
  const totpEnabled = isAdminTotpEnabled();

  return (
    <section className="admin-login" aria-labelledby="admin-login-title">
      <div className="admin-login__card">
        <div className="admin-login__eyebrow">Area riservata · BIMARIS</div>
        <h1 id="admin-login-title">Amministrazione</h1>
        <p className="admin-login__description">Accedi per gestire candidature, operatori e contenuti in revisione.</p>

        {!configured && (
          <div className="admin-login__notice" role="alert">
            <strong>Accesso non ancora configurato.</strong>
            <p>Configura le credenziali amministrative nelle variabili private dell'ambiente.</p>
          </div>
        )}

        {error === "otp" && <p className="admin-login__error" role="alert">Codice di autenticazione non valido o scaduto.</p>}
        {error === "invalid" && <p className="admin-login__error" role="alert">Password non corretta.</p>}
        {error === "not-configured" && <p className="admin-login__error" role="alert">Password amministratore non configurata.</p>}

        <form method="post" action="/api/admin/login" className="admin-login__form">
          <label htmlFor="admin-password">Password amministratore</label>
          <input id="admin-password" name="password" type="password" autoComplete="current-password" required minLength={12} disabled={!configured} />
          {totpEnabled && (
            <>
              <label htmlFor="admin-otp">Codice di autenticazione</label>
              <input id="admin-otp" name="otp" type="text" inputMode="numeric" pattern="[0-9]{6}" maxLength={6} autoComplete="one-time-code" required placeholder="Codice a 6 cifre" disabled={!configured} />
            </>
          )}
          <button type="submit" disabled={!configured}>Accedi all'amministrazione</button>
        </form>
        <div className="admin-login__footnote">Accesso consentito esclusivamente agli amministratori autorizzati.</div>
      </div>
    </section>
  );
}
