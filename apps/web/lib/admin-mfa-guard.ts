import "server-only";
import { createUserServerClient } from "@/lib/supabase/user-server";
import { createServiceClient } from "@/lib/supabase/server";

/**
 * Transitional server-side Super Admin gate for the MFA migration.
 * Integrated behind a legacy-compatible adapter; individual MFA runtime test pending.
 * Fail closed if staging isolation, identity, AAL2 or role lookup fails.
 */
export async function getVerifiedSuperAdmin(): Promise<{ userId: string } | null> {
  // DS-MFA-01/C: this feature branch must never query the production project
  // for individual admin authorization. Check both client and service URLs.
  const expectedHost = "nzdeoimwikhoidtladnu.supabase.co";
  const publicUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  if (!publicUrl) return null;
  try {
    if (new URL(publicUrl).hostname !== expectedHost) return null;
  } catch {
    return null;
  }
  const userClient = await createUserServerClient();
  if (!userClient) return null;

  // getUser validates the session with Supabase Auth; never trust cookie claims alone.
  const { data: sessionData, error: sessionError } = await userClient.auth.getSession();
  const accessToken = sessionData.session?.access_token;
  if (sessionError || !accessToken) return null;

  // A JWT claim is used only as a lookup key; Supabase Auth validates the
  // exact access token below and the privileged RPC validates its session.
  let sessionId: string;
  try {
    const claims = JSON.parse(Buffer.from(accessToken.split(".")[1], "base64url").toString("utf8"));
    if (typeof claims.session_id !== "string" || !/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(claims.session_id)) return null;
    sessionId = claims.session_id;
  } catch {
    return null;
  }

  const { data: identity, error: identityError } = await userClient.auth.getUser(accessToken);
  if (identityError || !identity.user?.id) return null;

  const { data: assurance, error: assuranceError } =
    await userClient.auth.mfa.getAuthenticatorAssuranceLevel();
  if (assuranceError || assurance?.currentLevel !== "aal2") return null;

  // Role lookup is performed via a service-role-only RPC in the exposed public schema.
  // The underlying security.admin_members table remains in an unexposed private schema.
  // No account is active by default; an absent role fails closed.
  const service = createServiceClient();
  if (!service) return null;
  const { data: allowed, error: roleError } = await service.rpc("is_active_super_admin_session", {
    p_user_id: identity.user.id,
    p_session_id: sessionId,
  });
  if (roleError || allowed !== true) return null;
  return { userId: identity.user.id };
}
