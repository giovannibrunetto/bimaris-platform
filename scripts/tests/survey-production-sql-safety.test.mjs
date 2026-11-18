// BIMARIS — DT16 production survey candidate SQL safety regression.
// Static review only: no database connection, no DDL or contact processing.
import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
const file = new URL("../../docs/qa/sql/DS-PRIVACY-QUESTIONARIO-01-V8-production-review-only.sql",import.meta.url);
const sql=readFileSync(file,"utf8");
const count = (regex) => [...sql.matchAll(regex)].length;
test("review-only banner and transactional wrapper",()=>{
 assert.match(sql,/REVIEW CANDIDATE ONLY.*DO NOT APPLY TO PRODUCTION/i);
 assert.match(sql,/\bBEGIN;[\s\S]+\bCOMMIT;\s*$/i);
});
test("existing private schema aborts rather than silently reusing production tables",()=>{
 assert.match(sql,/IF EXISTS\s*\(SELECT 1 FROM pg_namespace WHERE nspname='survey_private'\)/i);
 assert.match(sql,/RAISE EXCEPTION 'Existing survey schema/i);
});
test("collection defaults are closed and release must be separately authorized",()=>{
 assert.match(sql,/CREATE TABLE survey_private\.collection_control[\s\S]*?enabled boolean NOT NULL DEFAULT false/i);
 assert.match(sql,/CREATE TABLE survey_private\.collection_control[\s\S]*?staging_only boolean NOT NULL DEFAULT true/i);
 assert.match(sql,/CHECK\(NOT enabled OR \(NOT staging_only AND release_authorized_by IS NOT NULL AND release_authorized_at IS NOT NULL\)\)/i);
});
test("single definitive submit RPC declaration (no intermediate unsafe variant)",()=>{
 assert.equal(count(/CREATE(?: OR REPLACE)? FUNCTION public\.submit_citizen_survey\s*\(/gi),1);
 assert.match(sql,/IF p_rehearsal IS DISTINCT FROM false THEN RAISE EXCEPTION 'production_rehearsal_disabled'/i);
});
test("survey RPC uses security invoker",()=>{
 assert.match(sql,/CREATE OR REPLACE FUNCTION public\.submit_citizen_survey\([\s\S]*?RETURNS boolean LANGUAGE plpgsql SECURITY INVOKER/i);
});
test("anonymous and authenticated roles are not granted survey data access",()=>{
 assert.match(sql,/REVOKE ALL ON SCHEMA survey_private FROM PUBLIC,anon,authenticated/i);
 assert.doesNotMatch(sql,/GRANT\s+(?:SELECT|INSERT|UPDATE|DELETE|EXECUTE)\b[^;]+\bTO\s+(?:anon|authenticated)\b/i);
});
