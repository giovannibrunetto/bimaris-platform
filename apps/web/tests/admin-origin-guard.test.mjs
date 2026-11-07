import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
const root = new URL("../", import.meta.url);
const read = (path) => readFileSync(new URL(path, root), "utf8");
const guarded = [
  "app/api/admin/applications/route.ts",
  "app/api/admin/experience-revisions/route.ts",
  "app/api/admin/experiences/route.ts",
  "app/api/admin/experiences/create/route.ts",
  "app/api/admin/itineraries/route.ts",
  "app/api/admin/operator-memberships/route.ts",
  "app/api/admin/operator-revisions/route.ts",
  "app/api/admin/operators/route.ts",
  "app/api/admin/events/[id]/status/route.ts",
];
test("admin origin guard fails closed on ambiguous and cross-site requests (source contract)", () => {
  const source = read("lib/admin-request-origin.ts");
  assert.match(source, /site !== "same-origin" && site !== "none"/);
  assert.match(source, /!origin && site !== "same-origin"/);
  assert.match(source, /new URL\(origin\)\.origin !== new URL\(request\.url\)\.origin/);
  assert.match(source, /status: 403/);
});
for (const path of guarded) {
  test(`${path}: checks origin and admin authorization before mutations (source contract)`, () => {
    const source = read(path);
    const guard = source.indexOf("rejectCrossSiteAdminMutation(request);");
    const auth = source.indexOf("await isAuthorizedAdmin()");
    const body = source.indexOf("request.formData()");
    assert.ok(guard >= 0, "origin guard missing");
    assert.ok(auth > guard, "admin auth must follow origin guard");
    assert.ok(body > auth, "form must be parsed after authorization");
  });
}
