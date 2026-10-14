import { redirect } from "next/navigation";
import { isAdminAuthenticated, isAdminConfigured } from "@/lib/admin-auth";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export default async function AdminLoginPage({ searchParams }: { searchParams: Promise<{ error?: string }> }) {
  if (await isAdminAuthenticated()) redirect("/admin");

  const { error } = await searchParams;
  const configured = isAdminConfigured();

  return (
    <section className="section" style={{ maxWidth: 720, margin: "0 auto" }}>
      <div className="detail-panel">
        <div className="kicker">Area privata</div>
        <h1 style={{ fontFamily: "Georgia,serif", marginBottom: 8 }}>Amministrazione BIMARIS</h1>
        <p className="muted">Accesso riservato alla gestione di candidature, operatori e analytics.</p>

        {!configured && (
          <div style={{ padding: 14, borderRadius: 12, background: "#fff4df", margin: "18px 0" }}>
            <strong>Accesso non ancora configurato.</strong>
            <p style={{ marginBottom: 0 }}>Imposta la variabile privata <code>BIMARIS_ADMIN_PASSWORD</code> su Vercel con una password di almeno 12 caratteri.</p>
          </div>
        )}

        {error === "invalid" && <p style={{ color: "#9d2626" }}>Password non corretta.</p>}
        {error === "not-configured" && <p style={{ color: "#9d2626" }}>Password amministratore non configurata.</p>}

        <form method="post" action="/api/admin/login" className="form" style={{ gridTemplateColumns: "1fr" }}>
          <label className="wide">
            Password
            <input name="password" type="password" autoComplete="current-password" required minLength={12} disabled={!configured} />
          </label>
          <div className="wide">
            <button className="button" type="submit" disabled={!configured}>Accedi</button>
          </div>
        </form>
      </div>
    </section>
  );
}
