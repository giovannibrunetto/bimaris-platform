import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const read = (p) => readFileSync(new URL(p, import.meta.url), "utf8");

test("dashboard provides one consolidated content queue and combined activity registry", () => {
  const dashboard = read("../app/admin/page.tsx");
  assert.match(dashboard, /href:"\/admin\/contenuti",label:"Contenuti da esaminare"/);
  assert.match(dashboard, /href:"\/admin\/attivita",label:"Esperienze e appuntamenti"/);
  assert.match(dashboard, /acquiredAppointments = allEventsRes\.count/);
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

test("dashboard fails visibly if any of its ten count queries fail", () => {
  const dashboard = read("../app/admin/page.tsx");
  assert.match(dashboard, /\[appsRes,opsRes,pendingExpsRes,onlineExpsRes,revsRes,opRevsRes,onlineItinsRes,eventsRes,approvedEventsRes,allEventsRes\]\.some\(result => result\.error\)/);
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

test("experience revision displays changed data first and full comparison on demand", () => {
  const page = read("../app/admin/esperienze/[id]/revisione/page.tsx");
  const css = read("../app/admin/esperienze/[id]/revisione/experience-revision.css");
  assert.match(page, /const changedFields = allFields\.filter/);
  assert.match(page, /Solo le modifiche da esaminare/);
  assert.match(page, /changedFields\.map/);
  assert.match(page, /<details className="revision-full-comparison">/);
  assert.match(page, /Mostra confronto completo e gallerie/);
  assert.match(page, /allFields\.map/);
  assert.match(page, /photo\.source_media_id \?\? photo\.id \?\? photo\.storage_path/);
  assert.match(page, /addedPhotos\.map/);
  assert.match(page, /removedPhotos\.map/);
  assert.match(page, /updatedPhotos\.map/);
  assert.match(css, /revision-changes__values/);
  assert.match(css, /revision-gallery__changes\{display:grid;grid-template-columns:repeat\(auto-fill,minmax\(min\(100%,220px\),260px\)\)/);
  assert.match(css, /@media\(max-width:600px\)/);
  assert.match(page, /id="admin-review-decision"/);
  assert.match(page, /Dossier operatore/);
  assert.match(page, /experience\.operator_id/);
});

test("MFA code field focuses automatically after the asynchronous factor check", () => {
  const page = read("../app/admin/mfa/AdminMfaStep.tsx");
  assert.match(page, /useRef<HTMLInputElement>\(null\)/);
  assert.match(page, /if \(ready && factor\) otpInputRef\.current\?\.focus\(\)/);
  assert.match(page, /\[ready, factor\]/);
  assert.match(page, /<input ref=\{otpInputRef\} autoFocus id="admin-individual-otp"/);
  assert.match(page, /autoComplete="one-time-code"/);
  assert.match(page, /getAuthenticatorAssuranceLevel/);
});

test("operator profile review renders only changed fields with a dossier link", () => {
  const page = read("../app/admin/operatori/[id]/revisioni-profilo/page.tsx");
  assert.match(page, /const changed=fields\.filter/);
  assert.match(page, /\{changed\.map\(\(\[key,label\]\)/);
  assert.doesNotMatch(page, /\{fields\.map\(\(\[key,label\]\)/);
  assert.match(page, /Dossier operatore/);
  assert.match(page, /Nessuna differenza rilevata/);
  assert.match(page, /repeat\(auto-fit,minmax/);
});

test("top navigation exposes administrator only through server-verified MFA check", () => {
  const header = read("../components/Header.tsx");
  const route = read("../app/api/admin/nav-access/route.ts");
  assert.match(route, /await isAuthorizedAdmin\(\)/);
  assert.match(route, /is_active_super_admin/);
  assert.match(route, /client\.auth\.getUser\(\)/);
  assert.match(route, /visible: true, verified/);
  assert.match(route, /Cache-Control.*private, no-store/);
  assert.match(header, /fetch\("\/api\/admin\/nav-access"/);
  assert.match(header, /result\.visible === true/);
  assert.match(header, /adminAccess\.verified \? "\/admin" : "\/admin\/mfa"/);
  assert.match(header, /access !== "guest" \? \{ href: "\/admin\/login", label: "Accesso amministratore" \}/);
  assert.match(header, /label: "Area Amministratore"/);
  assert.match(header, /adminLink && <Link href=\{adminLink\.href\}/);
  assert.match(header, /adminLink && <Link href=\{adminLink\.href\} onClick=\{closeMobileMenu\}/);
  assert.doesNotMatch(route, /operator_memberships/);
});

test("event queue requires an inspection before any admin mutation", () => {
  const queue = read("../app/admin/eventi/page.tsx");
  const detail = read("../app/admin/eventi/[id]/page.tsx");
  const action = read("../app/api/admin/events/[id]/status/route.ts");
  const css = read("../app/admin/eventi/admin-events.css");
  assert.match(queue, /\/admin\/eventi\/\$\{row\.id\}/);
  assert.match(queue, /Esamina →/);
  assert.match(queue, /Verifica e pubblica →/);
  assert.doesNotMatch(queue, /<form method="post"/);
  assert.match(detail, /await isAuthorizedAdmin\(\)/);
  assert.match(detail, /verification_status === "pending"/);
  assert.match(detail, /verification_status === "verified"/);
  assert.match(detail, /event\.starts_at/);
  assert.match(detail, /event\.ends_at/);
  assert.match(detail, /event\.location/);
  assert.match(detail, /event\.source_url/);
  assert.match(detail, /event\.id/);
  assert.match(detail, /Approva evento/);
  assert.match(detail, /Scarta evento/);
  assert.match(detail, /Pubblica evento/);
  assert.match(action, /rejectCrossSiteAdminMutation/);
  assert.match(action, /await isAuthorizedAdmin\(\)/);
  assert.match(action, /transition\.expectedStatus/);
  assert.match(css, /admin-events__card--compact/);
  assert.match(css, /@media\(max-width:650px\)/);
});

test("consolidated content queue keeps operator reviews and event dossiers distinct", () => {
  const page = read("../app/admin/contenuti/page.tsx");
  assert.match(page, /await isAuthorizedAdmin\(\)/);
  assert.match(page, /operator_revisions/);
  assert.match(page, /experience_revisions/);
  assert.match(page, /experience_origin","bimaris"/);
  assert.match(page, /verification_status","pending"/);
  assert.match(page, /\/admin\/operatori\/\$\{item\.operator_id\}\/revisioni-profilo/);
  assert.match(page, /\/admin\/revisione-esperienza\?id=/);
  assert.match(page, /\/admin\/eventi\/\$\{item\.id\}/);
  assert.doesNotMatch(page, /<form method="post"/);
});
test("combined activity registry counts every acquired appointment without double-creating experiences", () => {
  const page = read("../app/admin/attivita/page.tsx");
  const dashboard = read("../app/admin/page.tsx");
  assert.match(page, /await isAuthorizedAdmin\(\)/);
  assert.match(page, /db\.from\("experiences"\)/);
  assert.match(page, /db\.from\("events"\)/);
  assert.match(page, /Appuntamenti acquisiti/);
  assert.match(page, /Da pubblicare/);
  assert.match(page, /allAppointments\.filter\(v=>v\.verification_status==="verified"&&!v\.published\)/);
  assert.match(dashboard, /allEventsRes\.count/);
  assert.doesNotMatch(page, /\.insert\(|\.update\(|\.delete\(/);
});

test("focused content review presents one grouped list without duplicated navigation", () => {
  const page = read("../app/admin/contenuti/page.tsx");
  const css = read("../app/admin/eventi/admin-events.css");
  assert.match(page, /admin-content-review/);
  assert.match(page, /Esperienze e appuntamenti/);
  assert.match(page, /profiles.length>0/);
  assert.match(page, /experiences.length>0\|\|revisions.length>0\|\|appointments.length>0/);
  assert.match(page, /Esperienza · Modifica/);
  assert.match(page, /Appuntamento · /);
  assert.match(page, /href="\/admin"/);
  assert.doesNotMatch(page, /admin-events__filters/);
  assert.doesNotMatch(page, /searchParams/);
  assert.match(css, /body:has\(\.admin-content-review\) \.admin-shell-nav\{display:none\}/);
});
