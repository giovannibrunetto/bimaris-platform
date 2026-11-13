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
 assert.match(revision,/finally\{setBusy\(false\)\}/);
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
