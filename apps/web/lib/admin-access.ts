import "server-only";
import { isAdminAuthenticated } from "@/lib/admin-auth";
import { getVerifiedSuperAdmin } from "@/lib/admin-mfa-guard";

/**
 * DS-MFA-01/C transitional gate.
 * Legacy remains available ONLY until a separately authorized B8 cutover.
 * Never interpret a missing MFA role table, failed RPC or AAL1 as authorized.
 */
export async function isAuthorizedAdmin(): Promise<boolean> {
  if (await getVerifiedSuperAdmin()) return true;
  return isAdminAuthenticated();
}
