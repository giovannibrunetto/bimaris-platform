import { redirect } from "next/navigation";
import { headers } from "next/headers";
import { isAuthorizedAdmin } from "@/lib/admin-access";
import AdminIndividualLogin from "./AdminIndividualLogin";
import "./admin-login.css";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export default async function AdminLoginPage() {
  if (await isAuthorizedAdmin()) redirect("/admin");
  // The Google OAuth PKCE flow is intentionally pinned to one stable Staging origin.
  // Redirect before rendering the button, avoiding a misleading first click that only navigates.
  const stableOrigin = "https://bimaris-platform-git-integration-cb5b41-giovannibrunetto84-1508.vercel.app";
  const requestHeaders = await headers();
  const requestHost = requestHeaders.get("host")?.toLowerCase() ?? "";
  if (process.env.NEXT_PUBLIC_SUPABASE_URL === "https://nzdeoimwikhoidtladnu.supabase.co" &&
      requestHost !== new URL(stableOrigin).host) {
    redirect(stableOrigin + "/admin/login");
  }
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
