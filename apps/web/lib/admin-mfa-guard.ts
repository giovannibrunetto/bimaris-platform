import "server-only";
import { createUserServerClient } from "@/lib/supabase/user-server";
import { createServiceClient } from "@/lib/supabase/server";

/**
 * Transitional server-side Super Admin gate for the MFA migration.
 * Integrated behind a legacy-compatible adapter; not yet runtime-validated.
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
  const { data: identity, error: identityError } = await userClient.auth.getUser();
  if (identityError || !identity.user?.id) return null;

  const { data: assurance, error: assuranceError } =
    await userClient.auth.mfa.getAuthenticatorAssuranceLevel();
  if (assuranceError || assurance?.currentLevel !== "aal2") return null;

  // Role lookup is performed via a service-role-only RPC in the exposed public schema.
  // The underlying security.admin_members table remains in an unexposed private schema.
  // No account is active by default; an absent role fails closed.
  const service = createServiceClient();
  if (!service) return null;
  const { data: allowed, error: roleError } = await service.rpc("is_active_super_admin", {
    p_user_id: identity.user.id,
  });
  if (roleError || allowed !== true) return null;
  return { userId: identity.user.id };
}
