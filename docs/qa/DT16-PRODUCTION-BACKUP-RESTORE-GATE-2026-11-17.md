# BIMARIS — DT16 | Production backup and restore gate (17 November 2026)

**Status: HOLD on Production SQL, real responses, public distribution.**
This procedure is an operator checklist, not an instruction to disclose credentials or a declaration of successful backup.

## Verified environment
- Supabase Production project: `vhvccwvcqdhiovpopsze`, PostgreSQL 17.11.
- 35 public-schema tables; logical database size approx. 14 MB on the read-only check.
- `survey_private` absent; `public.submit_citizen_survey` absent; `pg_cron` not installed.
- Staging project: `nzdeoimwikhoidtladnu`; survey collection control `enabled=false`, `staging_only=true`, privacy `2026-11-17-v2`.
- GitHub PR #58 DRAFT; isolated Vercel project protected by SSO for all deployments. Do not modify main site.
- Repository candidate SQL is **review-only**: `docs/qa/sql/DS-PRIVACY-QUESTIONARIO-01-V7-production-candidate.sql`.

## Backup scope and limitations
`scripts/backup-production-encrypted.sh` streams a custom PostgreSQL dump through GPG to a local restricted file. The script does **not** know or persist database credentials. It is not executed automatically. Its ordinary database dump captures only database objects accessible to the authorized backup connection; it does not ensure an exact full Supabase platform backup. PostgreSQL globals (roles, role membership and role credentials), Supabase Storage file bodies, external integrations, Vercel configuration, and external service secrets require a separate inventory/recovery procedure. Do not misrepresent a custom dump as a complete platform backup.

The database's PostgreSQL version is 17.11: use an approved compatible PostgreSQL client (pg_dump 17.x or newer compatible version) and a protected libpq service/PGPASSFILE configured on an authorized workstation. Test database access and expected schema coverage *without exposing secrets*. Do not paste connection strings/passwords into chat, GitHub, CI, or shell command histories.

## Release gate sequence
1. Controller approves backup storage, retention period, data access, encryption recipient, and off-site copy. Verify GPG recipient fingerprint through a separate channel.
2. Run the opt-in backup locally using environment variables documented in the script, with `BIMARIS_BACKUP_CONFIRMATION=BACKUP_ONLY_NO_RESTORE`. No real database backup has been run as part of this record.
3. Confirm a nonzero encrypted archive, restrictive file permissions, and a safe controlled copy. Inventory archived schemas, tables, sequences, functions, and ACLs. Audit omissions and metadata needed to reconstruct Supabase services.
4. Test decrypt + `pg_restore --list` and restore into a **different, controlled PostgreSQL instance** with compatible extensions/roles. Record checksum, table counts, error count and tested date. Do not restore to the live Production database.
5. Independently record the pass/fail outcome of the restore test; controller accepts the remaining data-loss/recovery limitations. Without that evidence the backup requirement is **BLOCKED**.
6. Revalidate Production object preflight and isolated SQL candidate, privacy and processor documentation. Obtain separate authorization **before** applying any DDL in Production.
7. Apply only the dedicated Production migration after release gates, with `collection_control.enabled=false`, `staging_only=true`, empty response/contact tables, RLS and grants checked; real collection stays disabled until an additional GO.

## Synthetic-only test evidence
The script was executed locally with a fake `pg_dump` that emitted a synthetic PGDMP-prefixed fixture, against an ephemeral GPG key. Tests passed for encryption/decryption, single encrypted output with file mode 0600, no plaintext archive in the destination, and cleanup when fake `pg_dump` returned nonzero. This is **not** a database restore test and does not validate connectivity or privileges in Production.

## Rules
**HOLD** merging PR #58 or #57, publishing the survey, removing SSO, adding live environment secrets, applying SQL or collecting real personal data until the outstanding gates have documented PASS.
