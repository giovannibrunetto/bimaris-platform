# BIMARIS — DS-REL-01/CI-01/V12 | GitHub Actions read-only review

Date 2026-11-09. Repository `giovannibrunetto/bimaris-platform`. No configuration change, merge or deployment.

## Verified files

- `staging:.github/workflows/ci.yml`: triggers `push` on `main`, `staging`, and `pull_request`. Job `validate` runs checkout, pnpm/node setup, install, web lint, web typecheck, mobile typecheck, `pnpm test:auth`, web build. No Vercel deployment or Supabase migration command in this inspected file.
- `main:.github/workflows/ci.yml`: push main and pull requests; same checks except `test:auth` is absent.
- `feature/admin-individual-mfa:.github/workflows/ci.yml`: push main, staging, feature and pull requests; same checks as staging including `test:auth`.
- `staging:package.json` defines `test:auth` as `node --experimental-strip-types --test apps/web/tests/auth-redirect.test.mjs`. This alone does not prove all MFA or rate-limit test files are executed in staging.
- Explicit fetches for `.github/workflows/deploy.yml`, `.github/workflows/vercel.yml`, and root `vercel.json` returned 404 on staging; these are not evidence that no other workflows or external automation exist.

## Vercel dashboard cross-check

User-provided Settings → Environments screenshot: Production tracks `main`, Preview tracks unassigned branches. Prior Production deployments with Git ref `staging` may be manual promotions or targeted deployments; not evidence of automatic merge-to-Production behavior.

## Assessment

**PASS for the inspected `ci.yml` files: no automatic Production deployment step.** **NOT a complete inventory** of all GitHub workflows, external GitHub Apps, or manually targeted deployments. Normal merge to `staging` should deploy Preview according to current Vercel branch tracking. Hold merge of PR #35 until remaining security/release gates and explicit authorization. Production NO-GO.
