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

test("failed operator queue queries cannot be misreported as an empty queue", () => {
  const page = read("../app/admin/operatori/page.tsx");
  for (const name of ["operatorsError", "experiencesError", "revisionsError", "operatorRevisionsError"]) {
    assert.match(page, new RegExp(name));
  }
  assert.match(page, /if\(operatorsError\|\|experiencesError\|\|revisionsError\|\|operatorRevisionsError\)throw new Error/);
  assert.doesNotMatch(page, /Non pubblicato · Da verificare/);
});

test("dashboard fails visibly if any of its nine count queries fail", () => {
  const dashboard = read("../app/admin/page.tsx");
  assert.match(dashboard, /\[appsRes,opsRes,pendingExpsRes,onlineExpsRes,revsRes,opRevsRes,onlineItinsRes,eventsRes,approvedEventsRes\]\.some\(result => result\.error\)/);
  assert.match(dashboard, /throw new Error\("Impossibile caricare i contatori della dashboard amministrativa"\)/);
});

test("dashboard excludes curated BIMARIS experience revisions from operator queue", () => {
  const dashboard = read("../app/admin/page.tsx");
  assert.match(dashboard, /experiences!inner\(experience_origin\)/);
  assert.match(dashboard, /\.neq\("experiences\.experience_origin", "bimaris"\)/);
});

test("pending operator profile revision renders as its own visible row, not header action", () => {
  const page = read("../app/admin/operatori/page.tsx");
  assert.match(page, /Modifica del profilo operatore/);
  assert.match(page, /pendingProfile&&<div className="admin-operator-grid"/);
  assert.match(page, /revisioni-profilo/);
  assert.doesNotMatch(page, />Esamina modifica<\/Link>/);
  assert.match(page, /pendingProfiles===1\?"profilo":"profili"/);
});

test("dashboard uses the shared MFA header exactly once", () => {
  const layout = read("../app/admin/layout.tsx");
  const dashboard = read("../app/admin/page.tsx");
  assert.match(layout, /className="admin-shell-header"/);
  assert.match(layout, /Super Admin · MFA verificata/);
  assert.doesNotMatch(dashboard, /className="admin-dashboard__intro"/);
  assert.doesNotMatch(dashboard, /<h1[^>]*>Centro operativo<\/h1>/);
  assert.match(dashboard, /className="admin-dashboard__overview"/);
  assert.match(dashboard, /await isAuthorizedAdmin\(\)/);
});

test("admin individual login supports showing and hiding the password without bypassing MFA", () => {
  const login = read("../app/admin/login/AdminIndividualLogin.tsx");
  assert.match(login, /const \[showPassword, setShowPassword\] = useState\(false\)/);
  assert.match(login, /type=\{showPassword \? "text" : "password"\}/);
  assert.match(login, /aria-pressed=\{showPassword\}/);
  assert.match(login, /"Mostra password"/);
  assert.match(login, /"Nascondi password"/);
  assert.match(login, /<svg aria-hidden="true" viewBox="0 0 24 24"/);
  assert.match(login, /<circle cx="12" cy="12" r="3"/);
  assert.doesNotMatch(login, /\{showPassword \? "Nascondi" : "Mostra"\}/);
  assert.match(login, /window\.location\.assign\("\/admin\/mfa"\)/);
  assert.match(login, /signInWithPassword/);
});
