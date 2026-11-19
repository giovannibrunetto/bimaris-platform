import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const read = (p) => readFileSync(new URL(p, import.meta.url), "utf8");

test("dashboard provides one consolidated content queue and combined activity registry", () => {
  const dashboard = read("../app/admin/page.tsx");
  assert.match(dashboard, /href:"\/admin\/contenuti",label:"Contenuti da esaminare"/);
  assert.match(dashboard, /href: "\/admin\/attivita\?tipo=esperienze", label: "Esperienze online"/);
  assert.match(dashboard, /label: "Appuntamenti acquisiti", value: acquiredAppointments/);
  assert.match(dashboard, /acquiredAppointments = allEventsRes\.count/);
  assert.match(dashboard, /\.neq\("experience_origin","bimaris"\)\.in\("review_status"/);
  assert.match(dashboard, /await isAuthorizedAdmin\(\)/);
});

test("operator directory links to dossiers and sends old review links to the consolidated queue", () => {
  const page = read("../app/admin/operatori/page.tsx");
  assert.match(page, /await isAuthorizedAdmin\(\)/);
  assert.match(page, /\.view === "pending"\) redirect\("\/admin\/contenuti"\)/);
  assert.match(page, /db\.from\("operators"\)/);
  assert.match(page, /href=\{dossier\}>Apri dossier/);
  assert.doesNotMatch(page, /\?tab=esperienze|Esperienze associate/);
  assert.doesNotMatch(page, /\.from\("(experiences|experience_revisions|operator_revisions)"\)/);
  assert.doesNotMatch(page, /#admin-decision|revisioni-profilo|Esamina →/);
});

test("events retain independent queue and MFA authorization", () => {
  const events = read("../app/admin/eventi/page.tsx");
  assert.match(events, /verification_status", "pending"/);
  assert.match(events, /verification_status", "verified"/);
  assert.match(events, /await isAuthorizedAdmin\(\)/);
  assert.doesNotMatch(events, /isAdminAuthenticated/);
});

test("operator directory query errors remain visible", () => {
  const page = read("../app/admin/operatori/page.tsx");
  assert.match(page, /if \(error\) throw new Error\("Impossibile caricare gli operatori"\)/);
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

test("pending operator profile revisions have an action in the consolidated queue", () => {
  const page = read("../app/admin/contenuti/page.tsx");
  assert.match(page, /Modifica profilo/);
  assert.match(page, /href=\{\x60\/admin\/operatori\/\$\{item\.operator_id\}\/revisioni-profilo\x60\}>Esamina/);
});

test("dashboard uses the shared MFA header exactly once", () => {
  const layout = read("../app/admin/template.tsx");
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

test("activity register excludes items in the operator and appointment review queues", () => {
  const page = read("../app/admin/attivita/page.tsx");
  assert.match(page, /\.eq\("status","pending"\)\.neq\("experiences\.experience_origin","bimaris"\)/);
  assert.match(page, /!pendingRevisionIds\.has\(item\.id\) && item\.review_status !== "pending" && item\.review_status !== "submitted"/);
  assert.match(page, /item\.verification_status !== "pending" \|\| item\.published/);
  assert.match(page, /href="\/admin\/contenuti"/);
  assert.match(page, /href="\/admin\/esperienze\/nuova"/);
});

test("focused content review presents one grouped list without duplicated navigation", () => {
  const page = read("../app/admin/contenuti/page.tsx");
  const css = read("../app/admin/eventi/admin-events.css");
  assert.match(page, /admin-content-review/);
  const nav = read("../app/admin/AdminNavLinks.tsx");
  for (const category of ["candidature", "profili", "esperienze", "appuntamenti"]) {
    assert.match(page, new RegExp('selected.key === "' + category + '"'));
  }
  assert.match(page, /href=\{\x60\/admin\/contenuti\?categoria=\$\{category\.key\}\x60\}/);
  assert.match(page, /aria-current=\{category\.key === selected\.key \? "page" : undefined\}/);
  assert.match(page, /\.from\("operator_applications"\).*\.in\("status", \["new", "reviewing"\]\)/);
  assert.match(page, /\/admin\/candidature\/\$\{item\.id\}/);
  assert.match(nav, /count: applicationsPending \+ operatorExperiencePending/);
  assert.doesNotMatch(nav, /href: "\/admin\/(candidature|attivita)"/);
  assert.match(page, /Esperienza · Modifica/);
  assert.match(page, /Appuntamento · /);
  assert.match(page, /href="\/admin"/);
  assert.doesNotMatch(page, /admin-events__filters/);
  assert.match(page, /const \{ categoria \} = await searchParams/);
  assert.doesNotMatch(css, /body:has\(\.admin-content-review\) \.admin-shell-nav\{display:none\}/);
});

test("experience revision starts with a single compact heading and the changed content", () => {
  const page = read("../app/admin/esperienze/[id]/revisione/page.tsx");
  const css = read("../app/admin/esperienze/[id]/revisione/experience-revision.css");
  assert.match(page, /className="revision-workspace"/);
  assert.match(page, /className="revision-workspace__heading"/);
  assert.match(page, /href="\/admin\/contenuti"/);
  assert.match(page, /Scheda esperienza/);
  assert.match(page, /Dossier operatore/);
  assert.match(page, /className="detail-panel revision-workspace__panel"/);
  assert.doesNotMatch(page, /Confronto versione approvata \/ proposta/);
  assert.doesNotMatch(page, /Tutte le revisioni/);
  assert.match(css, /body:has\(\.revision-workspace\) \.admin-shell-nav/);
  assert.match(css, /admin-status-guide\{display:none\}/);
  assert.match(page, /id="admin-review-decision"/);
  assert.match(page, /name="action" value="approve-apply"/);
  assert.match(page, /name="action" value="request-changes"/);
});

test("operator profile revision uses a legible compact header and no duplicated admin menus", () => {
  const page = read("../app/admin/operatori/[id]/revisioni-profilo/page.tsx");
  const css = read("../app/admin/operatori/[id]/revisioni-profilo/profile-review.css");
  assert.match(page, /className="profile-review-workspace"/);
  assert.match(page, /className="profile-review-heading"/);
  assert.match(page, /href="\/admin\/contenuti"/);
  assert.match(page, /Dossier operatore/);
  assert.match(page, /className="profile-review-body__content"/);
  assert.doesNotMatch(page, /className="page-hero"/);
  assert.doesNotMatch(page, /Operatori ed Esperienze/);
  assert.match(css, /body:has\(\.profile-review-workspace\) \.admin-shell-nav/);
  assert.match(css, /admin-status-guide\{display:none\}/);
  assert.match(css, /\.profile-review-heading h1\{[^}]*color:#11363b/);
  assert.match(page, /name="action" value="reject"/);
  assert.match(page, /name="action" value="approve"/);
});

test("acquired appointment detail displays structured price and one locality field", () => {
  const page = read("../app/admin/eventi/[id]/page.tsx");
  assert.match(page, /metadata: \{ price_eur\?: unknown \} \| null/);
  assert.match(page, /metadata\?\.price_eur/);
  assert.match(page, /typeof price !== "number"/);
  assert.match(page, /Number\.isFinite\(price\)/);
  assert.match(page, /currency: "EUR"/);
  assert.match(page, /<dt>Prezzo<\/dt>/);
  assert.match(page, /<dt>Località<\/dt>/);
  assert.doesNotMatch(page, /<dt>Luogo<\/dt>/);
  assert.doesNotMatch(page, /<dt>Territorio<\/dt>/);
  assert.match(page, /metadata,operators\(name\),territories\(name\)/);
  assert.match(page, /await isAuthorizedAdmin\(\)/);
});

test("citizen survey privacy notice has no collection controls and blocks real collection", () => {
  const page = read("../app/privacy-questionario/page.tsx");
  const css = read("../app/privacy-questionario/privacy-questionario.css");
  assert.match(page, /Jessica Lucchesi/);
  assert.match(page, /info@bimarisnet\.it/);
  assert.match(page, /legittimo interesse/);
  assert.match(page, /art\. 6, par\. 1, lett\. f/);
  assert.match(page, /consenso libero e facoltativo/);
  assert.match(page, /art\. 6, par\. 1, lett\. a/);
  assert.match(page, /Google Forms/);
  assert.match(page, /Google Sheets/);
  assert.match(page, /12 mesi/);
  assert.match(page, /Spazio Economico Europeo/);
  assert.match(page, /Garante per la protezione dei dati personali/);
  assert.match(page, /Versione 2026-11-17-v2/);
  assert.match(page, /Raccolta reale disattivata/);
  assert.match(page, /robots: \{ index: false, follow: false, noarchive: true \}/);
  assert.doesNotMatch(page, /<form|<input|<textarea|fetch\(|createServiceClient/);
  assert.match(page, /Google Forms e Google Sheets non sono utilizzati/);
  assert.match(page, /archivi distinti nel database Supabase/);
  assert.match(css, /@media\(max-width:600px\)/);
  assert.match(css, /focus-visible/);
});

test("shared tablet header switches to the accessible compact menu before links overflow", () => {
  const css = read("../app/a11-foundation.css");
  const header = read("../components/Header.tsx");
  assert.match(css, /@media \(min-width: 701px\) and \(max-width: 1100px\)/);
  assert.match(css, /\.site-header \.nav \{ display: none !important; \}/);
  assert.match(css, /\.site-header \.mobile-menu \{ display: block !important;/);
  assert.match(css, /max-height: calc\(100dvh - 84px\)/);
  assert.match(header, /<details className="mobile-menu" ref=\{mobileMenuRef\}>/);
  assert.match(header, /aria-label="Navigazione mobile"/);
  assert.match(header, /onClick=\{closeMobileMenu\}/);
});

test("survey privacy notice is isolated from shared navigation and consent overlays", () => {
  const chrome = read("../components/SiteChrome.tsx");
  const consent = read("../components/ConsentBanner.tsx");
  const tracker = read("../components/AnalyticsTracker.tsx");
  const page = read("../app/privacy-questionario/page.tsx");
  assert.match(chrome, /"\/privacy-questionario"/);
  assert.match(chrome, /if \(immersiveRoutes\.has\(pathname\)\) return null/);
  assert.match(consent, /pathname === "\/privacy-questionario"/);
  assert.match(tracker, /pathname === "\/privacy-questionario"/);
  const clickTracker = read("../components/AnalyticsClickTracker.tsx");
  assert.match(clickTracker, /pathname === "\/privacy-questionario"/);
  assert.match(clickTracker, /pathname === "\/questionario-cittadini"/);
  assert.match(clickTracker, /pathname\.startsWith\("\/questionario-cittadini\/"\)/);
  assert.match(tracker, /pathname === "\/questionario-cittadini"/);
  assert.match(tracker, /pathname\.startsWith\("\/questionario-cittadini\/"\)/);
  assert.match(consent, /pathname === "\/questionario-cittadini"/);
  assert.match(consent, /pathname\.startsWith\("\/questionario-cittadini\/"\)/);
  assert.match(clickTracker, /}, \[pathname\]\);/);
  assert.doesNotMatch(page, /href="\/(?!\/)/);
  assert.match(page, /Jessica Lucchesi/);
});

test("admin shell navigation is visible on dashboard, review queue and itineraries", () => {
  const dashboardCss = read("../app/admin/admin-dashboard.css");
  const eventsCss = read("../app/admin/eventi/admin-events.css");
  const shellCss = read("../app/admin/admin-a9.css");
  const template = read("../app/admin/template.tsx");
  const links = read("../app/admin/AdminNavLinks.tsx");
  assert.doesNotMatch(dashboardCss, /body:has\(\.admin-dashboard\) \.admin-shell-nav\s*\{\s*display\s*:\s*none/);
  assert.doesNotMatch(eventsCss, /body:has\(\.admin-content-review\) \.admin-shell-nav\s*\{\s*display\s*:\s*none/);
  assert.doesNotMatch(shellCss, /body:has\(\.admin-itineraries-local-nav\)[^{]*\.admin-shell-nav\s*\{\s*display\s*:\s*none/);
  assert.match(template, /<AdminNavLinks applicationsPending=/);
  assert.match(links, /href: "\/admin\/questionari"/);
  assert.doesNotMatch(links, /href: "\/questionario-cittadini"/);
  const surveyPage = read("../app/admin/questionari/page.tsx");
  assert.match(surveyPage, /href="https:\/\/sondaggio\.bimarisnet\.it\/questionario-cittadini"/);
  assert.match(surveyPage, /rel="noopener noreferrer"/);
  assert.match(shellCss, /grid-template-columns:repeat\(5,minmax\(0,1fr\)\)/);
  assert.match(shellCss, /@media\(max-width:600px\)/);
});
