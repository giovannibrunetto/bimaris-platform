import { redirect } from "next/navigation";
import { createUserServerClient } from "@/lib/supabase/user-server";
import { createServiceClient } from "@/lib/supabase/server";
import { isAuthorizedAdmin } from "@/lib/admin-access";
import AdminMfaStep from "./AdminMfaStep";
import "../login/admin-login.css";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export default async function AdminMfaPage() {
  if (await isAuthorizedAdmin()) redirect("/admin");
  if (process.env.NEXT_PUBLIC_SUPABASE_URL !== "https://nzdeoimwikhoidtladnu.supabase.co") { console.warn("[DS-MFA-01] mfa_redirect: staging_url_mismatch"); redirect("/admin/login"); }
  const client = await createUserServerClient();
  const { data, error } = client ? await client.auth.getUser() : { data: { user: null }, error: null };
  if (error || !data.user) { console.warn("[DS-MFA-01] mfa_redirect: session_unavailable"); redirect("/admin/login"); }
  const service = createServiceClient();
  if (!service) { console.warn("[DS-MFA-01] mfa_redirect: service_client_unavailable"); redirect("/admin/login"); }
  const { data: allowed, error: roleError } = await service.rpc("is_active_super_admin", { p_user_id: data.user.id });
  if (roleError) { console.warn("[DS-MFA-01] mfa_redirect: authorization_rpc_error"); redirect("/admin/login"); }
  if (allowed !== true) { console.warn("[DS-MFA-01] mfa_redirect: authorization_not_granted"); redirect("/admin/login"); }
  return <section className="admin-login" aria-labelledby="admin-mfa-title">
    <div className="admin-login__card">
      <div className="admin-login__eyebrow">Sicurezza · BIMARIS</div>
      <h1 id="admin-mfa-title">Verifica a due fattori</h1>
      <p className="admin-login__description">Registra il tuo autenticatore individuale oppure inserisci il codice temporaneo.</p>
      <AdminMfaStep />
    </div>
  </section>;
}
