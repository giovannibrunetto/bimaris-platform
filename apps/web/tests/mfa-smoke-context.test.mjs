import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const source = readFileSync(new URL("../scripts/mfa-staging-smoke.mjs", import.meta.url), "utf8");

test("MFA smoke stays opt-in", () => {
  assert.match(source, /BIMARIS_MFA_SMOKE_TEST === "true"/);
});
test("MFA smoke is restricted to Preview and explicitly approved branches", () => {
  assert.match(source, /VERCEL_ENV === "preview"/);
  assert.match(source, /approvedBranches\.has\(branch\)/);
  assert.match(source, /feature\/admin-individual-mfa/);
  assert.match(source, /integration\/ds-mfa-ux-identity-20261111/);
});
test("MFA smoke checks exact Staging Supabase host and rejects unknown session", () => {
  assert.match(source, /nzdeoimwikhoidtladnu\.supabase\.co/);
  assert.match(source, /new URL\(url\)\.hostname !== expectedHost/);
  assert.match(source, /result !== false/);
});
