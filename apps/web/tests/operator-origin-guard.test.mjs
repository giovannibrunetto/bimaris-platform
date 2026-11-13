import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const root = new URL("../", import.meta.url);
const read = (path) => readFileSync(new URL(path, root), "utf8");
const guarded = new Map([
  ["app/api/operator/b2b-profile/route.ts", 1],
  ["app/api/operator/calendar-import/route.ts", 1],
  ["app/api/operator/collaborations/invite/route.ts", 2],
  ["app/api/operator/collaborations/route.ts", 1],
  ["app/api/operator/profile-revisions/route.ts", 1],
  ["app/api/operator/territory-classify/route.ts", 1],
]);

test("operator guard fails closed on cross-site and ambiguous requests (source contract)", () => {
  const source = read("lib/operator-request-origin.ts");
  assert.match(source, /site !== "same-origin" && site !== "none"/);
  assert.match(source, /!origin && site !== "same-origin"/);
  assert.match(source, /new URL\(origin\)\.origin !== new URL\(request\.url\)\.origin/);
  assert.match(source, /status: 403/);
});

for (const [path, expected] of guarded) {
  test(`${path}: guards all mutations before reading request data`, () => {
    const source = read(path);
    const methods = [...source.matchAll(/export async function (POST|DELETE|PATCH|PUT)\(/g)];
    const checks = [...source.matchAll(/rejectCrossSiteOperatorMutation\((request|req)\)/g)];
    assert.equal(methods.length, expected);
    assert.equal(checks.length, expected);
    for (let i = 0; i < methods.length; i++) {
      const start = methods[i].index;
      const end = methods[i + 1]?.index ?? source.length;
      const body = source.slice(start, end);
      assert.match(body, /const originError = rejectCrossSiteOperatorMutation\((request|req)\);/);
      assert.match(body, /if \(originError\) return originError;/);
      assert.ok(body.indexOf("rejectCrossSiteOperatorMutation(") < body.indexOf("auth.getClaims()") || !body.includes("auth.getClaims()"));
    }
  });
}
