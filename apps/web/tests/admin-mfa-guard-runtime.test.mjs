import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import * as ts from "typescript";

// Execute the actual server-side guard with deterministic Supabase stand-ins.
// These tests never connect to Supabase, use credentials, or mutate data.
const source = readFileSync(new URL("../lib/admin-mfa-guard.ts", import.meta.url), "utf8");
const js = ts.transpileModule(source, {
  compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 },
}).outputText;
const envJs = ts.transpileModule(readFileSync(new URL("../lib/admin-environment.ts", import.meta.url), "utf8"), {
  compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 },
}).outputText;
const envModule = { exports: {} };
new Function("require", "module", "exports", envJs)(() => ({}), envModule, envModule.exports);
const uuid = "11111111-1111-4111-8111-111111111111";
const userId = "22222222-2222-4222-8222-222222222222";
const token = `x.${Buffer.from(JSON.stringify({ session_id: uuid })).toString("base64url")}.y`;
const staging = "https://nzdeoimwikhoidtladnu.supabase.co";

async function runGuard(overrides = {}) {
  const state = {
    publicUrl: staging, env: {}, session: { access_token: token, user: { id: userId } },
    sessionError: null, identity: { user: { id: userId } }, identityError: null,
    aal: "aal2", assuranceError: null, allowed: true, roleError: null,
    serviceAvailable: true, userAvailable: true, ...overrides,
  };
  let rpcCalls = 0;
  const auth = {
    getSession: async () => ({ data: { session: state.session }, error: state.sessionError }),
    getUser: async () => ({ data: state.identity, error: state.identityError }),
    mfa: { getAuthenticatorAssuranceLevel: async () => ({
      data: { currentLevel: state.aal }, error: state.assuranceError,
    }) },
  };
  const fakeRequire = (name) => {
    if (name === "server-only") return {};
    if (name === "@/lib/admin-environment") return { resolveAdminEnvironment: () => envModule.exports.resolveAdminEnvironment({ VERCEL_ENV: "preview", NEXT_PUBLIC_SUPABASE_URL: state.publicUrl ?? undefined, ...state.env }) };
    if (name === "@/lib/supabase/user-server") return {
      createUserServerClient: async () => state.userAvailable ? { auth } : null,
    };
    if (name === "@/lib/supabase/server") return {
      createServiceClient: () => state.serviceAvailable ? {
        rpc: async (fn, params) => {
          rpcCalls++;
          assert.equal(fn, "is_active_super_admin_session");
          assert.deepEqual(params, { p_user_id: userId, p_session_id: uuid });
          return { data: state.allowed, error: state.roleError };
        },
      } : null,
    };
    throw Error(`Unexpected import: ${name}`);
  };
  const mod = { exports: {} };
  new Function("require", "module", "exports", js)(fakeRequire, mod, mod.exports);
  const result = await mod.exports.getVerifiedSuperAdmin();
  return { result, rpcCalls };
}

test("MFA runtime: valid staging aal2 super admin is accepted", async () => {
  assert.deepEqual(await runGuard(), { result: { userId }, rpcCalls: 1 });
});
for (const [name, overrides] of [
  ["missing configuration", { publicUrl: null }],
  ["production URL", { publicUrl: "https://vhvccwvcqdhiovpopsze.supabase.co" }],
  ["unavailable user client", { userAvailable: false }],
  ["missing session", { session: null }],
  ["session lookup error", { sessionError: { message: "unavailable" } }],
  ["invalid token", { session: { access_token: "invalid", user: { id: userId } } }],
  ["unverified user", { identity: { user: null } }],
  ["identity mismatch", { identity: { user: { id: "other" } } }],
  ["identity lookup error", { identityError: { message: "unavailable" } }],
  ["aal1", { aal: "aal1" }],
  ["assurance lookup error", { assuranceError: { message: "unavailable" } }],
  ["missing service client", { serviceAvailable: false }],
  ["revoked admin membership", { allowed: false }],
  ["role lookup error", { roleError: { message: "unavailable" } }],
]) {
  test(`MFA runtime denies ${name}`, async () => {
    const { result } = await runGuard(overrides);
    assert.equal(result, null);
  });
}

const production = "https://vhvccwvcqdhiovpopsze.supabase.co";
const mainProject = "prj_KXD8HdV3hY2ipyN8DAdA7uhp6kgX";
const approvedProduction = { VERCEL_ENV: "production", VERCEL_PROJECT_ID: mainProject, BIMARIS_ADMIN_ENVIRONMENT: "production", BIMARIS_ADMIN_PRODUCTION_ENABLED: "true" };
test("REL-R02: explicitly approved Production configuration passes simulated AAL2 guard", async () => {
  assert.deepEqual(await runGuard({ publicUrl: production, env: approvedProduction }), { result: { userId }, rpcCalls: 1 });
});
for (const [name, overrides] of [
  ["production without opt-in", { publicUrl: production, env: { ...approvedProduction, BIMARIS_ADMIN_PRODUCTION_ENABLED: undefined } }],
  ["production missing project", { publicUrl: production, env: { ...approvedProduction, VERCEL_PROJECT_ID: undefined } }],
  ["production pointing to staging", { env: approvedProduction }],
  ["preview with production opt-in", { publicUrl: production, env: { ...approvedProduction, VERCEL_ENV: "preview" } }],
  ["isolated project", { env: { VERCEL_PROJECT_ID: "prj_NsbtPm214NbbweDhUQvPnSaFM1rH" } }],
  ["survey configuration present", { env: { BIMARIS_SURVEY_PUBLIC_ONLY: "false" } }],
  ["unknown deployment", { env: { VERCEL_ENV: "unknown" } }],
  ["invalid environment selector", { env: { BIMARIS_ADMIN_ENVIRONMENT: "typo" } }],
  ["malformed URL", { publicUrl: "not-a-url" }],
  ["non-HTTPS URL", { publicUrl: staging.replace("https:", "http:") }],
  ["unexpected URL path", { publicUrl: staging + "/other" }],
  ["preview with accidental production flag", { env: { BIMARIS_ADMIN_PRODUCTION_ENABLED: "true" } }],
]) {
  test(`REL-R02 denies ${name} before role RPC`, async () => {
    assert.deepEqual(await runGuard(overrides), { result: null, rpcCalls: 0 });
  });
}
test("REL-R02: authorized Production configuration never bypasses MFA or membership", async () => {
  for (const overrides of [{ aal: "aal1" }, { allowed: false }, { session: null }]) {
    assert.equal((await runGuard({ publicUrl: production, env: approvedProduction, ...overrides })).result, null);
  }
});
