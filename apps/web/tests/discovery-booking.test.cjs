const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");
const ts = require("typescript");
const cache = new Map();
function load(name) {
  if (cache.has(name)) return cache.get(name);
  const file = path.join(__dirname, "../lib/discovery", name + ".ts");
  const compiled = ts.transpileModule(fs.readFileSync(file, "utf8"), {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 }
  }).outputText;
  const out = {};
  const requireLocal = (id) => id === "./availability" ? load("availability") : require(id);
  vm.runInNewContext(compiled, { exports: out, require: requireLocal, Date, Intl, Number, Object });
  cache.set(name, out);
  return out;
}
const { evaluateAvailability } = load("booking");
const monday = [{ dayOfWeek: 1, startTime: "10:00:00", endTime: "12:00:00", active: true }];
const rules = { requirement: null, noticeHours: null, cutoffTime: null, cutoffDayOffset: null };
test("available Monday slot after reference time", () => {
  const result = evaluateAvailability("2026-11-09", monday, rules, "2026-11-09T07:00:00Z");
  assert.equal(result.status, "eligible");
  assert.equal(result.slots.length, 1);
});
test("minimum booking notice preserves later portion of an open window", () => {
  const result = evaluateAvailability("2026-11-09", monday, { ...rules, noticeHours: 3 }, "2026-11-09T07:00:00Z");
  assert.equal(result.status, "eligible");
  assert.equal(result.slots[0].start, "2026-11-09T10:00:00.000Z");
});
test("booking cutoff is conservatively blocked", () => {
  const result = evaluateAvailability("2026-11-09", monday, { ...rules, cutoffTime: "18:00:00" }, "2026-11-08T10:00:00Z");
  assert.equal(result.reason, "booking_cutoff_requires_resolution");
});
test("negative notice is invalid", () => {
  const result = evaluateAvailability("2026-11-09", monday, { ...rules, noticeHours: -1 }, "2026-11-08T10:00:00Z");
  assert.equal(result.reason, "invalid_booking_notice");
});
test("missing verified slots cannot be promoted", () => {
  const result = evaluateAvailability("2026-11-09", [], rules, "2026-11-08T10:00:00Z");
  assert.equal(result.slots.length, 0);
});
test("reference time without timezone is rejected", () => {
  const result = evaluateAvailability("2026-11-09", monday, rules, "2026-11-08T10:00:00");
  assert.equal(result.reason, "invalid_reference_instant");
});

test("notice threshold after closing excludes the entire window", () => {
  const result = evaluateAvailability("2026-11-09", monday, { ...rules, noticeHours: 5 }, "2026-11-09T07:00:00Z");
  assert.equal(result.status, "unconfirmed");
  assert.equal(result.slots.length, 0);
});
