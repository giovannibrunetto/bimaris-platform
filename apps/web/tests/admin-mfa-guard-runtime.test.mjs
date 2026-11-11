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
const uuid = "11111111-1111-4111-8111-111111111111";
const userId = "22222222-2222-4222-8222-222222222222";
const token = `x.${Buffer.from(JSON.stringify({ session_id: uuid })).toString("base64url")}.y`;
const staging = "https://nzdeoimwikhoidtladnu.supabase.co";

async function runGuard(overrides = {}) {
  const state = {
    publicUrl: staging, session: { access_token: token, user: { id: userId } },
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
  const previous = process.env.NEXT_PUBLIC_SUPABASE_URL;
  try {
    if (state.publicUrl === null) delete process.env.NEXT_PUBLIC_SUPABASE_URL;
    else process.env.NEXT_PUBLIC_SUPABASE_URL = state.publicUrl;
    const result = await mod.exports.getVerifiedSuperAdmin();
    return { result, rpcCalls };
  } finally {
    if (previous === undefined) delete process.env.NEXT_PUBLIC_SUPABASE_URL;
    else process.env.NEXT_PUBLIC_SUPABASE_URL = previous;
  }
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
