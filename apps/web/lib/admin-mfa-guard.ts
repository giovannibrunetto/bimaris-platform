import "server-only";
import { createUserServerClient } from "@/lib/supabase/user-server";
import { createServiceClient } from "@/lib/supabase/server";

/**
 * Proposed server-side Super Admin gate for the MFA migration.
 * NOT wired into routes yet. Requires a reviewed private admin role schema.
 * Fails closed until that schema is deployed and populated.
 */
export async function getVerifiedSuperAdmin(): Promise<{ userId: string } | null> {
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
