import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
const read = path => readFileSync(new URL(path, import.meta.url), "utf8");

test("validated PR36 operator workspace switcher is shared by home calendar and B2B", () => {
  const home = read("../app/area-operatore/page.tsx");
  const calendar = read("../app/area-operatore/calendario/page.tsx");
  const b2b = read("../app/area-operatore/network-b2b/page.tsx");
  const switcher = read("../app/area-operatore/OperatorWorkspaceSwitcher.tsx");
  for (const page of [home, calendar, b2b]) {
    assert.match(page, /<OperatorWorkspaceSwitcher/);
    assert.match(page, /operator_memberships/);
  }
  assert.match(switcher, /"Attività che gestisci"/);
  assert.match(switcher, /"Area operatore"/);
  assert.match(switcher, /"Importa calendario"/);
  assert.match(switcher, /"Network B2B"/);
  assert.match(switcher, /query\.set\("operatore", slug\)/);
  assert.match(switcher, /"experience", "step", "collaboration", "invito"/);
});

test("layout does not double-render navigation that now lives in workspace switcher", () => {
  const layout = read("../app/area-operatore/layout.tsx");
  assert.doesNotMatch(layout, /operator-section-nav__inner/);
  assert.doesNotMatch(layout, /<nav/);
  const switcher = read("../app/area-operatore/OperatorWorkspaceSwitcher.tsx");
  assert.match(switcher, /aria-label="Attività e sezioni operatore"/);
});

test("calendar cannot silently fall back to a different operator for unrecognized selection", () => {
  const calendar = read("../app/area-operatore/calendario/page.tsx");
  assert.match(calendar, /const active=requested\?rows\.find\(r=>r\.operator_id===requested\|\|r\.operator\.slug===requested\)\?\?null:rows\[0\]\?\?null/);
  assert.match(calendar, /active&&<OperatorWorkspaceSwitcher/);
  assert.match(calendar, /active&&<div className="operator-subpage__calendar-grid">/);
});

test("admin consolidation retains individual MFA and corrected dashboard", () => {
  const layout = read("../app/admin/template.tsx");
  const dashboard = read("../app/admin/page.tsx");
  const login = read("../app/admin/login/AdminIndividualLogin.tsx");
  assert.match(layout, /Super Admin · MFA verificata/);
  assert.doesNotMatch(dashboard, /admin-dashboard__intro/);
  assert.match(login, /aria-label=\{showPassword \? "Nascondi password" : "Mostra password"\}/);
  assert.match(login, /<svg aria-hidden="true"/);
});

test("PR36 operator UX and lifecycle behavior survive the consolidation", () => {
  const manager = read("../app/area-operatore/ExperienceManager.tsx");
  const managerCss = read("../app/area-operatore/experience-manager.css");
  const b2b = read("../app/area-operatore/network-b2b/B2BNetwork.tsx");
  const operatorCss = read("../app/area-operatore/operator-navigation.css");
  const profile = read("../app/area-operatore/OperatorProfileEditor.tsx");
  const importer = read("../app/area-operatore/CalendarImporter.tsx");
  const logout = read("../app/area-operatore/OperatorLogoutButton.tsx");
  assert.match(manager, /showAllExperiences/);
  assert.match(manager, /experience-manager__show-all/);
  assert.match(managerCss, /experience-manager__list--expanded/);
  assert.match(b2b, /b2b-options__grid/);
  assert.match(operatorCss, /operator-section-nav__link/);
  assert.match(profile, /scrollIntoView/);
  assert.match(importer, /scrollIntoView/);
  assert.match(logout, /session_not_found/);
  assert.match(logout, /scope: "local"/);
});

test("validated login eye, account header and no-op operator profile revision protection remain", () => {
  const login = read("../app/accedi/PasswordAccess.tsx");
  const header = read("../components/Header.tsx");
  const revision = read("../app/api/operator/profile-revisions/route.ts");
  assert.match(login, /showPassword/);
  assert.match(login, /setShowPassword/);
  assert.match(header, /onAuthStateChange/);
  assert.match(header, /operator_memberships/);
  assert.match(header, /"Area Operatore"/);
  assert.match(revision, /\["owner","manager"\]/);
  assert.match(revision, /const unchanged=/);
  assert.match(revision, /profile=unchanged/);
  assert.match(revision, /pendingError/);
});
