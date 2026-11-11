import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const adminPages = [
  "../app/admin/page.tsx",
  "../app/admin/operatori/page.tsx",
  "../app/admin/operatori/[id]/page.tsx",
  "../app/admin/candidature/page.tsx",
  "../app/admin/itinerari/page.tsx",
  "../app/admin/eventi/page.tsx",
];

for (const relativePath of adminPages) {
  test(`admin MFA gate retained: ${relativePath}`, () => {
    const source = readFileSync(new URL(relativePath, import.meta.url), "utf8");
    assert.match(source, /import \{ isAuthorizedAdmin \} from ["']@\/lib\/admin-access["']/);
    assert.match(source, /await isAuthorizedAdmin\(\)/);
    assert.doesNotMatch(source, /isAdminAuthenticated|@\/lib\/admin-auth/);
  });
}

test("operator dossier defaults to profile", () => {
  const source = readFileSync(new URL("../app/admin/operatori/[id]/page.tsx", import.meta.url), "utf8");
  assert.match(source, /:\s*"profilo"/);
});
test("candidature responsive controls remain present", () => {
  const source = readFileSync(new URL("../app/admin/candidature/page.tsx", import.meta.url), "utf8");
  assert.match(source, /bimaris-candidature-row/);
  assert.match(source, /@media\(max-width:430px\)/);
});

test("operator mutation API requires MFA and rejects cross-site requests", () => {
  const source = readFileSync(new URL("../app/api/admin/operators/route.ts", import.meta.url), "utf8");
  assert.match(source, /rejectCrossSiteAdminMutation\(request\)/);
  assert.match(source, /await isAuthorizedAdmin\(\)/);
  assert.doesNotMatch(source, /isAdminAuthenticated/);
});
test("operator contact email is not an authorization identity", () => {
  const source = readFileSync(new URL("../app/api/admin/operators/route.ts", import.meta.url), "utf8");
  assert.match(source, /operator contact email is editorial\/public data only/i);
  assert.doesNotMatch(source, /auth\.admin\.createUser|auth\.admin\.updateUserById/);
});
