import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
const read = (path) => readFileSync(new URL(path, import.meta.url), "utf8");
const login = read("../app/admin/login/AdminIndividualLogin.tsx");
const callback = read("../app/auth/callback/route.ts");
const mfa = read("../app/admin/mfa/page.tsx");
const guard = read("../lib/admin-mfa-guard.ts");

test("admin OAuth uses shared callback, not ephemeral admin callback", () => {
  assert.match(login, /\/auth\/callback\?admin=1/);
  assert.doesNotMatch(login, /redirectTo: window\.location\.origin \+ "\/admin\/login\/oauth-callback"/);
  assert.match(callback, /exchangeCodeForSession\(code\)/);
});
test("unallowlisted preview origin cannot start admin Google OAuth", () => {
  assert.match(login, /window\.location\.origin !== allowedOrigin/);
  assert.match(login, /redirectTo: allowedOrigin \+ "\/auth\/callback\?admin=1"/);
});
test("admin intent is explicit and never combined with operator context", () => {
  assert.match(callback, /adminIntent = url\.searchParams\.get\("admin"\) === "1"/);
  assert.match(callback, /if \(operatorIntent \|\| supabaseUrl !==/);
  assert.match(callback, /publicUrl\("\/admin\/mfa", url\)/);
});
test("operator and personal callbacks retain their separate checks", () => {
  assert.match(callback, /\.from\("operator_memberships"\)/);
  assert.match(callback, /\.from\("user_interests"\)/);
});
test("admin MFA keeps staging, super-admin and AAL2 checks", () => {
  assert.match(mfa, /is_active_super_admin/);
  assert.match(mfa, /allowed !== true/);
  assert.match(guard, /currentLevel !== "aal2"/);
  assert.match(guard, /is_active_super_admin_session/);
});
