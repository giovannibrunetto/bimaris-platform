import test from "node:test";
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
const source=readFileSync(new URL("../app/area-operatore/ExperienceManager.tsx",import.meta.url),"utf8");

test("proposed revisions reload original taxonomy and linked collaboration",()=>{
 const start=source.indexOf("async function proposeRevision");
 const end=source.indexOf("async function selectPhotos",start);
 assert.ok(start>=0&&end>start);
 const flow=source.slice(start,end);
 assert.match(flow,/loadTaxonomy\(e\.id\)/);
 assert.match(flow,/loadCollaboration\(e\.id\)/);
 assert.doesNotMatch(flow,/resetCollaboration\(\);setRevisionId/);
});
test("revisions show existing collaboration without attempting a new invitation with null experience id",()=>{
 assert.match(source,/revisionId\?<div className="experience-step"/);
 assert.match(source,/collaboration\.operatorName/);
 assert.match(source,/experienceId=\{editingId\}/);
 assert.match(source,/\(!revisionId&&!collaborationReady\)/);
});
test("revision tags stay visible and remain protected by the rollout flag",()=>{
 assert.match(source,/disabled=\{Boolean\(revisionId\)\&\&!REVISION_TAXONOMY_ENABLED\}/);
 assert.match(source,/Interessi della scheda originale, conservati senza modifiche/);
 assert.match(source,/Attività collegate alla scheda originale/);
});
test("successful submit produces visible status after closing editor",()=>{
 assert.match(source,/setSubmissionNotice\("Modifica inviata correttamente a BIMARIS/);
 assert.match(source,/setSubmissionNotice\("Esperienza inviata correttamente a BIMARIS/);
 assert.match(source,/experience-manager__submission-notice" role="status"/);
});

test("taxonomy modifications are feature-gated until the DB applies them atomically",()=>{
 assert.match(source,/REVISION_TAXONOMY_ENABLED=process\.env\.NEXT_PUBLIC_BIMARIS_REVISION_TAXONOMY_V2==="true"/);
 assert.match(source,/base_interest_keys:taxonomyBaseRef\.current\.interestKeys/);
 assert.match(source,/base_activity_keys:taxonomyBaseRef\.current\.activityKeys/);
 assert.match(source,/disabled=\{Boolean\(revisionId\)\&\&!REVISION_TAXONOMY_ENABLED\}/);
});
test("admin approval refuses taxonomy modifications if database readiness is absent",()=>{
 const admin=readFileSync(new URL("../app/api/admin/experience-revisions/route.ts",import.meta.url),"utf8");
 assert.match(admin,/bimaris_revision_taxonomy_ready/);
 assert.match(admin,/taxonomy-not-ready/);
});
test("admin comparison includes taxonomy and explicitly preserves partner consent",()=>{
 const adminPage=readFileSync(new URL("../app/admin/esperienze/[id]/revisione/page.tsx",import.meta.url),"utf8");
 assert.match(adminPage,/proposedInterests/);
 assert.match(adminPage,/proposedActivities/);
 assert.match(adminPage,/necessita di accettazione autonoma|necessita di accettazione/);
});

test("revision queries cannot silently erase visible taxonomy or partner choices on failure",()=>{
 const flow=source.slice(source.indexOf("async function loadTaxonomy"),source.indexOf("async function edit"));
 assert.match(flow,/if\(interestError\|\|activityError\)throw new Error/);
 assert.match(flow,/if\(error\)throw new Error\("Impossibile verificare la collaborazione/);
 const revision=source.slice(source.indexOf("async function proposeRevision"),source.indexOf("async function selectPhotos"));
 assert.match(revision,/catch\(error\)\{setOpen\(false\);setMessage/);
 assert.match(revision,/finally\{setBusy\(false\);setOpeningRevisionId\(null\)\}/);
});

test("submission and revision draft require one authorized affected database row",()=>{
 const revisionMatches=source.match(/\.eq\("id",revisionId\)\.eq\("operator_id",operatorId\)\.in\("status",\["draft","rejected"\]\)\.select\("id"\)\.maybeSingle\(\)/g)??[];
 assert.equal(revisionMatches.length,2);
 assert.match(source,/if\(!data\)throw new Error\("La proposta non è più modificabile/);
 assert.match(source,/\.in\("review_status",\["draft","rejected"\]\)\.select\("id"\)\.maybeSingle\(\)/);
 assert.match(source,/if\(!data\)throw new Error\("Non è stato confermato l’invio/);
});

test("administrator cannot silently approve an unimplemented partner change",()=>{
 const route=readFileSync(new URL("../app/api/admin/experience-revisions/route.ts",import.meta.url),"utf8");
 const page=readFileSync(new URL("../app/admin/esperienze/[id]/revisione/page.tsx",import.meta.url),"utf8");
 assert.match(route,/collaboration_change/);
 assert.match(route,/partner_consent_id/);
 assert.match(route,/collaboration-not-ready/);
 assert.match(page,/consenso verificato e l’applicazione atomica/);
});

test("taxonomy migration candidate only reports readiness for installed enabled trigger",()=>{
 const sql=readFileSync(new URL("../../../docs/technical/DS-UX-REV-01-taxonomy-atomic-candidate.sql",import.meta.url),"utf8");
 assert.match(sql,/from pg_catalog\.pg_trigger t/);
 assert.match(sql,/t\.tgenabled = 'O'/);
 assert.match(sql,/t\.tgname = 'bimaris_apply_revision_taxonomy_on_approval'/);
 assert.match(sql,/p\.proname = 'bimaris_apply_revision_taxonomy'/);
 assert.doesNotMatch(sql,/as \$\$select true\$\$/);
});

test("taxonomy-only edit is not rejected as a no-op by migration candidate",()=>{
 const sql=readFileSync(new URL("../../../docs/technical/DS-UX-REV-01-taxonomy-atomic-candidate.sql",import.meta.url),"utf8");
 assert.match(sql,/create or replace function public\.guard_noop_experience_revision_submission\(\)/);
 assert.match(sql,/v_intents_same boolean := true/);
 assert.match(sql,/v_activities_same boolean := true/);
 assert.match(sql,/v_content_same and v_media_same and v_intents_same and v_activities_same/);
});
test("reopened taxonomy revisions retain their original concurrency baseline",()=>{
 assert.match(source,/Array\.isArray\(stored\?\.base_interest_keys\)/);
 assert.match(source,/Array\.isArray\(stored\?\.base_activity_keys\)/);
 assert.match(source,/taxonomyBaseRef\.current=\{interestKeys:stored\.base_interest_keys/);
});

test("integration suite requires empty isolated database and rolls back its entire fixture",()=>{
 const fixture=readFileSync(new URL("../../../docs/technical/DS-UX-REV-01-isolated-transaction-suite.sql",import.meta.url),"utf8");
 assert.match(fixture,/BEGIN;/);
 assert.match(fixture,/ROLLBACK;/);
 assert.match(fixture,/REFUSED: test requires a fresh, isolated database/);
 assert.match(fixture,/\\ir DS-UX-REV-01-taxonomy-atomic-candidate\.sql/);
 assert.match(fixture,/EXCEPTION WHEN foreign_key_violation/);
 assert.match(fixture,/EXCEPTION WHEN SQLSTATE 'P0001'/);
 assert.match(fixture,/partner_activity/);
});

test("admin review comparison fails closed when any source dataset is unavailable",()=>{
 const page=readFileSync(new URL("../app/admin/esperienze/[id]/revisione/page.tsx",import.meta.url),"utf8");
 assert.match(page,/if\(revisionError\)/);
 assert.match(page,/if\(livePhotosError\|\|proposedRowsError\|\|liveInterestsError\|\|liveActivitiesError\|\|livePartnersError\)/);
 assert.match(page,/Nessuna decisione è consentita/);
});

test("admin change request never sends rejection notice if transition affected zero rows",()=>{
 const route=readFileSync(new URL("../app/api/admin/experience-revisions/route.ts",import.meta.url),"utf8");
 const start=route.indexOf('if(action==="request-changes")');
 const end=route.indexOf('if(action==="approve-apply")',start);
 const section=route.slice(start,end);
 assert.ok(start!==-1&&end>start);
 assert.match(section,/\.eq\("status","pending"\)\.select\("id"\)\.maybeSingle\(\)/);
 assert.match(section,/if\(!rejected\)return back\(request,"invalid-review-state"/);
 assert.ok(section.indexOf("if(!rejected)")<section.indexOf("sendReviewNotification"));
});

test("revision opening failure stays visible when wizard closes and loading label is per-card",()=>{
 assert.match(source,/!open&&message&&<div className="experience-manager__submission-notice" role="alert"/);
 assert.match(source,/openingRevisionId===e\.id\?"Apertura in corso…":revisionStates\[e\.id\]/);
 assert.match(source,/if\(existingError\)throw new Error\("Impossibile verificare le proposte esistenti: "/);
 assert.match(source,/finally\{setBusy\(false\);setOpeningRevisionId\(null\)\}/);
});

test("revision state is fetched per operator, pending cannot spawn a second proposal and drafts are resumable",()=>{
 assert.match(source,/\.eq\("operator_id",operatorId\)\s*\.in\("status",\["draft","pending","rejected","approved"\]\)/);
 assert.match(source,/\.eq\("experience_id",e\.id\)\.eq\("operator_id",operatorId\)\.in\("status",\["draft","pending","rejected","approved"\]\)/);
 assert.match(source,/revisionStates\[e\.id\]==="pending"/);
 assert.match(source,/disabled=\{busy\|\|!revisionStatesLoaded\}/);
 assert.match(source,/setRevisionStates\(next\);setRevisionStatesLoaded\(true\)/);
 assert.match(source,/revisionStates\[e\.id\]==="draft"\|\|revisionStates\[e\.id\]==="rejected"\?"Riprendi modifica"/);
 assert.match(source,/if\(existing&&\(existing\.status==="pending"\|\|existing\.status==="approved"\)\)/);
 assert.match(source,/if\(error\)throw new Error\("Impossibile caricare le fotografie della revisione/);
});

test("booking and weather fields are informational only on approved experience revisions",()=>{
 assert.match(source,/step===4&&\(revisionId\?<div className="experience-step" role="note"/);
 assert.match(source,/Non sono modificabili in questo flusso/);
 assert.match(source,/if\(error\)throw new Error\("Impossibile leggere le condizioni di prenotazione e meteo/);
 assert.match(source,/revisionId\?<div className="experience-step" role="status"/);
});

test("revision wizard does not briefly open and collapse during async data loading",()=>{
 const start=source.indexOf("async function proposeRevision");
 const stop=source.indexOf("async function selectPhotos",start);
 const code=source.slice(start,stop);
 const loaded=code.indexOf("await Promise.all([loadRevisionMedia");
 const opened=code.lastIndexOf("setOpen(true)");
 assert.ok(loaded>=0 && opened>loaded,"wizard opens only after load promises settle");
 assert.match(source,/if\(open\|\|!message\)return;/);
 assert.match(source,/querySelector<HTMLElement>\('\[role="alert"\]'\)/);
});

test("participant collaboration resolves partner FK explicitly, never the inviting operator",()=>{
 const adminPage=readFileSync(new URL("../app/admin/esperienze/[id]/revisione/page.tsx",import.meta.url),"utf8");
 const relation="operators:operators!experience_operators_operator_id_fkey(name)";
 assert.ok(source.includes(relation));
 assert.ok(adminPage.includes(relation));
 assert.doesNotMatch(source,/approval_status,operators\(name\)/);
 assert.doesNotMatch(adminPage,/approval_status,operators\(name\)/);
});

test("operator editing opens in its own full-screen workspace, not below experience cards",()=>{
 const css=readFileSync(new URL("../app/area-operatore/experience-manager.css",import.meta.url),"utf8");
 assert.match(source,/import \{createPortal\} from "react-dom"/);
 assert.match(source,/createPortal\(<div className="experience-manager experience-edit-screen"/);
 assert.match(source,/Torna alle esperienze/);
 assert.match(source,/document\.body\)\}/);
 assert.match(source,/document\.body\.style\.overflow="hidden"/);
 assert.match(css,/\.experience-edit-screen\{position:fixed;inset:0;/);
 assert.match(css,/@media\(max-width:600px\)/);
});

test("operator resumes an existing revision at an authenticated standalone URL",()=>{
 const page=readFileSync(new URL("../app/area-operatore/page.tsx",import.meta.url),"utf8");
 assert.match(page,/if\(params\.modifica\)\{/);
 assert.match(page,/allowedExperience\.review_status!=="approved"/);
 assert.match(page,/initialRevisionExperienceId=\{params\.modifica\} standaloneEditor/);
 assert.match(source,/router\.push\(\`\/area-operatore\?operatore=\$\{encodeURIComponent\(operatorId\)\}&modifica=\$\{encodeURIComponent\(e\.id\)\}\`\)/);
 assert.match(source,/if\(!standaloneEditor\|\|!initialRevisionExperienceId\|\|!revisionStatesLoaded\)return/);
 assert.match(source,/!standaloneEditor&&<>/);
 assert.match(source,/if\(standaloneEditor\)\{router\.push/);
});

test("portal keeps its experience-manager ancestry for the scoped wizard form CSS",()=>{
 const css=readFileSync(new URL("../app/area-operatore/experience-manager.css",import.meta.url),"utf8");
 assert.match(css,/\.experience-manager \.experience-step>label/);
 assert.match(css,/\.experience-manager \.experience-step input/);
 assert.match(source,/createPortal\(<div className="experience-manager experience-edit-screen"/);
});

test("review editor keeps unified panel and inherits approved BIMARIS brand foundation",()=>{
 const css=readFileSync(new URL("../app/area-operatore/experience-manager.css",import.meta.url),"utf8");
 const foundation=readFileSync(new URL("../app/foundation.css",import.meta.url),"utf8");
 const open=source.indexOf('createPortal(<div className="experience-manager experience-edit-screen"');
 const panel=source.indexOf('className="experience-edit-screen__panel"',open);
 const header=source.indexOf('className="experience-edit-screen__header"',panel);
 const wizard=source.indexOf('ref={wizardRef} className="experience-wizard"',header);
 assert.ok(open>=0&&panel>open&&header>panel&&wizard>header);
 assert.match(foundation,/--bimaris-abyssal-teal:\s*#032126/);
 assert.match(foundation,/--bimaris-ivory:\s*#fffaf4/);
 assert.match(foundation,/--bimaris-gold:\s*#caa86a/);
 const block=css.slice(css.indexOf("DS-UX-REV-02/VISUAL-03"));
 assert.match(block,/\.experience-edit-screen__panel\{/);
 assert.match(block,/\.experience-edit-screen__header\{/);
 assert.match(block,/background:var\(--bimaris-abyssal-teal\)/);
 assert.match(block,/background:var\(--bimaris-ivory\)/);
 assert.match(block,/background:var\(--bimaris-gold\)/);
 assert.match(block,/color:var\(--bimaris-gold\)/);
 assert.match(block,/\.experience-wizard__actions button\.button\{/);
 assert.match(block,/@media\(max-width:650px\)/);
 assert.doesNotMatch(block, /#[0-9a-f]{3,8}\b/i);
});

test("single experience editor has compact header, gold outline and a wider centered form",()=>{
 const css=readFileSync(new URL("../app/area-operatore/experience-manager.css",import.meta.url),"utf8");
 const block=css.slice(css.indexOf("DS-UX-REV-02/VISUAL-04"));
 assert.match(block,/\.experience-edit-screen__layout\{width:min\(100%,960px\)/);
 assert.match(block,/border:2px solid var\(--bimaris-gold\)/);
 assert.match(block,/background:var\(--sand\)/);
 assert.match(block,/\.experience-edit-screen__header\{/);
 assert.match(block,/\.experience-manager\.experience-edit-screen \.experience-step\{\s*max-width:none/);
 assert.match(block,/@media\(max-width:650px\)/);
 assert.doesNotMatch(block, /#[0-9a-f]{3,8}\b/i);
});

test("operator revision editor centers vertically when short and scrolls when tall",()=>{
 const css=readFileSync(new URL("../app/area-operatore/experience-manager.css",import.meta.url),"utf8");
 const rule=css.slice(css.indexOf("DS-UX-REV-02/VISUAL-05"));
 assert.match(rule,/\.experience-manager\.experience-edit-screen\{\s*display:flex;\s*flex-direction:column/);
 assert.match(rule,/\.experience-manager\.experience-edit-screen \.experience-edit-screen__layout\{\s*width:min\(100%,960px\);\s*margin:auto;/);
 assert.match(rule,/flex:0 0 auto/);
 assert.match(rule,/@media\(max-width:650px\)/);
 assert.match(rule,/margin:0 auto/);
 assert.match(css,/position:fixed;inset:0;z-index:10000;overflow-y:auto/);
});

test("existing collaboration is prominent but cannot be edited through revision",()=>{
 const css=readFileSync(new URL("../app/area-operatore/experience-manager.css",import.meta.url),"utf8");
 assert.match(source,/experience-revision-partner__name/);
 assert.match(source,/experience-revision-partner__status--\$\{collaboration\.status\}/);
 assert.match(source,/collaboration\.status==="accepted"\?"Confermata"/);
 assert.match(source,/Attività concordata/);
 assert.match(source,/La collaborazione della scheda originale rimane invariata durante questa revisione/);
 assert.match(css,/\.experience-revision-partner__status--accepted\{/);
 assert.match(css,/var\(--color-success-bg\)/);
});

test("revision submit reports database no-op rejection instead of generic failure",()=>{
 const start=source.indexOf("async function submit()");
 const end=source.indexOf("\n return <section",start);
 const submit=source.slice(start,end);
 assert.match(submit,/errorMessage\(err,"Invio non riuscito/);
 assert.match(submit,/La proposta non contiene modifiche rispetto alla versione online/);
 assert.match(submit,/Nessuna modifica da inviare: questa bozza è identica alla versione già approvata/);
 assert.doesNotMatch(submit,/err instanceof Error\?err\.message:"Invio non riuscito"/);
});

test("successful standalone revision submit returns to list and only confirms a verified pending revision",()=>{
 assert.match(source,/if\(standaloneEditor\)\{router\.replace\(\`\/area-operatore\?operatore=\$\{encodeURIComponent\(operatorId\)\}&inviata=\$\{encodeURIComponent\(revisionId\)\}\`\);return\}/);
 assert.match(source,/new URLSearchParams\(window\.location\.search\)\.get\("inviata"\)/);
 assert.match(source,/\.eq\("id",submittedRevisionId\)\.eq\("operator_id",operatorId\)\.eq\("status","pending"\)\.maybeSingle\(\)/);
 assert.match(source,/if\(active&&data&&!error\)setSubmissionNotice/);
 assert.match(source,/Modifica non disponibile/);
 const css=readFileSync(new URL("../app/area-operatore/experience-manager.css",import.meta.url),"utf8");
 assert.match(css,/\.experience-edit-route__loading\{/);
});

test("global admin access is visibly linked without bypassing protected server gate",()=>{
 const page=readFileSync(new URL("../app/area-operatore/page.tsx",import.meta.url),"utf8");
 const header=readFileSync(new URL("../components/Header.tsx",import.meta.url),"utf8");
 const admin=readFileSync(new URL("../app/admin/page.tsx",import.meta.url),"utf8");
 const adminGate=readFileSync(new URL("../lib/admin-access.ts",import.meta.url),"utf8");
 assert.doesNotMatch(page,/operator-admin-shortcut|canAccessAdministration/);
 assert.match(header,/const adminLinks=\[\{href:"\/admin",label:"Area Amministratore"\}\]/);
 assert.match(header,/\[\.\.\.accessLinks,\.\.\.adminLinks\]\.map/g);
 assert.doesNotMatch(header,/adminAuthorized|\/api\/admin\/access-state/);
 assert.match(admin,/if \(!\(await isAuthorizedAdmin\(\)\)\) redirect\("\/admin\/login"\)/);
 assert.match(adminGate,/getVerifiedSuperAdmin/);
});

test("administrator operator queue defaults to pending work; archive contains approved records",()=>{
 const page=readFileSync(new URL("../app/admin/operatori/page.tsx",import.meta.url),"utf8");
 assert.match(page,/const archive=vista==="archivio"/);
 assert.match(page,/filter\(o=>archive\|\|pendingForOperator\(o\.id\)>0\)/);
 assert.match(page,/e\.operator_id===o\.id&&\(archive\|\|needsReview\(e\)\)/);
 assert.match(page,/revisionPending\?"MODIFICA DA ESAMINARE":"NUOVA ESPERIENZA DA ESAMINARE"/);
 assert.match(page,/\/admin\/operatori\?vista=archivio#operator-archive/);
});
test("event editorial queue is distinct, mobile responsive and warns of publication",()=>{
 const page=readFileSync(new URL("../app/admin/eventi/page.tsx",import.meta.url),"utf8");
 const css=readFileSync(new URL("../app/admin/eventi/admin-event-review.css",import.meta.url),"utf8");
 const dashboard=readFileSync(new URL("../app/admin/page.tsx",import.meta.url),"utf8");
 assert.match(page,/\.eq\("verification_status","pending"\)/);
 assert.match(page,/segnalazioni evento/);
 assert.match(page,/Non equivale all'approvazione di un'esperienza/);
 assert.match(page,/row\.source_label\|\|sourceTypeLabel\(row\.source_type\)/);
 assert.match(page,/status=.+approved/);
 assert.match(page,/name="action" value="approve"/);
 assert.match(page,/name="action" value="reject"/);
 assert.match(css,/@media\(max-width:640px\)/);
 assert.match(css,/var\(--bimaris-gold\)/);
 assert.match(dashboard,/label:"Segnalazioni eventi da verificare"/);
});
