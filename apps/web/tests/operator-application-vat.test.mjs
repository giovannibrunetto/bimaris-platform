import test from "node:test";
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
const read=path=>readFileSync(new URL(path,import.meta.url),"utf8");
const form=read("../app/operatori/candidatura/page.tsx");
const api=read("../app/api/operator-applications/route.ts");

test("operator application offers optional VAT without making it mandatory",()=>{
 assert.match(form,/optionalLabel\("Partita IVA"\)/);
 assert.match(form,/name="vat_number"/);
 assert.doesNotMatch(form,/required\s+name="vat_number"/);
});
test("application API handles optional VAT and rejects malformed input",()=>{
 assert.match(api,/vat_number:text\(body\.vat_number,20\)\|\|null/);
 assert.match(api,/invalid_vat_number/);
 assert.match(api,/\^\\d\{11\}\$/);
});
test("duplicate protection matches the business as well as contact or VAT",()=>{
 assert.match(api,/const sameBusiness=/);
 assert.match(api,/\.from\("operator_applications"\)/);
 assert.match(api,/\.from\("operators"\)/);
 assert.match(api,/normalizeName\(a\.business_name\)===name/);
 assert.match(api,/normalizeName\(o\.name\)===name/);
});
test("rate limiting and data validation remain in place before database writes",()=>{
 assert.ok(api.indexOf("checkApiRateLimit(")<api.indexOf('from("operator_applications").insert(payload)'));
 assert.ok(api.indexOf("invalid_coordinates")<api.indexOf('from("operator_applications").insert(payload)'));
});
