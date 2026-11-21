# BIMARIS — DS-MFA-01 | Legacy admin session entrypoint audit

Date: 2026-11-09. Read-only code inspection; no merge, deployment or database changes.

## Verified branch differences

| File | main | staging | feature/admin-individual-mfa |
|---|---|---|---|
| `apps/web/app/api/admin/login/route.ts` | invokes `createAdminSession()` | invokes `createAdminSession()` | POST always returns 403 `legacy_admin_login_disabled` |
| `apps/web/app/admin/layout.tsx` | uses `isAdminAuthenticated()` | uses `isAdminAuthenticated()` | uses `isAuthorizedAdmin()` |
| `apps/web/lib/admin-auth.ts` | legacy session code present | legacy session code present | legacy functions still defined, including `createAdminSession()` |

The feature's `admin-access.ts` delegates to `getVerifiedSuperAdmin()` and requires individual Supabase identity, AAL2, role and active session checks. The feature's logout clears the legacy cookie and signs out of Supabase locally.

GitHub code search is restricted to the repository **default branch** (`main`), and returned `createAdminSession` references in `admin-auth.ts` and `api/admin/login/route.ts` there. These search results **cannot** prove absence of other references on the feature branch. Direct fetch of feature login route and admin layout confirms these two known legacy entrypoints have been replaced, but exhaustive feature-branch import/callsite coverage remains **OPEN** pending branch-aware repository-wide search.

## Assessment

- **PASS (limited static):** two previously known legacy entrypoints are closed/replaced on the isolated MFA feature.
- **OPEN:** full feature-branch reference inventory for `createAdminSession`, `isAdminAuthenticated`, `verifyAdminPassword`, `verifyAdminTotp` and cookie `bimaris_admin_session`.
- **OPEN:** staging and main still have legacy login until a separately authorized integration.
- **HOLD:** no feature merge or Production deployment; B2 repair and authenticated AAL1/AAL2/revocation tests remain mandatory.
