# BIMARIS — DS-REL-01: MFA integration scope assessment

Date: 2026-11-09. Scope: read-only comparison of `staging` and `feature/admin-individual-mfa`. No merge or Production action authorized.

## Branch comparison

GitHub compare: 122 commits ahead, 2 behind. Compare reports changes to admin pages, admin API routes, auth helpers, CI, tests, rate limiting and migration files. GitHub compare is not a final-file equality check; verify blob SHAs before deciding a cherry-pick or patch.

## Minimum cohesive MFA set (candidate, not yet approved)

- Authentication: `apps/web/lib/admin-mfa-guard.ts`, `apps/web/lib/admin-access.ts`, `apps/web/lib/supabase/user-server.ts` (verify baseline equality), individual login/MFA pages and their supporting components, logout and legacy login retirement.
- Enforcement: all `apps/web/app/admin/**` protected pages and `apps/web/app/api/admin/**` handlers must be inventoried for authorization and mutation origin guards. A partial replacement can leave bypasses or break existing admin operations.
- Database: `security.admin_members`, `public.is_active_super_admin`, `public.is_active_super_admin_session` and revocation semantics. B2 live definition and service-role-only execution verified on Staging; history repair still pending. B1 filename `20261106_ds_mfa_01_b1_private_admin_roles.sql` is not canonical timestamped, while remote B1 is version `20261106220140`; reconcile naming before migration deployment automation.
- Ancillary public API rate limiter: dedicated `BIMARIS_RATE_LIMIT_HMAC_SECRET` now exists as sensitive Preview variables independently scoped to `staging` and `feature/admin-individual-mfa`; this does not certify runtime RPC behavior. Include its code and tests only as an explicitly reviewed release dependency.
- CI: ensure `pnpm test:auth` includes auth, origin and rate-limit tests on the exact integration candidate. Preserve staging CI-01 changes, including operator application Google Places behavior.

## Specific blockers / follow-up

1. `getVerifiedSuperAdmin()` hardcodes Staging Supabase hostname `nzdeoimwikhoidtladnu.supabase.co`. This is a deliberate fail-closed boundary. **Do not deploy to Production** without a separately approved design for Production identity, secrets and migration lifecycle.
2. `apps/web/lib/admin-policy.ts` retains a comment claiming the legacy login and access adapter remain unchanged, but actual `admin-access.ts` and login route have replaced/disabled legacy access. Align comments and inventory enforcement; do not infer a security gap solely from stale comments.
3. Both SQL migration files need version/name/history consistency. B2 is timestamped `20261106220141`; B1 file remains date-only although Staging migration history records `20261106220140`.
4. Verify mutation origin guard across all admin mutating endpoints, and check complete server-side authorization coverage. Do not treat passing unit tests as proof of full coverage.
5. Confirm that merging to `staging` cannot trigger a Production deployment; obtain exact approval before merge. Keep Production NO-GO.

## Recommended next step

Prepare an isolated integration branch based on current `staging` with a reviewed, minimal cohesive patch set, **after** B1/B2 migration-history reconciliation and route coverage review. Do not cherry-pick all 122 feature commits. No change to `staging`, `main`, database or Vercel Production in this assessment.
