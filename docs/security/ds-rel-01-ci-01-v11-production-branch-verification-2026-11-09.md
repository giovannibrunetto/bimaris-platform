# BIMARIS — DS-REL-01/CI-01/V11 | Production branch verification

Date: 2026-11-09. Scope: read-only assessment; no Vercel configuration, merge or deployment changes.

## Direct dashboard evidence (user-provided screenshot)

Vercel Project Settings → Environments for `bimaris-platform` shows:

- **Production**: Branch Tracking = `main`; associated domains include `www.bimarisnet.it` (+4).
- **Preview**: Branch Tracking = `All unassigned git branches` (includes `staging` if not separately assigned).
- **Development**: Accessible via CLI.

Vercel Git Settings screenshot shows connected GitHub repository `giovannibrunetto/bimaris-platform`, Git-linked deployments, and no Deploy Hooks listed.

Vercel deployment history includes Production-target deployments whose Git commit ref is `staging` (e.g. `dpl_AXfhqG9r553NaKjGy1sXsK3PiGDc`, commit `27dd6873f25f9d881768b59a9ecd4c4299b37123`). Their existence does not establish automatic Production deployments on a merge into staging: manual promotion or explicitly targeted deployment is a plausible explanation, not independently proven.

## Assessment

A **normal Git merge into `staging` should trigger Preview, not automatic Production**, under the observed current Branch Tracking configuration. This is high-confidence evidence on branch assignment, but it does not rule out external workflows, manually targeted Production deploys, or future configuration changes. Review GitHub Actions and any automation before treating as a universal guarantee.

**CI-01/V11 branch-mapping check: PASS (current dashboard configuration).**
**MFA release decision: HOLD.** No PR #35 merge authorization; B2 migration-history reconciliation, AAL1/AAL2/revocation tests, exact integration candidate, CI and approvals remain outstanding. Production NO-GO.
