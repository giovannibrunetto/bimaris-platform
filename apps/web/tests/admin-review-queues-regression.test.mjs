import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const read = (p) => readFileSync(new URL(p, import.meta.url), "utf8");

test("dashboard work queue links to pending operator review, not full catalog", () => {
  const dashboard = read("../app/admin/page.tsx");
  assert.match(dashboard, /\/admin\/operatori\?view=pending#pending-operators/);
  assert.match(dashboard, /label:"Operatori ed esperienze da esaminare"/);
  assert.match(dashboard, /\.neq\("experience_origin","bimaris"\)\.in\("review_status"/);
  assert.match(dashboard, /await isAuthorizedAdmin\(\)/);
});

test("operator page offers pending and all views without hiding regular management", () => {
  const page = read("../app/admin/operatori/page.tsx");
  assert.match(page, /const pendingOnly=view==="pending"/);
  assert.match(page, /filter\(o=>!pendingOnly\|\|pendingForOperator\(o\.id\)>0\)/);
  assert.match(page, /e\.operator_id===o\.id&&\(!pendingOnly\|\|needsReview\(e\)\)/);
  assert.match(page, /!pendingOnly&&bimarisExperiences\.length>0/);
  assert.match(page, /href="\/admin\/operatori\?view=pending#pending-operators"/);
  assert.match(page, /href="\/admin\/operatori"/);
  assert.match(page, /await isAuthorizedAdmin\(\)/);
});

test("events retain independent queue and MFA authorization", () => {
  const events = read("../app/admin/eventi/page.tsx");
  assert.match(events, /verification_status", "pending"/);
  assert.match(events, /verification_status", "verified"/);
  assert.match(events, /await isAuthorizedAdmin\(\)/);
  assert.doesNotMatch(events, /isAdminAuthenticated/);
});
