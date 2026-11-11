const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");
const ts = require("typescript");
const file = path.join(__dirname, "../lib/discovery/availability.ts");
const compiled = ts.transpileModule(fs.readFileSync(file, "utf8"), {
  compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 }
}).outputText;
const output = {};
vm.runInNewContext(compiled, { exports: output, Date, Intl, Number, Object });
const { resolveWeeklySlots } = output;
const slot = (dayOfWeek, startTime, endTime, extra = {}) =>
  ({ dayOfWeek, startTime, endTime, active: true, ...extra });
test("Monday maps to ISO 1", () => {
  const slots = resolveWeeklySlots("2026-11-09", [slot(1, "10:00", "12:00")]);
  assert.equal(slots.length, 1);
  assert.equal(slots[0].start, "2026-11-09T09:00:00.000Z");
});
test("Sunday maps to ISO 7", () => {
  assert.equal(resolveWeeklySlots("2026-11-15", [slot(7, "10:00", "12:00")]).length, 1);
});
test("inactive and wrong weekday excluded", () => {
  assert.equal(resolveWeeklySlots("2026-11-09", [slot(1, "10:00", "12:00", {active:false}), slot(2, "10:00", "12:00")]).length, 0);
});
test("validity range is enforced", () => {
  assert.equal(resolveWeeklySlots("2026-11-09", [slot(1, "10:00", "12:00", {validFrom:"2026-11-10"})]).length, 0);
});
test("spring DST nonexistent 02:30 excluded", () => {
  assert.equal(resolveWeeklySlots("2026-03-29", [slot(7, "02:30", "04:00")]).length, 0);
});
test("autumn DST ambiguous 02:30 excluded", () => {
  assert.equal(resolveWeeklySlots("2026-10-25", [slot(7, "02:30", "04:00")]).length, 0);
});
test("summer offset is UTC+2", () => {
  const slots = resolveWeeklySlots("2026-07-06", [slot(1, "10:00", "12:00")]);
  assert.equal(slots[0].start, "2026-07-06T08:00:00.000Z");
});
test("overnight slot ends next day", () => {
  const slots = resolveWeeklySlots("2026-11-09", [slot(1, "23:00", "01:00")]);
  assert.equal(slots[0].end, "2026-11-10T00:00:00.000Z");
});
test("invalid date is rejected", () => {
  assert.equal(resolveWeeklySlots("2026-02-30", [slot(1, "10:00", "12:00")]).length, 0);
});
