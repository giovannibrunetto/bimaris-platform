import test from "node:test";
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
const read=(name)=>readFileSync(new URL(name,import.meta.url),"utf8");

test("dashboard and register share ready-to-publish criteria",()=>{
 const dash=read("../app/admin/page.tsx");
 const registry=read("../app/admin/attivita/page.tsx");
 const helper=read("../app/admin/ready-to-publish.ts");
 assert.match(dash,/import \{isReadyExperience\}/);
 assert.match(registry,/import \{isReadyExperience,isReadyAppointment\}/);
 assert.match(dash,/pendingRevisionIds=new Set/);
 assert.match(registry,/readyExperiences=registryExperiences\.filter\(item=>isReadyExperience\(item,pendingRevisionIds\)\)/);
 assert.match(helper,/item\.review_status==="approved"&&!item\.published/);
 assert.match(helper,/!pendingRevisionIds\.has\(item\.id\)/);
 assert.match(helper,/operator\?\.published===true/);
 assert.match(helper,/item\.verification_status==="verified"&&!item\.published/);
});
test("ready to publish filter includes both experience and appointment sections",()=>{
 const registry=read("../app/admin/attivita/page.tsx");
 assert.match(registry,/const experiences = readyOnly \? readyExperiences/);
 assert.match(registry,/\(readyOnly\|\|selected!=="appuntamenti"\)/);
 assert.match(registry,/\(readyOnly\|\|selected!=="esperienze"\)/);
 assert.match(registry,/Da pubblicare \(\{readyTotal\}\)/);
 assert.match(registry,/Vai alla pubblicazione/);
});

test("editorial queue shares loader, preserves separate publication and title",()=>{
 const dash=read("../app/admin/page.tsx");
 const registry=read("../app/admin/attivita/page.tsx");
 const helper=read("../app/admin/ready-editorial.ts");
 assert.match(dash,/loadReadyEditorial\(db\)/);
 assert.match(registry,/loadReadyEditorial\(db\)/);
 assert.match(dash,/eventsToPublish\+experiencesToPublish\+readyEditorial.length/);
 assert.match(registry,/readyExperiences.length\+countReadyAppointments\+readyEditorial.length/);
 assert.match(registry,/title=\{readyOnly\?"Contenuti pronti da pubblicare":"Esperienze e appuntamenti"\}/);
 assert.match(registry,/readyOnly&&<section[^>]+aria-labelledby="registry-editorial"/);
 assert.match(helper,/workspace_id.*version.*action/);
 assert.match(helper,/\["save","photo"\].includes/);
 assert.match(helper,/w.archived/);
 assert.match(helper,/deletedAt/);
 assert.match(helper,/COLLAUDO/);
 assert.doesNotMatch(helper,/\.insert\(|\.update\(|\.delete\(|\.rpc\(/);
});

test("publication queue has distinct navigation and focused summary",()=>{
 const nav=read("../app/admin/AdminNavLinks.tsx");
 const page=read("../app/admin/attivita/page.tsx");
 const shell=read("../app/admin/admin-a9.css");
 assert.match(nav,/href: "\/admin\/attivita\?view=ready", label: "Da pubblicare"/);
 assert.match(nav,/searchParams.get\("view"\) === "ready"/);
 assert.match(nav,/const active = publicationContext \? item.href === "\/admin\/attivita\?view=ready"/);
 assert.match(nav,/!publicationContext && item.href === "\/admin\/contenuti"/);
 assert.match(page,/actions=\{readyOnly\?undefined:/);
 assert.match(page,/!readyOnly&&<nav className="admin-events__filters"/);
 assert.match(page,/aria-label="Contenuti in attesa di pubblicazione"/);
 assert.match(shell,/grid-template-columns:repeat\(5,minmax\(0,1fr\)\)/);
});
