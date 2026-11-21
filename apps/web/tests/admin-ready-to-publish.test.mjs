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
 assert.match(registry,/Da pubblicare \(\{readyExperiences\.length\+countReadyAppointments\}\)/);
 assert.match(registry,/Vai alla pubblicazione/);
});
