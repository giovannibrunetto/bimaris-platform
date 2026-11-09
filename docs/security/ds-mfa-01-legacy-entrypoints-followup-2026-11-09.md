# BIMARIS — DS-MFA-01 | Legacy entrypoints follow-up

Date 2026-11-09. Read-only review of feature branch.

## Directly checked

- `apps/web/app/admin/layout.tsx` uses `isAuthorizedAdmin`, not `isAdminAuthenticated`.
- `apps/web/app/api/admin/login/route.ts` rejects POST with 403; no `createAdminSession` invocation.
- `apps/web/app/admin/mfa-staging/page.tsx` redirects to `/admin/login` only in approved feature Preview and otherwise 404s; it does not render the legacy test component.
- `apps/web/app/admin/mfa-staging/MfaStagingClient.tsx` remains present and includes test-only Supabase Auth interactions. Its presence does not establish an accessible route because the page no longer imports it. Consider deleting unused test-only component after branch-wide reference check.
- `apps/web/lib/admin-policy.ts` contains stale comments claiming legacy login unchanged, contradicted by current feature code. Update documentation when integration is authorized.
- `apps/web/lib/admin-auth.ts` still defines legacy session functions. A branch-wide reference scan remains necessary before removal.

## Search limitation

GitHub connector code search targets the default branch (main), not feature branch. A compare with staging lists 80 changed files, but cannot establish every import/callsite across unchanged files. **No exhaustive absence claim is made.**

## Required branch-wide check

On trusted local checkout of `feature/admin-individual-mfa`, use `git grep -n -E 'createAdminSession|isAdminAuthenticated|verifyAdminPassword|verifyAdminTotp|bimaris_admin_session|MfaStagingClient' -- apps/web`. Review every hit; declarations are not invocations. Do not remove code or merge until assessed.

## Decision

Known main entrypoints are replaced on feature branch; branch-wide audit **OPEN**. No deployment or Production changes. MFA merge remains HOLD.
