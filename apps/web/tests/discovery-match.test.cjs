// Run from apps/web: node --test tests/discovery-match.test.cjs
const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");
const ts = require("typescript");
const file = path.join(__dirname, "../lib/discovery/match.ts");
const compiled = ts.transpileModule(fs.readFileSync(file, "utf8"), {
  compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 }
}).outputText;
const exportsObject = {};
vm.runInNewContext(compiled, { exports: exportsObject, Date, Number });
const { matchDiscovery } = exportsObject;
const candidate = (overrides = {}) => ({
  id: "a", published: true, operatorPublished: true, operatorSelected: true,
  discoveryActive: true, intents: ["nature"], childrenAllowed: true,
  minimumAge: null, durationMinutes: 90, destinationVerified: true,
  slots: [{ start: "2026-11-11T10:00:00+01:00", end: "2026-11-11T13:00:00+01:00" }],
  ...overrides
});
test("published approved candidate passes basic filters", () => {
  assert.equal(matchDiscovery([candidate()], { intent: "nature", age: 5 }).accepted.length, 1);
});
for (const [field, value] of [["published", false], ["operatorPublished", false], ["operatorSelected", false], ["discoveryActive", false]]) {
  test("fail closed on " + field, () => assert.equal(matchDiscovery([candidate({ [field]: value })]).accepted.length, 0));
}
test("unrestricted minimumAge null is allowed", () => {
  assert.equal(matchDiscovery([candidate({ minimumAge: null })], { age: 3 }).accepted.length, 1);
});
test("minimum age excludes underage visitor", () => {
  assert.equal(matchDiscovery([candidate({ minimumAge: 12 })], { age: 5 }).accepted.length, 0);
});
test("local time without offset is rejected", () => {
  assert.equal(matchDiscovery([candidate()], { when: "2026-11-11T11:00:00" }).accepted.length, 0);
});
test("offset-aware time inside slot passes", () => {
  assert.equal(matchDiscovery([candidate()], { when: "2026-11-11T11:00:00+01:00" }).accepted.length, 1);
});
test("experience must finish within availability slot", () => {
  assert.equal(matchDiscovery([candidate()], { when: "2026-11-11T12:00:00+01:00" }).accepted.length, 0);
});
test("travel budget includes both legs and duration", () => {
  const q = { maxTotalMinutes: 150, originVerified: true,
    travelByExperience: { a: { verified: true, outboundMinutes: 30, returnMinutes: 35 } } };
  assert.equal(matchDiscovery([candidate()], q).accepted.length, 0);
  assert.equal(matchDiscovery([candidate()], { ...q, maxTotalMinutes: 155 }).accepted.length, 1);
});
test("missing travel estimate fails closed", () => {
  assert.equal(matchDiscovery([candidate()], { maxTotalMinutes: 180, originVerified: true }).accepted.length, 0);
});
test("intent mismatch is excluded", () => {
  assert.equal(matchDiscovery([candidate()], { intent: "sea" }).accepted.length, 0);
});

test("unknown child age cannot bypass a minimum age restriction", () => {
  const result = matchDiscovery([candidate({ minimumAge: 12 })], { children: true });
  assert.equal(result.accepted.length, 0);
  assert.equal(result.excluded[0].reasons.includes("child_age_required"), true);
});
test("unknown child age is allowed when no minimum applies", () => {
  assert.equal(matchDiscovery([candidate({ minimumAge: null })], { children: true }).accepted.length, 1);
});
