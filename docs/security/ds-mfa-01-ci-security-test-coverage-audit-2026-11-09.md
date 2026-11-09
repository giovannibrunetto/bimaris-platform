# BIMARIS — DS-MFA-01 | CI security-test coverage audit

Date 2026-11-09. Read-only code inspection, documentation-only commit; no application code or workflow changes.

## Verified

- `feature/admin-individual-mfa:.github/workflows/ci.yml` invokes `pnpm test:auth` alongside lint, typecheck and build.
- `feature/admin-individual-mfa:package.json` defines `test:auth` as `node --experimental-strip-types --test apps/web/tests/auth-redirect.test.mjs`.
- `apps/web/tests/admin-policy.test.mjs` exists and tests policy rejection of AAL1, missing role, unknown actions and legacy mode, plus AAL2 valid policy.
- `apps/web/tests/admin-origin-guard.test.mjs` exists and checks source-level origin guard placement for 10 routes including logout.
- `apps/web/tests/admin-origin-runtime.test.mjs` exists and exercises same-origin acceptance and cross-site/malformed origin rejection via a transpiled TypeScript guard.
- These three security tests are **not invoked by the inspected root test:auth command or CI workflow**. No claim is made about other external CI jobs or manual runs.
- `admin-policy-core.ts` explicitly documents the policy engine as not wired to existing routes. Passing its unit tests would not alone certify runtime admin route authorization.

## Assessment

**CI COVERAGE GAP — actionable before MFA integration.** Security tests exist but the verified CI path does not execute them. Recommend an explicitly reviewed change to add a dedicated test script (or expand test:auth) and include it in the CI workflow. Validate locally or via isolated Preview PR, ensuring TypeScript availability for admin-origin-runtime.test.mjs. Also require authenticated AAL1/AAL2 and revocation runtime tests; static/unit tests are not substitutes.

## Release decision

HOLD merge PR #35, Production NO-GO. No application/CI modifications authorized or performed in this audit.
