# BIMARIS — DS-MFA-01 | Admin API static coverage audit

Date: 2026-11-09. Branch: `feature/admin-individual-mfa`. Method: inspect full source of the ten operational admin route handlers through GitHub, read-only. **No runtime certification.**

| Admin route | Method | `isAuthorizedAdmin()` | `rejectCrossSiteAdminMutation()` |
|---|---|---|---|
| `applications` | POST | Yes | Yes |
| `events/[id]/status` | POST | Yes | Yes |
| `experience-revisions` | POST | Yes | Yes |
| `experiences/[id]/collaboration` | GET | Yes | N/A (read) |
| `experiences/create` | POST | Yes | Yes |
| `experiences` | POST | Yes | Yes |
| `itineraries` | POST | Yes | Yes |
| `operator-memberships` | POST | Yes | Yes |
| `operator-revisions` | POST | Yes | Yes |
| `operators` | POST | Yes | Yes |

**Findings:** 10/10 operational handlers contain an individual-admin authorization call; 9/9 POST handlers contain a mutation origin guard. In the inspected handlers, origin and authorization guards appear at the start of each exported method, before privileged work. `admin-access.ts` delegates to `getVerifiedSuperAdmin()`, which checks Supabase Auth identity, AAL2, session-aware role RPC and Staging hostname. Legacy login POST returns 403 and is not counted as an operational handler. Logout is separately classified as authentication housekeeping.

**Limitations:** textual source inspection is not runtime authorization coverage. It does not validate all branches, user input, tenant boundaries, service-role actions, audit trail, error redirects or CSRF behavior under browser/proxy variations. Do not infer that every privileged operation has passed a runtime test. No requests or data writes were performed.

**Release gate:** perform targeted staging-only negative tests (anonymous, AAL1, revoked session, cross-site mutation) on all ten routes without invoking successful mutations; require separate authorization before any fixture-backed positive action. Keep Production NO-GO, no merge.
