# BIMARIS — DS-MFA-01 | Individual admin authentication flow audit

Date 2026-11-09. Static code review only; no credentials, user sessions, database writes or Production changes.

## Files examined

- `apps/web/app/admin/login/page.tsx`, `AdminIndividualLogin.tsx`: Supabase password login then navigation to `/admin/mfa`.
- `apps/web/app/admin/mfa/page.tsx`, `AdminMfaStep.tsx`: stage-host check, authenticated user and active super-admin role check; TOTP enrollment or challenge/verify, require AAL2 before navigating to admin.
- `apps/web/lib/admin-access.ts`, `admin-mfa-guard.ts`: no legacy-cookie bypass; fail closed unless staging hostname, valid Supabase user, matching session identity, AAL2, active session/role RPC.
- `apps/web/app/api/admin/login/route.ts`: legacy POST returns 403.
- `apps/web/app/api/admin/logout/route.ts`: origin guard, legacy cookie clearance, Supabase local signOut. Existing access JWT may survive until expiry; RPC session check is the intended additional defense, subject to runtime validation.
- `apps/web/lib/admin-request-origin.ts`: same-origin mutation gate; reject absent/invalid origin unless same-origin fetch metadata.
- `apps/web/lib/supabase/user-server.ts`: cookie-backed Supabase SSR client.

## Findings and risks

1. **PASS (static)**: individual login, MFA challenge and AAL2 check are present, and admin route guard does not accept legacy shared-cookie authentication.
2. **PASS (static)**: admin role/session RPC is required on privileged requests and failures return unauthorized; staging host restriction is hardcoded for this isolated feature.
3. **OPEN (runtime, high priority)**: verify AAL1 denied, AAL2 allowed only for active super-admin, revoked session denied even with old JWT, and logout behavior; do not assume immediate JWT invalidation solely from `signOut({scope:'local'})`.
4. **OPEN (UX)**: MFA page redirects non-admin users to login; verify this behavior does not create a confusing loop for valid Supabase identities without admin membership.
5. **OPEN (security/operability)**: `admin-auth.ts` retains legacy password/TOTP/session creation functions although login endpoint is disabled; verify no other code paths can invoke `createAdminSession` and schedule removal once migration is validated.
6. **OPEN (code hygiene)**: transition comments should be aligned with actual behavior, and staging-only host checks must not be copied unchanged to Production.
7. **OPEN (session behavior)**: verify cookie refresh and multi-tab logout on Preview with controlled accounts; SSR server-component cookie write may be unavailable in some paths.

## Decision

Static architecture appears directionally sound; **no security certification and no release authorization**. Finish B2 migration-history repair, runtime AAL1/AAL2/revocation and logout tests, and exact CI/release candidate review before merge. Production NO-GO.
