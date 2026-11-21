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


test("PR58 compact mobile operator header and navigation retain operator selector and bell",()=>{
 const panelsCss=read("../app/area-operatore/operator-workspace-panels.css");
 const switchCss=read("../app/area-operatore/workspace-switcher.css");
 const switcher=read("../app/area-operatore/OperatorWorkspaceSwitcher.tsx");
 assert.match(panelsCss,/PR58 mobile UX-01 \/ iPhone SE 375x667/);
 assert.match(panelsCss,/\.operator-premium-header\{\s*padding:16px 18px;gap:10px/);
 assert.match(panelsCss,/\.operator-premium-shell>\.operator-workspace-switcher\{\s*margin-top:10px;padding:10px!important/);
 assert.match(switchCss,/grid-template-columns:minmax\(0,1fr\) 44px/);
 assert.match(switchCss,/\.operator-workspace-switcher>\.operator-notice\{grid-column:2;grid-row:1/);
 assert.match(switchCss,/\.operator-workspace-switcher__sections\{\s*grid-column:1\/-1;grid-row:2/);
 assert.match(switcher,/<OperatorNotificationBell operatorId=\{active.id\}\/>/);
 assert.match(switcher,/aria-label="Attività che gestisci"/);
});


test("PR58 B2B email choice appears only in final recap before save",()=>{
 const b2b=read("../app/area-operatore/network-b2b/B2BNetwork.tsx");
 const preference="{canManage&&step===3&&<B2BNewMatchAlerts operatorId={operatorId} showPreferences />}";
 const recap=b2b.indexOf('className="b2b-network__group b2b-flow__summary"');
 const choice=b2b.indexOf(preference);
 const save=b2b.indexOf('"Salva e trova compatibilità"');
 assert.ok(recap>=0&&choice>recap&&save>choice,"Preference must appear after recap and before save");
 assert.equal(b2b.split("<B2BNewMatchAlerts").length-1,1,"One preference control only");
 const alerts=read("../app/area-operatore/B2BNewMatchAlerts.tsx");
 assert.match(alerts,/checked={data\?\.emailEnabled\?\?false}/);
 assert.match(alerts,/action:"preference"/);
});


test("PR58 personal preferences separate topics from visit style without changing source data",()=>{
 const page=read("../app/profilo/page.tsx");
 const summary=read("../app/profilo/ProfilePreferenceSummary.tsx");
 const css=read("../app/profilo/profile-ottanio.css");
 assert.match(page,/className="profile-preference-interests"/);
 assert.match(page,/>Cosa ti piace<\/h3>/);
 assert.match(page,/ranked\.filter\(item => Number\(item\.explicit_score \?\? 0\) > 0\)\.map\(item => labels\[item.interest_key\]/);
 assert.match(summary,/>Come preferisci vivere Messina<\/h3>/);
 assert.match(summary,/<dl className="profile-preference-details">/);
 assert.match(summary,/<dt>\{item.label==="Tempo"\?"Quanto tempo":item.label\}<\/dt>/);
 assert.match(summary,/travelCompanion\?companionLabels/);
 assert.match(summary,/typicalTime\?timeLabels/);
 assert.match(summary,/preferredPace\?paceLabels/);
 assert.match(css,/\.profile-page \.profile-preference-section-title/);
 assert.match(css,/\.profile-page \.profile-preference-detail/);
 assert.match(page,/className="interest-tag__check" aria-hidden="true"/);
 assert.match(page,/className="interest-tag__label"/);
 assert.match(css,/@media\(max-width:650px\)\{[\s\S]*?grid-template-columns:repeat\(2,minmax\(0,1fr\)\)/);
 assert.match(css,/@media\(max-width:345px\)\{[\s\S]*?grid-template-columns:minmax\(0,1fr\)/);
});


test("PR58 tablet at 768px keeps activity and bell in first row",()=>{
 const css=read("../app/area-operatore/workspace-switcher.css");
 const tablet=css.slice(css.indexOf("/* PR58 tablet QA (601–950px)"));
 assert.match(tablet,/@media\(min-width:601px\) and \(max-width:950px\)/);
 assert.match(tablet,/grid-template-columns:minmax\(0,1fr\) 48px/);
 assert.match(tablet,/\.operator-workspace-switcher__activity\{[\s\S]*?grid-column:1;\s*grid-row:1/);
 assert.match(tablet,/\.operator-workspace-switcher>\.operator-notice\{\s*grid-column:2;\s*grid-row:1/);
 assert.match(tablet,/\.operator-workspace-switcher__sections\{\s*grid-column:1\/-1;\s*grid-row:2/);
 assert.match(css,/@media\(max-width:600px\)/);
});


test("PR58 P1 mobile map filters keep canvas unobstructed and preserve categories and historical periods",()=>{
 const map=read("../components/BimarisGoogleMapV2.tsx");
 const css=read("../app/map-mobile.css");
 assert.match(map,/className="bimaris-map-mobile-filter-trigger"/);
 assert.match(map,/createPortal\(/);
 assert.match(map,/role="dialog" aria-modal="true" aria-label="Filtri della mappa"/);
 assert.match(map,/Filtri della mappa/);
 assert.match(map,/FILTERS\.map\(item=><button/);
 assert.match(map,/PERIODS\.map\(\(item,index\)=><button/);
 assert.match(map,/onClick=\{\(\)=>chooseFilter\(item.key\)\}/);
 assert.match(map,/onClick=\{\(\)=>choosePeriod\(index\)\}/);
 assert.match(map,/chooseFilter\("all"\);setSelectedPeriods\(\[\]\)/);
 assert.match(map,/setMobileFiltersOpen\(false\)/);
 assert.match(css,/@media\(max-width:760px\)\{/);
 assert.match(css,/\.bimaris-map-filter-overlay,\s*\.bimaris-map-period-overlay\{\s*display:none!important/);
 assert.match(css,/\.bimaris-map-mobile-dialog-scroll\{[\s\S]*?overflow-y:auto/);
 assert.match(css,/\.bimaris-map-mobile-apply/);
});


test("PR58: village cards use a stretched primary link while retaining external photo credit",()=>{
 const page=read("../app/borghi/page.tsx");
 const css=read("../app/ux-brand-05-hero.css");
 assert.match(page,/className="text-link village-card-primary-link"/);
 assert.match(page,/aria-label=\{\x60Scopri il borgo di \$\{village.name\}\x60\}/);
 assert.match(page,/Fonte immagine:[\s\S]*?href="https:\/\/www\.comune\.sanmarcodalunzio\.me\.it\/"/);
 assert.match(css,/\.village-cards > \.village-card \.village-card-primary-link::after\{[\s\S]*?inset:0;[\s\S]*?z-index:1;/);
 assert.match(css,/\.village-cards > \.village-card \.village-card-media a\{[\s\S]*?z-index:2;/);
});
