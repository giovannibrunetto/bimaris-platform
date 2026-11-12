import { redirect } from "next/navigation";
import { isAuthorizedAdmin } from "@/lib/admin-access";
import AdminIndividualLogin from "./AdminIndividualLogin";
import "./admin-login.css";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export default async function AdminLoginPage() {
  if (await isAuthorizedAdmin()) redirect("/admin");
  return (
    <section className="admin-login" aria-labelledby="admin-login-title">
      <div className="admin-login__card">
        <div className="admin-login__eyebrow">Area riservata · BIMARIS</div>
        <h1 id="admin-login-title">Amministrazione</h1>
        <p className="admin-login__description">Accesso individuale con autenticazione a due fattori.</p>
        <AdminIndividualLogin />
        <div className="admin-login__footnote">Accesso consentito esclusivamente agli amministratori autorizzati con MFA attiva.</div>
      </div>
    </section>
  );
}
