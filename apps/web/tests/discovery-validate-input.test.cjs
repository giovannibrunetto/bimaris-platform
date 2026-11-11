const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");
const ts = require("typescript");
const source = fs.readFileSync(path.join(__dirname, "../lib/discovery/validate-input.ts"), "utf8");
const exports = {};
vm.runInNewContext(ts.transpileModule(source, {
  compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 }
}).outputText, { exports, Number, Date });
const validate = exports.validateDiscoveryInput;
test("undated discovery query is allowed", () => {
  assert.equal(validate({ intent: "nature" }).ok, true);
});
test("invalid child age is rejected", () => {
  assert.ok(validate({ children: true, age: -1 }).reasons.includes("invalid_age"));
});
test("unbounded or negative time budget is rejected", () => {
  assert.ok(validate({ maxTotalMinutes: -1 }).reasons.includes("invalid_time_budget"));
});
test("time budget requires verified origin", () => {
  assert.ok(validate({ maxTotalMinutes: 180 }).reasons.includes("origin_unverified"));
});
test("local timestamp without offset is rejected", () => {
  assert.ok(validate({ when: "2026-11-11T18:00:00" }, "2026-11-11T08:00:00Z").reasons.includes("invalid_requested_instant"));
});
test("past requested instant is rejected", () => {
  assert.ok(validate({ when: "2026-11-11T08:00:00Z" }, "2026-11-11T09:00:00Z").reasons.includes("requested_instant_in_past"));
});
test("valid future instant and verified origin pass", () => {
  assert.equal(validate({ when: "2026-11-11T12:00:00Z", maxTotalMinutes: 180, originVerified: true }, "2026-11-11T09:00:00Z").ok, true);
});
