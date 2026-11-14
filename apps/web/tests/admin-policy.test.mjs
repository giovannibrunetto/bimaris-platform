import test from "node:test";
import assert from "node:assert/strict";
import { ADMIN_POLICY, evaluateAdminPolicy } from "../lib/admin-policy-core.ts";

const valid = { userId: "test-user", aal: "aal2", role: "super_admin" };
const allow = { verifyIndividual: async () => valid };
const run = (resource, action, mode = "individual_required", deps = allow) =>
  evaluateAdminPolicy({ resource, action, mode }, deps);

test("policy declares only explicit resources and actions", () => {
  assert.equal(Object.keys(ADMIN_POLICY).length, 11);
  assert.ok(ADMIN_POLICY["admin.operator_memberships"].includes("revoke"));
});
test("unknown resource and action fail closed before identity verification", async () => {
  let called = false;
  const deps = { verifyIndividual: async () => { called = true; return valid; } };
  assert.deepEqual(await run("admin.unknown", "read", "individual_required", deps), { ok: false, reason: "unknown_action" });
  assert.deepEqual(await run("admin.operators", "delete_everything", "individual_required", deps), { ok: false, reason: "unknown_action" });
  assert.equal(called, false);
});
test("legacy never authorizes implicitly even if individual verification would pass", async () => {
  let called = false;
  const result = await run("admin.operators", "read", "legacy_explicit", { verifyIndividual: async () => { called = true; return valid; } });
  assert.deepEqual(result, { ok: false, reason: "individual_required" });
  assert.equal(called, false);
});
test("unknown mode fails closed", async () => {
  assert.deepEqual(await run("admin.operators", "read", "dual"), { ok: false, reason: "invalid_mode" });
});
test("AAL1, missing role, revoked session and missing identity fail closed", async () => {
  for (const identity of [null, { ...valid, aal: "aal1" }, { ...valid, role: "viewer" }]) {
    const result = await run("admin.operators", "read", "individual_required", { verifyIndividual: async () => identity });
    assert.equal(result.ok, false);
  }
  assert.equal((await run("admin.operators", "read", "individual_required", { verifyIndividual: async () => { throw Error("revoked"); } })).ok, false);
});
test("AAL2 verified role is allowed only for declared action", async () => {
  const result = await run("admin.operator_memberships", "revoke");
  assert.equal(result.ok, true);
  assert.equal(result.actor.authMethod, "individual");
  assert.equal(result.actor.userId, valid.userId);
});
test("permission checker can deny even a verified super admin", async () => {
  assert.deepEqual(await run("admin.operators", "publish", "individual_required", { ...allow, hasPermission: async () => false }), { ok: false, reason: "permission_denied" });
});
test("permission checker failures fail closed", async () => {
  assert.equal((await run("admin.operators", "publish", "individual_required", { ...allow, hasPermission: async () => { throw Error("db"); } })).ok, false);
});
