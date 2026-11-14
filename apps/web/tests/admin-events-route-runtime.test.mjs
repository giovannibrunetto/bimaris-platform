import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import * as ts from "typescript";
import { eventTransition } from "../lib/admin-event-transitions.ts";

// Execute the real event POST handler and origin guard with local fakes only.
// No network, credentials, deployment, or persistent database mutations.
const compile = (path) => ts.transpileModule(readFileSync(new URL(path, import.meta.url), "utf8"), {
  compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 },
}).outputText;
const origin = "https://preview.example.test";
const id = "11111111-1111-4111-8111-111111111111";
const apiJS = compile("../app/api/admin/events/[id]/status/route.ts");
const originJS = compile("../lib/admin-request-origin.ts");

async function invoke({ action = "approve", authorized = true, headers = { origin, "sec-fetch-site": "same-origin" }, eventId = id, rows = [{ id }], dbError = null, dbAvailable = true } = {}) {
  const operations = [];
  let authCalls = 0;
  let serviceCalls = 0;
  const response = {
    json: (body, opts) => ({ status: opts.status, body }),
    redirect: (location, status) => ({ status, location: String(location) }),
  };
  const originModule = { exports: {} };
  new Function("require", "module", "exports", originJS)((name) => {
    if (name === "server-only") return {};
    if (name === "next/server") return { NextResponse: response };
    throw Error("Unexpected origin import: " + name);
  }, originModule, originModule.exports);

  const fakeService = () => ({
    from: (table) => {
      operations.push(["from", table]);
      return {
        update(payload) {
          operations.push(["update", payload]);
          const query = {
            eq(field, value) { operations.push(["eq", field, value]); return query; },
            async select(field) { operations.push(["select", field]); return { data: rows, error: dbError }; },
          };
          return query;
        },
      };
    },
  });
  const mocks = (name) => {
    if (name === "next/server") return { NextResponse: response };
    if (name === "@/lib/admin-request-origin") return originModule.exports;
    if (name === "@/lib/admin-access") return {
      isAuthorizedAdmin: async () => { authCalls++; return authorized; },
    };
    if (name === "@/lib/supabase/server") return {
      createServiceClient: () => { serviceCalls++; return dbAvailable ? fakeService() : null; },
    };
    if (name === "@/lib/admin-event-transitions") return { eventTransition };
    throw Error("Unexpected API import: " + name);
  };
  const mod = { exports: {} };
  new Function("require", "module", "exports", apiJS)(mocks, mod, mod.exports);
  const body = new URLSearchParams();
  if (action !== null) body.set("action", action);
  const request = new Request(origin + "/api/admin/events/" + eventId + "/status", {
    method: "POST", headers, body,
  });
  const result = await mod.exports.POST(request, { params: Promise.resolve({ id: eventId }) });
  return { result, authCalls, serviceCalls, operations };
}

test("cross-site POST is rejected before authorization and database access", async () => {
  const { result, authCalls, serviceCalls } = await invoke({
    headers: { origin: "https://attacker.example", "sec-fetch-site": "cross-site" },
  });
  assert.equal(result.status, 403);
  assert.equal(authCalls, 0);
  assert.equal(serviceCalls, 0);
});

test("POST with no Origin or Fetch Metadata fails closed", async () => {
  const { result, authCalls, serviceCalls } = await invoke({ headers: {} });
  assert.equal(result.status, 403);
  assert.equal(authCalls, 0);
  assert.equal(serviceCalls, 0);
});

test("same-origin non-admin is redirected without database access", async () => {
  const { result, authCalls, serviceCalls } = await invoke({ authorized: false });
  assert.equal(result.status, 303);
  assert.equal(result.location, origin + "/admin/login");
  assert.equal(authCalls, 1);
  assert.equal(serviceCalls, 0);
});

test("invalid event ID and invalid action cannot access database", async () => {
  for (const options of [{ eventId: "not-a-uuid" }, { action: "approve-and-publish" }, { action: null }]) {
    const { result, serviceCalls } = await invoke(options);
    assert.equal(result.status, 303);
    assert.match(result.location, /status=invalid$/);
    assert.equal(serviceCalls, 0);
  }
});

for (const [action, expectedUpdate, expectedStatus, resultStatus] of [
  ["approve", { verification_status: "verified", published: false }, "pending", "approved"],
  ["reject", { verification_status: "rejected", published: false }, "pending", "rejected"],
  ["publish", { published: true }, "verified", "published"],
]) {
  test(action + " is guarded by previous status and published=false", async () => {
    const { result, operations } = await invoke({ action });
    assert.equal(result.status, 303);
    assert.match(result.location, new RegExp("status=" + resultStatus + "$"));
    assert.deepEqual(operations, [
      ["from", "events"],
      ["update", expectedUpdate],
      ["eq", "id", id],
      ["eq", "verification_status", expectedStatus],
      ["eq", "published", false],
      ["select", "id"],
    ]);
  });
}

test("stale/repeated transition returns stale without claiming success", async () => {
  const { result } = await invoke({ action: "publish", rows: [] });
  assert.equal(result.status, 303);
  assert.match(result.location, /status=stale$/);
});

test("database errors and missing service client do not report approval", async () => {
  const failed = await invoke({ dbError: { message: "denied" } });
  assert.match(failed.result.location, /status=error$/);
  const missing = await invoke({ dbAvailable: false });
  assert.match(missing.result.location, /status=error$/);
  assert.deepEqual(missing.operations, []);
});
