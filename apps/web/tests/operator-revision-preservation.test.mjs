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
 assert.match(source,/createPortal\(<div className="experience-edit-screen"/);
 assert.match(source,/Torna alle esperienze/);
 assert.match(source,/document\.body\)\}/);
 assert.match(source,/document\.body\.style\.overflow="hidden"/);
 assert.match(css,/\.experience-edit-screen\{position:fixed;inset:0;/);
 assert.match(css,/@media\(max-width:600px\)/);
});
