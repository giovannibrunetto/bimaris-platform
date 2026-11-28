# REL-R01 — Canonical synthetic database recovery

Date: 2026-11-26. PR #58. Isolated QA only; no merge or deployment authorization.

## Evidence
- Candidate: `a09c9199fcb870223a4d39a3b16c7da7536f0b08`.
- [Successful run 45768073490](https://github.com/giovannibrunetto/bimaris-platform/actions/runs/45768073490), job 139733735754, completed SUCCESS.
- Previous run 45767630889 failed because system constraint triggers could not be disabled. Corrective workflow orders archive entries according to foreign key dependencies and retains triggers.

## Verified results
- Canonical local replay (160 migration files), synthetic Auth identity setup and operator/experience fixtures.
- Ten fixture and authentication checks passed.
- Encrypted archive round trip passed.
- Dependency-ordered archive scope: 58 tables.
- All 58 table fingerprints matched.
- RLS enabled on 58 tables.
- Foreign-key integrity check passed for non-null keys.
- Local elapsed recovery: 33 seconds, measured from restart of isolated stack through restore and verification; excludes acquisition, operator response, external infrastructure and full application validation.

## Decision and limitations
PASS for synthetic canonical database recovery only. The 58 tables are included in the archive but not necessarily populated with representative synthetic records in every table. No actual Staging database backup or restore, real Auth recovery, Storage object recovery, negative post-recovery authorization tests or production-grade RPO/RTO certified. Survey remains outside authorized scope. REL-R01 remains PARTIAL PASS. No changes to remote database or temporary backup roles. Next: integrated synthetic Storage recovery and functional verification, then actual authorized backup and controlled isolated recovery.
