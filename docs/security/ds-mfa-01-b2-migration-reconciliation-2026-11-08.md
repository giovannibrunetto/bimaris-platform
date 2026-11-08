# BIMARIS — DS-MFA-01/B2: migration history reconciliation

Date: 2026-11-08. Scope: **Supabase Staging only** (`nzdeoimwikhoidtladnu`). **No Production operations.**

## Read-only verified state

- `supabase_migrations.schema_migrations` records `20261106220140 / ds_mfa_01_b1_private_admin_roles` and **no B2** entry.
- `public.is_active_super_admin_session(uuid,uuid)` exists. Its live definition matches the SQL body and attributes of `supabase/migrations/20261106_ds_mfa_01_b2_session_revocation.sql`: `LANGUAGE sql STABLE SECURITY DEFINER SET search_path=''`; checks `auth.sessions.id`, user ID, `aal2`, session expiry, active `security.admin_members` super-admin role and no revocation.
- Function owner: `postgres`. `anon` and `authenticated` cannot execute; `service_role` can execute. A nonexistent session returns false.
- `security.admin_members`: present with RLS enabled, 2 active administrative memberships at inspection.

## Decision and constraints

**HOLD on migration-history write** until the canonical migration version and repair mechanism are approved. Do not reapply B2 DDL just to manufacture a history row. Do not insert directly into `supabase_migrations.schema_migrations` or mark B2 as applied using an arbitrary version. This repo migration filename `20261106_ds_mfa_01_b2_session_revocation.sql` uses a date-only prefix; it does not uniquely identify the exact timestamp version required for a Supabase migration-history repair.

## Controlled reconciliation plan

1. Determine whether B2 was originally installed by manual SQL execution, another migration or a deployment. Compare database audit/change evidence where available.
2. Select and commit a canonical unique timestamp migration filename/version, preserving the reviewed B2 SQL; check repository naming convention and collision-free migration history.
3. Review the Supabase CLI `migration repair --help` and current official documentation for marking an **already-applied** migration as applied. The repair must affect **Staging only**, not execute the SQL body again, and be explicitly authorized as a migration-history mutation.
4. After repair, read `supabase_migrations.schema_migrations`, `pg_get_functiondef`, function privileges and the negative-session test again. Require all PASS.
5. Keep Production NO-GO and block feature-to-staging merge pending other release gates.

This document records verified evidence and a proposed procedure; it does not assert that a repair has been executed.
