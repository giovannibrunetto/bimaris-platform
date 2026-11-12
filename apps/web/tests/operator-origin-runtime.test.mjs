import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import * as ts from "typescript";

// Exercise the real TypeScript guard with a minimal NextResponse stand-in.
// No network, Supabase account, or operator credentials required.
const source = readFileSync(new URL("../lib/operator-request-origin.ts", import.meta.url), "utf8");
const js = ts.transpileModule(source, {
  compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 },
}).outputText;
const mod = { exports: {} };
const fakeNextResponse = {
  json: (body, options) => ({ body, status: options.status }),
};
const mockRequire = (name) => {
  if (name === "server-only") return {};
  if (name === "next/server") return { NextResponse: fakeNextResponse };
  throw new Error(`Unexpected import: ${name}`);
};
new Function("require", "module", "exports", js)(mockRequire, mod, mod.exports);
const guard = mod.exports.rejectCrossSiteOperatorMutation;
const url = "https://preview.example.test/api/operator/collaborations";
const request = (headers) => new Request(url, { method: "POST", headers });

test("same-origin Origin and Fetch Metadata accepted", () => {
  assert.equal(guard(request({ origin: "https://preview.example.test", "sec-fetch-site": "same-origin" })), null);
});
test("same-origin Origin without Fetch Metadata accepted", () => {
  assert.equal(guard(request({ origin: "https://preview.example.test" })), null);
});
test("same-origin Fetch Metadata without Origin accepted", () => {
  assert.equal(guard(request({ "sec-fetch-site": "same-origin" })), null);
});
test("cross-site Origin denied", () => {
  assert.equal(guard(request({ origin: "https://attacker.example" })).status, 403);
});
test("cross-site Fetch Metadata denied even with matching Origin", () => {
  assert.equal(guard(request({ origin: "https://preview.example.test", "sec-fetch-site": "cross-site" })).status, 403);
});
test("same-site but cross-origin Fetch Metadata denied", () => {
  assert.equal(guard(request({ origin: "https://preview.example.test", "sec-fetch-site": "same-site" })).status, 403);
});
test("missing Origin and Fetch Metadata denied", () => {
  assert.equal(guard(request({})).status, 403);
});
test("malformed Origin denied", () => {
  assert.equal(guard(request({ origin: "not a valid origin" })).status, 403);
});
test("Origin on another port denied", () => {
  assert.equal(guard(request({ origin: "https://preview.example.test:444" })).status, 403);
});
