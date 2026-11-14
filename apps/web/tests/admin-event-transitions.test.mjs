import test from "node:test";
import assert from "node:assert/strict";
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
