import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { eventTransition } from "../lib/admin-event-transitions.ts";

test("approval verifies without publishing", () => {
  const result = eventTransition("approve");
  assert.deepEqual(result?.update, { verification_status: "verified", published: false });
  assert.equal(result?.expectedStatus, "pending");
  assert.equal(result?.expectedPublished, false);
});
test("rejection only acts on a pending unpublished record", () => {
  const result = eventTransition("reject");
  assert.deepEqual(result?.update, { verification_status: "rejected", published: false });
  assert.equal(result?.expectedStatus, "pending");
  assert.equal(result?.expectedPublished, false);
});
test("publishing requires prior verification, and never changes review status", () => {
  const result = eventTransition("publish");
  assert.deepEqual(result?.update, { published: true });
  assert.equal(result?.expectedStatus, "verified");
  assert.equal(result?.expectedPublished, false);
});
test("unknown actions cannot mutate data", () => {
  for (const action of ["", "delete", "reset", "approve-and-publish", "PUBLISH"]) {
    assert.equal(eventTransition(action), null);
  }
});

test("event status mutation retains individual MFA and same-origin guards", () => {
  const api = readFileSync(new URL("../app/api/admin/events/[id]/status/route.ts", import.meta.url), "utf8");
  assert.match(api, /rejectCrossSiteAdminMutation\(request\)/);
  assert.match(api, /await isAuthorizedAdmin\(\)/);
  assert.match(api, /eventTransition\(rawAction\)/);
  assert.match(api, /\.eq\("verification_status", transition\.expectedStatus\)/);
  assert.match(api, /\.eq\("published", transition\.expectedPublished\)/);
  assert.doesNotMatch(api, /isAdminAuthenticated|@\/lib\/admin-auth/);
});

test("event review and dashboard require individual MFA, not legacy admin cookie", () => {
  for (const path of ["../app/admin/eventi/page.tsx", "../app/admin/page.tsx"]) {
    const source = readFileSync(new URL(path, import.meta.url), "utf8");
    assert.match(source, /await isAuthorizedAdmin\(\)/);
    assert.doesNotMatch(source, /isAdminAuthenticated|@\/lib\/admin-auth/);
  }
});
