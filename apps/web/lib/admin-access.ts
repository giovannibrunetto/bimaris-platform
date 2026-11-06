import "server-only";
import { isAdminAuthenticated } from "@/lib/admin-auth";
import { getVerifiedSuperAdmin } from "@/lib/admin-mfa-guard";

/**
 * DS-MFA-01/C transitional gate.
 * B8 has NOT been authorized: the existing signed-cookie admin path stays active.
 * Check it first to avoid unnecessary Auth/RPC calls (and accidental production
 * Auth traffic) for an already-valid legacy admin session.
 *
 * This is NOT an MFA enforcement gate while legacy access remains enabled.
 */
export async function isAuthorizedAdmin(): Promise<boolean> {
  if (await isAdminAuthenticated()) return true;
  return (await getVerifiedSuperAdmin()) !== null;
}
