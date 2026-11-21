import "server-only";
import { getVerifiedSuperAdmin } from "@/lib/admin-mfa-guard";
import { evaluateAdminPolicy, type AdminPolicyRequest, type AdminDecision } from "@/lib/admin-policy-core";

/**
 * DS-MFA-01/L I-1 — opt-in adapter only.
 * Existing isAuthorizedAdmin(), routes, pages and legacy login remain unchanged.
 * Never use legacy as a fallback for this policy.
 */
export async function authorizeAdmin(request: AdminPolicyRequest): Promise<AdminDecision> {
  return evaluateAdminPolicy(request, {
    verifyIndividual: async () => {
      const verified = await getVerifiedSuperAdmin();
      return verified ? { userId: verified.userId, aal: "aal2", role: "super_admin" } : null;
    },
  });
}
