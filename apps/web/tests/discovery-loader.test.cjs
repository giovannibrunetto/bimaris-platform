const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");
const ts = require("typescript");
const root = path.join(__dirname, "../lib/discovery");
function transpile(name) {
  return ts.transpileModule(fs.readFileSync(path.join(root, name + ".ts"), "utf8"), {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 }
  }).outputText;
}
function buildLoader(rows, error = null) {
  const modules = {};
  const client = {
    from(table) {
      assert.equal(table, "experiences");
      return {
        select(query) {
          assert.match(query, /experience_availability/);
          return {
            eq() { return this; },
            then(resolve) { return Promise.resolve({ data: rows, error }).then(resolve); }
          };
        }
      };
    }
  };
  function load(name) {
    if (modules[name]) return modules[name];
    const exports = {};
    const requireStub = id => {
      if (id === "server-only") return {};
      if (id === "@/lib/supabase/public") return { createPublicClient: () => client };
      if (id.startsWith("./")) return load(id.slice(2));
      throw new Error("Unexpected module " + id);
    };
    vm.runInNewContext(transpile(name), {
      exports, require: requireStub, Date, Intl, Number, Object, console
    });
    modules[name] = exports;
    return exports;
  }
  return load("load-candidates").loadDiscoveryCandidates;
}
const row = (extra = {}) => ({
  id: "example", duration_minutes: 60, latitude: 38.19, longitude: 15.55,
  published: true, review_status: "approved",
  operator: { published: true, selection_status: "selected" },
  profile: { discovery_active: true, children_allowed: true, minimum_age: null,
    editorial_weight: 1, booking_requirement: null, booking_notice_hours: 0,
    booking_cutoff_time: null, booking_cutoff_day_offset: null },
  interests: [{ intent_key: "nature" }],
  availability: [{ day_of_week: 1, start_time: "10:00:00", end_time: "12:00:00",
    valid_from: null, valid_until: null, active: true }],
  ...extra
});
test("public approved selected candidate is loaded with resolved slot", async () => {
  const result = await buildLoader([row()])("2026-11-09", "2026-11-09T07:00:00Z");
  assert.equal(result.length, 1);
  assert.equal(result[0].slots.length, 1);
});
test("unpublished candidate is never exposed", async () => {
  const result = await buildLoader([row({ published: false })])("2026-11-09", "2026-11-09T07:00:00Z");
  assert.equal(result.length, 0);
});
test("unselected operator is excluded", async () => {
  const result = await buildLoader([row({ operator: { published: true, selection_status: "pending" } })])();
  assert.equal(result.length, 0);
});
test("inactive discovery profile is excluded", async () => {
  const result = await buildLoader([row({ profile: { ...row().profile, discovery_active: false } })])();
  assert.equal(result.length, 0);
});
test("database error fails closed", async () => {
  const result = await buildLoader(null, { message: "simulated error" })();
  assert.equal(result.length, 0);
});
test("without explicit calendar inputs no slots are invented", async () => {
  const result = await buildLoader([row()])();
  assert.equal(result[0].slots.length, 0);
});
