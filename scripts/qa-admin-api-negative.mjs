#!/usr/bin/env node
// BIMARIS staging-only security smoke test: no credentials and no valid record IDs.
// Usage: node scripts/qa-admin-api-negative.mjs
const origin = process.env.BIMARIS_QA_STAGING_URL ?? "https://bimaris-platform-git-staging-giovannibrunetto84-1508.vercel.app";
const url = new URL(origin);
if (url.protocol !== "https:" || !url.hostname.endsWith(".vercel.app") || !url.hostname.includes("staging")) {
  throw new Error("Refusing to run outside an HTTPS staging.vercel.app hostname");
}
const fakeId = "00000000-0000-0000-0000-000000000000";
const tests = [
  { name: "applications: cross-site origin", path: "/api/admin/applications", body: { action: "reviewing", application_id: fakeId }, headers: { Origin: "https://invalid-external.example", "Sec-Fetch-Site": "cross-site" }, expected: 403 },
  { name: "operators: cross-site origin", path: "/api/admin/operators", body: { action: "publish", operator_id: fakeId }, headers: { Origin: "https://invalid-external.example", "Sec-Fetch-Site": "cross-site" }, expected: 403 },
  { name: "applications: unauthenticated", path: "/api/admin/applications", body: { action: "reviewing", application_id: fakeId }, headers: { Origin: url.origin, "Sec-Fetch-Site": "same-origin" }, expected: 303 },
  { name: "operators: unauthenticated", path: "/api/admin/operators", body: { action: "publish", operator_id: fakeId }, headers: { Origin: url.origin, "Sec-Fetch-Site": "same-origin" }, expected: 303 },
];
let failed = 0;
for (const test of tests) {
  try {
    const endpoint = new URL(test.path, url);
    const body = new URLSearchParams(test.body);
    const response = await fetch(endpoint, {
      method: "POST", redirect: "manual", body,
      headers: { "Content-Type": "application/x-www-form-urlencoded", ...test.headers },
      signal: AbortSignal.timeout(12000),
      credentials: "omit",
    });
    const location = response.headers.get("location") ?? "";
    const redirectValid = test.expected !== 303 || new URL(location, endpoint).pathname === "/admin/login";
    const pass = response.status === test.expected && redirectValid;
    if (!pass) failed++;
    console.log(`${pass ? "PASS" : "FAIL"} | ${test.name} | HTTP ${response.status}${location ? " | " + location : ""}`);
  } catch (error) {
    failed++;
    console.error(`BLOCKED | ${test.name} | ${error.cause?.code ?? error.message}`);
  }
}
if (failed) {
  console.error(`QA admin API negative: ${failed} of ${tests.length} checks did not pass`);
  process.exitCode = 1;
} else {
  console.log("QA admin API negative: 4/4 PASS");
}
