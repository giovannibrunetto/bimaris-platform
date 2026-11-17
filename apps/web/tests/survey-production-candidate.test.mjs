import { test } from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

const file = new URL("../../docs/qa/sql/DS-PRIVACY-QUESTIONARIO-01-V8-production-review-only.sql", import.meta.url);
const sql = await readFile(file, "utf8");

test("V8 stays a review-only document and is transaction-wrapped", () => {
  assert.match(sql,/REVIEW CANDIDATE ONLY\. DO NOT APPLY TO PRODUCTION/);
  assert.match(sql,/^BEGIN;$/m);
  assert.match(sql,/^COMMIT;$/m);
  assert.ok(!file.pathname.includes("supabase/migrations/"));
});
test("exactly one definitive submit RPC; no rehearsal writes", () => {
  assert.equal((sql.match(/CREATE(?: OR REPLACE)? FUNCTION public\.submit_citizen_survey\(/g)??[]).length,1);
  assert.match(sql,/IF p_rehearsal IS DISTINCT FROM false THEN RAISE EXCEPTION 'production_rehearsal_disabled'/);
  assert.match(sql,/GRANT EXECUTE ON FUNCTION public\.submit_citizen_survey\([\s\S]*?TO service_role;/);
});
test("collection disabled by default, final guard, private schema with RLS",()=>{
  assert.match(sql,/enabled boolean NOT NULL DEFAULT false/);
  assert.match(sql,/staging_only boolean NOT NULL DEFAULT true/);
  assert.match(sql,/survey_collection_gate_not_closed/);
  for(const table of ["responses","launch_contacts","rate_limits","collection_control"]){
    assert.match(sql,new RegExp("ALTER TABLE survey_private\\."+table+" ENABLE ROW LEVEL SECURITY;"));
  }
  assert.match(sql,/REVOKE ALL ON SCHEMA survey_private FROM PUBLIC,anon,authenticated/);
});
test("release retention is configured but needs operational proof before GO",()=>{
  assert.match(sql,/CREATE EXTENSION IF NOT EXISTS pg_cron/);
  assert.match(sql,/cron\.schedule\('bimaris-citizen-survey-release-retention'/);
  assert.match(sql,/CREATE FUNCTION survey_private\.run_release_retention/);
  assert.match(sql,/DELETE FROM survey_private\.launch_contacts/);
  assert.match(sql,/DELETE FROM survey_private\.responses/);
});
