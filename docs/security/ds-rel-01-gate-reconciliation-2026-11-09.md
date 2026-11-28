# BIMARIS — DS-REL-01 | Gate reconciliation, 2026-11-09

Scope: read-only GitHub/Vercel verification. No merge, no database mutation, no Production action.

## Updated Vercel evidence

Vercel project `bimaris-platform` environment-variable inventory (values **not decrypted**) confirms `BIMARIS_RATE_LIMIT_HMAC_SECRET` with `target=preview`, `gitBranch=staging`, `type=sensitive`. The same key also exists independently for `feature/admin-individual-mfa` Preview. This supersedes the older 2026-11-08 DS-REL-01 report statement that the staging-scoped variable was absent. Presence does **not** certify effective runtime availability or correct RPC behavior; deployment must incorporate applicable environment changes.

The MFA feature Preview deployment `dpl_BkVPR7QZKyEibbxrMTmYPveQXtLE` for commit `f0fb727` is READY, `target=null`, not Production. User-observed negative tests N01–N04 passed for anonymous admin dashboard, API collaboration, operator and candidature pages; HTTP status for N02 not independently captured.

## Current gates

- **PASS (static):** all 10 operational admin API routes contain `isAuthorizedAdmin()`; all nine POST routes contain `rejectCrossSiteAdminMutation()`.
- **PASS (repository naming):** B1 file now `20261106220140_ds_mfa_01_b1_private_admin_roles.sql`, B2 file `20261106220141_ds_mfa_01_b2_session_revocation.sql`.
- **OPEN:** B2 is installed in Staging but its migration-history entry remains absent until a separately verified repair; do not re-run DDL.
- **OPEN:** authenticated AAL1/AAL2, revocation, negative origin tests, rate-limit RPC runtime tests, end-to-end admin mutations with controlled fixtures.
- **OPEN:** minimal integration candidate based on current staging, complete CI/build, Vercel Production Branch / automatic deployment impact and release authorization.

**Decision: HOLD.** No feature-to-staging merge, no Production deployment.
