import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
const callback = readFileSync(new URL("../app/auth/callback/route.ts", import.meta.url), "utf8");

test("shared callback exchanges OAuth PKCE code before routing", () => {
  assert.match(callback, /exchangeCodeForSession\(code\)/);
  assert.match(callback, /auth\.getUser\(\)/);
});
test("admin context is opt-in, staging-only and incompatible with operator context", () => {
  assert.match(callback, /url\.searchParams\.get\("admin"\) === "1"/);
  assert.match(callback, /operatorIntent \|\| supabaseUrl !== "https:\/\/nzdeoimwikhoidtladnu\.supabase\.co"/);
  assert.match(callback, /publicUrl\("\/admin\/mfa", url\)/);
});
test("existing personal and operator callback routes remain present", () => {
  assert.match(callback, /\.from\("operator_memberships"\)/);
  assert.match(callback, /\.from\("user_interests"\)/);
  assert.match(callback, /safeAuthPath\(url\.searchParams\.get\("next"\)\)/);
});
