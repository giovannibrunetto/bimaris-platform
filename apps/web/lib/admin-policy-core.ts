/**
 * DS-MFA-01/L I-1 — pure, server-oriented policy engine.
 * Not wired to existing admin routes. Default deny.
 */
export const ADMIN_POLICY = {
  "admin.dashboard": ["read"],
  "admin.analytics": ["read"],
  "admin.applications": ["read", "review", "accept", "reject", "publish"],
  "admin.events": ["read", "approve", "reject"],
  "admin.experiences": ["read", "create", "review", "publish", "unpublish", "feature", "manage_territory"],
  "admin.experience_revisions": ["read", "request_changes", "approve_apply"],
  "admin.collaborations": ["read"],
  "admin.itineraries": ["read", "create", "update", "publish", "manage_stops"],
  "admin.operators": ["read", "update", "select", "publish", "unpublish"],
  "admin.operator_memberships": ["read", "link", "update_role", "revoke"],
  "admin.operator_revisions": ["read", "approve_apply", "reject"],
} as const;

export type AdminResource = keyof typeof ADMIN_POLICY;
export type AdminMode = "individual_required" | "legacy_explicit";
export type AdminIdentity = { userId: string; sessionId?: string; aal: "aal2"; role: "super_admin" };
export type AdminActor = AdminIdentity & { authMethod: "individual"; resource: AdminResource; action: string };
export type AdminDecision = { ok: true; actor: AdminActor } | { ok: false; reason: "unknown_action" | "individual_required" | "identity_unverified" | "permission_denied" | "invalid_mode" };
export type AdminPolicyRequest = { resource: string; action: string; mode: AdminMode };
export type AdminPolicyDependencies = {
  verifyIndividual: () => Promise<AdminIdentity | null>;
  hasPermission?: (identity: AdminIdentity, resource: AdminResource, action: string) => Promise<boolean>;
};

/**
 * Fail-closed by default. No legacy credentials are inspected or accepted.
 * legacy_explicit is reserved for a future, separately authorized mechanism:
 * it NEVER grants access through this policy.
 */
export async function evaluateAdminPolicy(request: AdminPolicyRequest, deps: AdminPolicyDependencies): Promise<AdminDecision> {
  if (!request || typeof request.resource !== "string" || typeof request.action !== "string") return { ok: false, reason: "unknown_action" };
  if (!Object.prototype.hasOwnProperty.call(ADMIN_POLICY, request.resource)) return { ok: false, reason: "unknown_action" };
  const resource = request.resource as AdminResource;
  if (!(ADMIN_POLICY[resource] as readonly string[]).includes(request.action)) return { ok: false, reason: "unknown_action" };
  if (request.mode !== "individual_required" && request.mode !== "legacy_explicit") return { ok: false, reason: "invalid_mode" };
  if (request.mode !== "individual_required") return { ok: false, reason: "individual_required" };
  try {
    const identity = await deps.verifyIndividual();
    if (!identity || identity.aal !== "aal2" || identity.role !== "super_admin" || !identity.userId) return { ok: false, reason: "identity_unverified" };
    if (deps.hasPermission && !(await deps.hasPermission(identity, resource, request.action))) return { ok: false, reason: "permission_denied" };
    return { ok: true, actor: { ...identity, authMethod: "individual", resource, action: request.action } };
  } catch {
    return { ok: false, reason: "identity_unverified" };
  }
}
