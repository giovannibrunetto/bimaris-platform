import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { createHmac } from "node:crypto";
import * as ts from "typescript";

// Execute the actual server-only rate limiter with a stubbed Supabase RPC.
// No HTTP requests, secrets, or database writes.
const source = readFileSync(new URL("../lib/api-rate-limit.ts", import.meta.url), "utf8");
const js = ts.transpileModule(source, {
  compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 },
}).outputText;
const originalSecret = process.env.BIMARIS_RATE_LIMIT_HMAC_SECRET;
const originalLegacy = process.env.BIMARIS_ADMIN_PASSWORD;
let db;
const mod = { exports: {} };
new Function("require", "module", "exports", js)((name) => {
  if (name === "server-only" || name === "next/server") return {};
  if (name === "node:crypto") return { createHmac };
  if (name === "@/lib/supabase/server") return { createServiceClient: () => db };
  throw new Error(`Unexpected import: ${name}`);
}, mod, mod.exports);
const check = mod.exports.checkApiRateLimit;
const request = (headers = { "x-real-ip": "192.0.2.10" }) => ({ headers: new Headers(headers) });
const setSecrets = (dedicated, legacy = "legacy-must-not-be-used") => {
  if (dedicated === undefined) delete process.env.BIMARIS_RATE_LIMIT_HMAC_SECRET;
  else process.env.BIMARIS_RATE_LIMIT_HMAC_SECRET = dedicated;
  process.env.BIMARIS_ADMIN_PASSWORD = legacy;
};
test.after(() => {
  if (originalSecret === undefined) delete process.env.BIMARIS_RATE_LIMIT_HMAC_SECRET;
  else process.env.BIMARIS_RATE_LIMIT_HMAC_SECRET = originalSecret;
  if (originalLegacy === undefined) delete process.env.BIMARIS_ADMIN_PASSWORD;
  else process.env.BIMARIS_ADMIN_PASSWORD = originalLegacy;
});
test("missing dedicated secret fails closed even with legacy password", async () => {
  setSecrets(undefined);
  db = { rpc: () => { throw Error("RPC must not run"); } };
  assert.equal(await check(request(), "contact"), "unavailable");
});
test("missing DB or IP fails closed", async () => {
  setSecrets("test-secret");
  db = null;
  assert.equal(await check(request(), "contact"), "unavailable");
  db = { rpc: () => { throw Error("RPC must not run"); } };
  assert.equal(await check(request({}), "contact"), "unavailable");
});
test("dedicated secret hashes forwarded IP and passes configured limits to RPC", async () => {
  setSecrets("test-secret");
  let args;
  db = { rpc: async (name, payload) => { args = { name, payload }; return { data: true, error: null }; } };
  assert.equal(await check(request({ "x-vercel-forwarded-for": "192.0.2.15, 198.51.100.4" }), "contact"), "allow");
  assert.equal(args.name, "consume_api_rate_limit");
  assert.deepEqual(args.payload, {
    p_scope: "contact",
    p_actor_hash: createHmac("sha256", "test-secret").update("192.0.2.15").digest("hex"),
    p_max_attempts: 5,
    p_window_seconds: 3600,
  });
});
test("RPC denial returns limited", async () => {
  setSecrets("test-secret");
  db = { rpc: async () => ({ data: false, error: null }) };
  assert.equal(await check(request(), "operator_application"), "limited");
});
test("RPC error or invalid result fails closed", async () => {
  setSecrets("test-secret");
  db = { rpc: async () => ({ data: null, error: { message: "unavailable" } }) };
  assert.equal(await check(request(), "contact"), "unavailable");
  db = { rpc: async () => ({ data: "true", error: null }) };
  assert.equal(await check(request(), "contact"), "unavailable");
});
