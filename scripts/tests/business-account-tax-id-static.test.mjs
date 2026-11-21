// BIMARIS — DT16. Review-only static checks; no DB or network connectivity.
// Run from repository root: node --test scripts/tests/business-account-tax-id-static.test.mjs
import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
const sql = readFileSync(new URL("../../docs/qa/sql/DT16-BUSINESS-ACCOUNT-TAX-ID-REVIEW-ONLY-20261118.sql", import.meta.url), "utf8");

const checks = [
  ["intentional execution block before DDL", /^\s*(?:--[^\n]*\n|\s)*BEGIN;\s*DO \$blocked\$[\s\S]*?RAISE EXCEPTION[\s\S]*?END\s*\$blocked\$;/i],
  ["verified tax identity table", /CREATE TABLE public\.business_account_tax_identities\s*\(/i],
  ["account key and foreign key", /account_id uuid PRIMARY KEY[\s\S]*?REFERENCES public\.business_accounts\(id\) ON DELETE RESTRICT/i],
  ["tax identity scoped uniqueness", /UNIQUE\s*\(country_code,identifier_kind,identifier_normalized\)/i],
  ["verified_by auth user reference", /verified_by uuid NOT NULL REFERENCES auth\.users\(id\)/i],
  ["RLS enabled", /ALTER TABLE public\.business_account_tax_identities ENABLE ROW LEVEL SECURITY/i],
  ["public roles revoked", /REVOKE ALL ON public\.business_account_tax_identities\s+FROM PUBLIC,anon,authenticated,service_role/i],
  ["service_role read-only grant", /GRANT SELECT ON public\.business_account_tax_identities TO service_role/i],
  ["review-only banner", /REVIEW ONLY/i],
];
for (const [name, pattern] of checks) {
  test(name, () => assert.match(sql, pattern));
}
test("no operator backfill DML", () => {
  // Exclude comments so example rollback/pre-check snippets do not count as executable DML.
  const executable = sql.split("\n").filter(line => !/^\s*--/.test(line)).join("\n");
  assert.doesNotMatch(executable, /\b(?:UPDATE|INSERT\s+INTO|DELETE\s+FROM)\s+public\.operators\b/i);
});
test("no outbound email actions", () => {
  assert.doesNotMatch(sql, /\b(?:inviteUserByEmail|sendEmail|smtp)\b/i);
});
