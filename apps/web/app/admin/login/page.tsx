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
  const isStaging = process.env.NEXT_PUBLIC_SUPABASE_URL === "https://nzdeoimwikhoidtladnu.supabase.co";
  const testOrigin = "https://bimaris-platform-git-fix-dt16-is-347443-giovannibrunetto84-1508.vercel.app";
  const allowedOrigin = isStaging && process.env.VERCEL_ENV === "preview" && requestHost === new URL(testOrigin).host
    ? testOrigin
    : stableOrigin;
  if (isStaging && requestHost !== new URL(allowedOrigin).host) {
    redirect(stableOrigin + "/admin/login");
  }
  return (
    <section className="admin-login" aria-labelledby="admin-login-title">
      <div className="admin-login__card">
        <div className="admin-login__eyebrow">Area riservata · BIMARIS</div>
        <h1 id="admin-login-title">Amministrazione</h1>
        <p className="admin-login__description">Accesso individuale con autenticazione a due fattori.</p>
        <AdminIndividualLogin allowedOrigin={allowedOrigin} />
        <div className="admin-login__footnote">Accesso consentito esclusivamente agli amministratori autorizzati con MFA attiva.</div>
      </div>
    </section>
  );
}
