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

  // The security.admin_members table is intentionally not created by this commit.
  // A missing table, missing role or revoked membership must deny access.
  const service = createServiceClient();
  if (!service) return null;
  const { data: membership, error: membershipError } = await service
    .schema("security")
    .from("admin_members")
    .select("user_id,role,active")
    .eq("user_id", identity.user.id)
    .eq("role", "super_admin")
    .eq("active", true)
    .maybeSingle();

  if (membershipError || !membership) return null;
  return { userId: identity.user.id };
}
