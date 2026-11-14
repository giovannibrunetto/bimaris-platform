import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import * as ts from "typescript";

// Exercise the actual operator POST handler with stubbed services.
// No network, secrets, database changes or Vercel deployment required.
const source = readFileSync(new URL("../app/api/admin/operators/route.ts", import.meta.url), "utf8");
const js = ts.transpileModule(source, {
  compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 },
}).outputText;
const endpoint = "https://preview.example.test/api/admin/operators";
const origin = "https://preview.example.test";

async function request(headers, authorized = false) {
  let authCalls = 0;
  let serviceCalls = 0;
  const mockResponse = {
    json: (body, options) => ({ status: options.status, body }),
    redirect: (url, status) => ({ status, location: String(url) }),
  };
  const rejectCrossSiteAdminMutation = (req) => {
    const site = req.headers.get("sec-fetch-site");
    if (site && site !== "same-origin" && site !== "none")
      return mockResponse.json({ ok: false, error: "invalid_site" }, { status: 403 });
    const reqOrigin = req.headers.get("origin");
    if (!reqOrigin && site !== "same-origin")
      return mockResponse.json({ ok: false, error: "missing_origin" }, { status: 403 });
    if (reqOrigin) {
      try {
        if (new URL(reqOrigin).origin !== new URL(req.url).origin)
          return mockResponse.json({ ok: false, error: "invalid_origin" }, { status: 403 });
      } catch {
        return mockResponse.json({ ok: false, error: "invalid_origin" }, { status: 403 });
      }
    }
    return null;
  };
  const fakeRequire = (name) => {
    if (name === "@/lib/admin-request-origin") return { rejectCrossSiteAdminMutation };
    if (name === "next/server") return { NextResponse: mockResponse };
    if (name === "@/lib/admin-access") return {
      isAuthorizedAdmin: async () => { authCalls++; return authorized; },
    };
    if (name === "@/lib/supabase/server") return {
      createServiceClient: () => { serviceCalls++; throw Error("Database must not be accessed"); },
    };
    throw Error(`Unexpected import: ${name}`);
  };
  const mod = { exports: {} };
  new Function("require", "module", "exports", js)(fakeRequire, mod, mod.exports);
  const req = new Request(endpoint, { method: "POST", headers, body: new URLSearchParams() });
  return { response: await mod.exports.POST(req), authCalls, serviceCalls };
}

test("operator POST rejects cross-site origin before authentication and database", async () => {
  const { response, authCalls, serviceCalls } = await request({
    origin: "https://attacker.example", "sec-fetch-site": "cross-site",
  });
  assert.equal(response.status, 403);
  assert.equal(authCalls, 0);
  assert.equal(serviceCalls, 0);
});

test("operator POST rejects missing origin and metadata before database", async () => {
  const { response, authCalls, serviceCalls } = await request({});
  assert.equal(response.status, 403);
  assert.equal(authCalls, 0);
  assert.equal(serviceCalls, 0);
});

test("operator POST rejects same-origin request without admin authorization", async () => {
  const { response, authCalls, serviceCalls } = await request({
    origin, "sec-fetch-site": "same-origin",
  });
  assert.equal(response.status, 303);
  assert.equal(response.location, origin + "/admin/login");
  assert.equal(authCalls, 1);
  assert.equal(serviceCalls, 0);
});
