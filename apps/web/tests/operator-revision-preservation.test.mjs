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
test("revision tags stay visible but cannot be changed without transactional apply workflow",()=>{
 assert.match(source,/disabled=\{Boolean\(revisionId\)\}/);
 assert.match(source,/Interessi della scheda originale, conservati senza modifiche/);
 assert.match(source,/Attività collegate alla scheda originale/);
});
test("successful submit produces visible status after closing editor",()=>{
 assert.match(source,/setSubmissionNotice\("Modifica inviata correttamente a BIMARIS/);
 assert.match(source,/setSubmissionNotice\("Esperienza inviata correttamente a BIMARIS/);
 assert.match(source,/experience-manager__submission-notice" role="status"/);
});
