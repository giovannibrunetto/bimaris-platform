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
  assert.match(calendar, /active&&<div className="operator-calendar-grid">/);
});

test("admin consolidation retains individual MFA and corrected dashboard", () => {
  const layout = read("../app/admin/layout.tsx");
  const dashboard = read("../app/admin/page.tsx");
  const login = read("../app/admin/login/AdminIndividualLogin.tsx");
  assert.match(layout, /Super Admin · MFA verificata/);
  assert.doesNotMatch(dashboard, /admin-dashboard__intro/);
  assert.match(login, /aria-label=\{showPassword \? "Nascondi password" : "Mostra password"\}/);
  assert.match(login, /<svg aria-hidden="true"/);
});
