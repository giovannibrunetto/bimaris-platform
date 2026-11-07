# DS-MFA-01/L — I-1 Policy foundation

**Scope:** branch `feature/admin-individual-mfa`; implementation only, no database/config/deployment/production changes.

## Components
- `apps/web/lib/admin-policy-core.ts`: pure deny-by-default policy with explicit resource/action matrix, `individual_required` and reserved `legacy_explicit` modes. The latter **always denies**: it cannot become an implicit fallback.
- `apps/web/lib/admin-policy.ts`: opt-in server-only adapter to the pre-existing Supabase MFA guard. It does not change `isAuthorizedAdmin()` or any route/page.
- `apps/web/tests/admin-policy.test.mjs`: isolated tests for unknown resources/actions/modes, legacy denial, AAL1, missing/revoked identity, AAL2, permission denial and failure.

## Boundaries
The current guard returns only `userId` after validating AAL2, active super_admin and session through RPC. I-1 adapter therefore has no independently trusted session ID to attach to the actor; the session identifier must be exposed safely by the verified guard in a separately approved integration phase. The optional `hasPermission` callback supports future granular authorization; current role provisioning is unchanged. The matrix is initial and requires validation against exact action strings before I-2.

**Critical:** the existing `isAuthorizedAdmin()` continues to permit legacy-first access. This is intentional compatibility under DS-MFA-01/L, not completed MFA enforcement.

## Test commands
`node --experimental-strip-types --test apps/web/tests/admin-policy.test.mjs`
`pnpm --filter @bimaris/web typecheck`
`pnpm test:auth`
`pnpm --filter @bimaris/web build` (only with approved non-production environment and existing prebuild guard)

## Rollback
Revert the I-1-only commits or remove the three new code/test files and this document; no existing import paths reference the new policy. Confirm legacy admin unchanged and run the existing test suite. No DB, RPC or secret rollback is needed.

## I-2 prerequisites
Explicit authorization, mapping every route/page to resource and action, role/permission model and actor audit design, staged rollout, full regression tests and no implicit legacy fallback.
