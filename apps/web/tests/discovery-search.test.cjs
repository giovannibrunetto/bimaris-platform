const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");
const ts = require("typescript");
const source = fs.readFileSync(path.join(__dirname, "../lib/discovery/search.ts"), "utf8");
const compiled = ts.transpileModule(source, {
  compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 }
}).outputText;
function createSearch(candidates) {
  const calls = [];
  const exports = {};
  const matchDiscovery = (items, query) => ({ accepted: items, query });
  vm.runInNewContext(compiled, {
    exports, Date, Intl, Number,
    require(id) {
      if (id === "server-only") return {};
      if (id === "./load-candidates") return {
        loadDiscoveryCandidates: async (date, now) => { calls.push({ date, now }); return candidates; }
      };
      if (id === "./match") return { matchDiscovery };
      if (id === "./validate-input") return { validateDiscoveryInput: (query, now) => {
        if (query.when && (!now || !/Z|[+-]\\d\\d:\\d\\d$/.test(query.when) || Date.parse(query.when) < Date.parse(now))) return { ok: false, reasons: ["invalid_requested_instant"] };
        return { ok: true, query };
      } };
      throw Error("Unexpected dependency: " + id);
    }
  });
  return { search: exports.searchDiscovery, calls };
}
test("offset-aware query uses Europe/Rome calendar day", async () => {
  const { search, calls } = createSearch([]);
  await search({ when: "2026-11-11T23:30:00Z" }, "2026-11-11T20:00:00Z");
  assert.equal(calls[0].date, "2026-11-12");
  assert.equal(calls[0].now, "2026-11-11T20:00:00Z");
});
test("summer DST conversion uses Rome local date", async () => {
  const { search, calls } = createSearch([]);
  await search({ when: "2026-07-11T22:30:00Z" }, "2026-07-11T20:00:00Z");
  assert.equal(calls[0].date, "2026-07-12");
});
test("unqualified local timestamp cannot resolve availability", async () => {
  const { search, calls } = createSearch([]);
  await search({ when: "2026-11-11T12:00:00" }, "2026-11-11T08:00:00Z");
  assert.equal(calls.length, 0);
});
test("missing trusted reference time cannot resolve availability", async () => {
  const { search, calls } = createSearch([]);
  await search({ when: "2026-11-11T12:00:00+01:00" });
  assert.equal(calls.length, 0);
});
test("search forwards candidates and query to matcher without writes", async () => {
  const candidate = { id: "test" };
  const { search } = createSearch([candidate]);
  const result = await search({ intent: "nature" });
  assert.equal(result.accepted[0].id, "test");
  assert.equal(result.query.intent, "nature");
});

test("dated search without trusted reference is forced to fail closed", async () => {
  const { search } = createSearch([{ id: "candidate" }]);
  const result = await search({ when: "2026-11-11T12:00:00+01:00" });
  assert.equal(result.accepted.length, 0);
  assert.ok(result.inputErrors.length > 0);
});
test("dated search in the past is forced to fail closed", async () => {
  const { search } = createSearch([{ id: "candidate" }]);
  const result = await search({ when: "2026-11-11T10:00:00+01:00" }, "2026-11-11T12:00:00+01:00");
  assert.equal(result.accepted.length, 0);
  assert.ok(result.inputErrors.length > 0);
});

test("invalid dated request never queries Supabase", async () => {
  const { search, calls } = createSearch([{ id: "candidate" }]);
  const result = await search({ when: "not-a-date" }, "2026-11-11T09:00:00Z");
  assert.equal(calls.length, 0);
  assert.equal(result.accepted.length, 0);
  assert.ok(result.inputErrors.length > 0);
});
test("past dated request never queries Supabase", async () => {
  const { search, calls } = createSearch([{ id: "candidate" }]);
  const result = await search({ when: "2026-11-11T08:00:00Z" }, "2026-11-11T09:00:00Z");
  assert.equal(calls.length, 0);
  assert.equal(result.accepted.length, 0);
  assert.ok(result.inputErrors.length > 0);
});
