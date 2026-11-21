import { redirect } from "next/navigation";
import { headers } from "next/headers";
import { isAuthorizedAdmin } from "@/lib/admin-access";
import AdminIndividualLogin from "./AdminIndividualLogin";
import "./admin-login.css";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export default async function AdminLoginPage() {
  if (await isAuthorizedAdmin()) redirect("/admin");
  // OAuth PKCE cookies belong to the host that initiated the login. Never
  // silently switch an approved preview to another deployment's origin.
  // Use the same stable alias for successive PR deployments; authorize it
  // once in Supabase instead of registering every ephemeral deployment.
  const stagingOrigin = "https://bimaris-platform-git-staging-giovannibrunetto84-1508.vercel.app";
  const stablePreviewOrigin = "https://bimaris-platform-git-integration-cb5b41-giovannibrunetto84-1508.vercel.app";
  const qaPreviewOrigin = "https://bimaris-platform-git-fix-dt16-is-347443-giovannibrunetto84-1508.vercel.app";
  const requestHeaders = await headers();
  const requestHost = requestHeaders.get("host")?.toLowerCase() ?? "";
  const isStaging = process.env.NEXT_PUBLIC_SUPABASE_URL === "https://nzdeoimwikhoidtladnu.supabase.co";
  const previewOrigins = [stablePreviewOrigin, qaPreviewOrigin];
  const currentPreviewOrigin = previewOrigins.find(origin => new URL(origin).host === requestHost);
  // On an unknown ephemeral preview, use the stable preview login explicitly
  // rather than starting a PKCE flow whose callback is not allowlisted.
  if (isStaging && process.env.VERCEL_ENV === "preview" && !currentPreviewOrigin) {
    redirect(stablePreviewOrigin + "/admin/login");
  }
  const allowedOrigin = isStaging && process.env.VERCEL_ENV === "preview"
    ? currentPreviewOrigin ?? stablePreviewOrigin
    : stagingOrigin;
  if (isStaging && process.env.VERCEL_ENV !== "preview" && requestHost !== new URL(stagingOrigin).host) {
    redirect(stagingOrigin + "/admin/login");
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
