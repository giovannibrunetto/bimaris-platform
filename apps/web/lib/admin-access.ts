import "server-only";
import { getVerifiedSuperAdmin } from "@/lib/admin-mfa-guard";

/**
 * DS-MFA-01/L-V34: a legacy signed cookie is never sufficient to access admin.
 * The verified gate checks Supabase identity, AAL2 and active membership on
 * every protected server request. It fails closed outside approved Staging.
 */
export async function isAuthorizedAdmin(): Promise<boolean> {
  return (await getVerifiedSuperAdmin()) !== null;
}
