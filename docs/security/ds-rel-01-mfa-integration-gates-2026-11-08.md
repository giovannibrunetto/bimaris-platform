# BIMARIS — DS-REL-01 / MFA integration gates

Date: 2026-11-08. Status: **HOLD — no merge, no Production deployment**.

## Evidence

- MFA feature head `740318869a91640c2c7a265b90440ce62e359c10`: GitHub Actions `ci.yml` push run `validate` **SUCCESS** (user-supplied run screenshot, 1m08s); Vercel Preview deployment `dpl_93M2NFmZeNjKEgXjcsDnbAwU8kpK` **READY**, target null.
- Five isolated rate-limit regression tests added in `apps/web/tests/api-rate-limit.test.mjs` and included in root `pnpm test:auth`; the successful CI run covers this command. These are mock-RPC tests, **not** Supabase runtime certification.
- Public Preview page loads; GET `/api/contact` returns 405; empty JSON POST returns 400 `privacy_consent_required` (browser screenshots). The POST is rejected before rate limiting; no application insert is attempted.
- `apps/web/app/operatori/candidatura/page.tsx` has identical blob SHA `8357255852de37fed7f7a8dc5cbd9a466480c704` on staging and MFA feature, preserving CI-01 Google Places correction.
- Vercel Preview feature branch has `BIMARIS_RATE_LIMIT_HMAC_SECRET` scoped to `feature/admin-individual-mfa`. The inspected Vercel environment-variable inventory does **not** list that key for `staging`; do not infer its presence or copy secret values. Feature rate limiter fails closed with `unavailable` (HTTP 503 in public routes) when the dedicated key is missing.
- `apps/web/lib/admin-mfa-guard.ts` hardcodes staging Supabase host `nzdeoimwikhoidtladnu.supabase.co` and fails closed elsewhere. Both SQL migrations `20261106_ds_mfa_01_b1_private_admin_roles.sql` and `20261106_ds_mfa_01_b2_session_revocation.sql` are explicitly staging-only.
- Git compare staging...feature showed 118 commits ahead, 2 behind, 68 files as of inspection. Compare file lists can include paths whose current blobs are equal; verify final blobs and branch mergeability separately.

## Mandatory gates before any merge to staging

1. **Release scope:** decide and review a minimal MFA integration set, including route-level admin enforcement, login and recovery, test files, and any migration references. Do not blindly merge all feature history. Preserve current staging fixes and validate current blob content.
2. **Environment:** configure a dedicated rate-limit HMAC secret for staging Preview through an approved secret-management change; verify its effective branch scope **without displaying secret values**. Check Supabase URL/key consistency and ensure Production is not referenced by MFA guard.
3. **Database:** obtain explicit staging-only migration approval; verify application and permissions of both SQL migrations in staging, with evidence of the RPC and no Production changes. No implicit migrations in CI or build.
4. **Runtime:** conduct controlled staging-only tests of rate-limit allow/limited/unavailable and MFA login/AAL2/revocation on designated test identities. No contact form submission or production data writes for a rate-limit smoke test. If an RPC test necessarily mutates a staging counter, authorize and document the isolated test data and cleanup first.
5. **CI and Preview:** rerun lint, web/mobile typecheck, all auth/rate-limit suites, and build on the exact candidate commit; verify Vercel target Preview and production branch/deployment rules before merge.
6. **Authorization:** request Direzione Strategica approval for the exact integration candidate and deployment effects; do not interpret CI success as authorization to merge.

## Current decision

**HOLD** on complete feature-to-staging merge. No Production deployment. The passing isolated rate-limit tests close the code-regression check, but do not close Supabase runtime integration or release-environment gates.
