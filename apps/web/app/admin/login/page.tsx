import { redirect } from "next/navigation";
import { headers } from "next/headers";
import { resolveAdminEnvironment } from "@/lib/admin-environment";
import { isAuthorizedAdmin } from "@/lib/admin-access";
import AdminIndividualLogin from "./AdminIndividualLogin";
import "./admin-login.css";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export default async function AdminLoginPage() {
  if (await isAuthorizedAdmin()) redirect("/admin");
  const environment = resolveAdminEnvironment();
  if (!environment) return <section className="admin-login"><p role="alert">Accesso amministrativo non disponibile.</p></section>;
  const requestHeaders = await headers();
  const requestHost = requestHeaders.get("host")?.toLowerCase() ?? "";
  const allowedOrigin = environment.origins.find(origin => new URL(origin).host === requestHost);
  if (!allowedOrigin) redirect(environment.loginOrigin + "/admin/login");
  return (
    <section className="admin-login" aria-labelledby="admin-login-title">
      <div className="admin-login__card">
        <div className="admin-login__eyebrow">Area riservata · BIMARIS</div>
        <h1 id="admin-login-title">Amministrazione</h1>
        <p className="admin-login__description">Accesso individuale con autenticazione a due fattori.</p>
        <AdminIndividualLogin allowedOrigin={allowedOrigin} expectedUrl={environment.supabaseUrl} />
        <div className="admin-login__footnote">Accesso consentito esclusivamente agli amministratori autorizzati con MFA attiva.</div>
      </div>
    </section>
  );
}
