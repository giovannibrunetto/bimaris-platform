import test from "node:test";
import assert from "node:assert/strict";
import { authRedirectOrigin, safeAuthPath, PUBLIC_SITE_URL } from "../lib/auth-redirect.ts";

const STAGING = "https://bimaris-platform-git-staging-giovannibrunetto84-1508.vercel.app";

test("trusted BIMARIS staging preserves its own origin", () => {
  assert.equal(authRedirectOrigin(new URL(STAGING + "/auth/confirm")), STAGING);
  assert.equal(
    authRedirectOrigin(new URL("https://bimaris-platform-abc123-giovannibrunetto84-1508.vercel.app/auth/callback")),
    "https://bimaris-platform-abc123-giovannibrunetto84-1508.vercel.app"
  );
});

test("untrusted origins cannot receive authentication redirects", () => {
  for (const candidate of [
    "https://bimaris-platform-attacker.vercel.app/auth/callback",
    "https://bimaris-platform-abc123-giovannibrunetto84-1508.vercel.app.evil.test/auth/callback",
    "http://bimaris-platform-git-staging-giovannibrunetto84-1508.vercel.app/auth/callback",
    "https://evil.test/auth/confirm",
  ]) {
    assert.equal(authRedirectOrigin(new URL(candidate)), PUBLIC_SITE_URL);
  }
});

test("local callback destinations remain on BIMARIS", () => {
  assert.equal(safeAuthPath("/profilo"), "/profilo");
  assert.equal(safeAuthPath("/area-operatore?operatore=abc"), "/area-operatore?operatore=abc");
});

test("external, protocol-relative and backslash redirects are rejected", () => {
  for (const candidate of [
    null,
    "",
    "https://evil.test",
    "//evil.test/path",
    "/\\evil.test/path",
    "/area-operatore\\evil.test",
    "/accedi\nLocation:https://evil.test",
  ]) {
    assert.equal(safeAuthPath(candidate), null);
  }
});
