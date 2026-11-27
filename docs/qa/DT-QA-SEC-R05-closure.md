# DT-QA-SEC-R05 — Least privilege closure
Date: 2026-11-27. PR #58, candidate ae8855c1028c11d740223fe7301957d3e0b38add. Scope: Staging nzdeoimwikhoidtladnu and disposable local QA only.

## Findings and remediation
25 RLS-enabled tables without policies reviewed. Five had surplus direct anon/authenticated ACLs: analytics_events, contact_messages, operator_applications, profiles, event_import_batches. Each had SELECT, INSERT, UPDATE, DELETE and MAINTAIN for both roles. 50 effective table privileges removed in two registered migrations (30 + 20):
- 20261127124649_dt_qa_sec_r05_phase1_least_privilege.sql
- 20261127130604_dt_qa_sec_r05_phase2_least_privilege.sql
Both rollback rehearsals passed and restored original ACLs. Post-application Staging read-only inspection: all five tables have zero residual table and column privileges for both roles, RLS enabled, zero policies, eight service_role table privileges per table (40 preserved). No policies added. Remaining RLS-without-policy advisor INFO findings are not automatically vulnerabilities; no blanket claim about every indirect access path.

## Regression evidence
- Initial local run 46001706475 failed closed with 18 residual ACLs. Local-only fixture reconciles TRUNCATE, REFERENCES, TRIGGER differences before unchanged phase 1 SQL; phase 2 fixture likewise reconciles 12 local extras. This is diagnostic baseline reconstruction, not proof of unmodified fresh-environment migration portability.
- Phase 1 run 46002057768: 23/23 functional assertions PASS; CI 46002066051 success.
- Final run https://github.com/giovannibrunetto/bimaris-platform/actions/runs/46004666497, job 140524710723, 2026-11-27T13:11:07Z: 44/44 PASS, including previous 23 (not additive). Actual local HTTP analytics, contact, application, authentication, browser-cookie session, onboarding and persisted interests, profile page response, calendar import, invalid time rejection, no batch on invalid input, anonymous denial, duplicate prevention, unpublished pending event, direct read/delete denial for anon/authenticated on all five tables, persistence integrity where tested.
- CI https://github.com/giovannibrunetto/bimaris-platform/actions/runs/46004679975 success on same tested commit.
- Local reconstruction includes two explicit ACL fixtures and the preexisting diagnostic reconciliation; no claim of clean canonical replay without fixtures, no real Staging HTTP regression or Production validation in this run.

## Decision
SEC-R05 PASS / CLOSED for scoped Staging privilege hardening and isolated regression. Production, merge, MAI integration remain HOLD; no approval to release. Before release, review target ACL baseline and migration compatibility, validate target-specific functional flows. Compensating rollback (only with approved change and verified baseline): GRANT SELECT, INSERT, UPDATE, DELETE, MAINTAIN on the respective phase tables to anon, authenticated; do not restore other privileges. No paid upgrade or additional cost authorized. This evidence-only commit does not change application code or database.
