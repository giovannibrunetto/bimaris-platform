# BIMARIS — DS-MFA-01 | Negative runtime tests (user-observed)

Date: 2026-11-09. Preview: `bimaris-platform-9o0q1uuc1-giovannibrunetto84-1508.vercel.app`, branch `feature/admin-individual-mfa`, deployment `dpl_BkVPR7QZKyEibbxrMTmYPveQXtLE`, commit `f0fb727623d3f750131bf866ecbbab35a84323d8` (READY).

| ID | Request | Observed result | Assessment |
|---|---|---|---|
| MFA-N01 | Anonymous browser navigation to `GET /admin` in incognito | BIMARIS admin login page shown, not admin dashboard | PASS (visible behavior, user-reported) |
| MFA-N02 | Anonymous browser navigation to `GET /api/admin/experiences/123/collaboration` in incognito | Exact JSON `{"error":"Unauthorized"}` | PASS (response body, user-reported); HTTP status not independently verified |

No authenticated login, write request, database mutation, merge, or Production operation was performed. These tests do not establish full route coverage, response status codes, AAL1/AAL2 behavior, role revocation or CSRF behavior. Next recommended safe checks: browser inspection of HTTP status for N02; anonymous GET of other protected pages; staging-only negative POST with deliberately invalid origin only after separate approval and carefully avoiding privileged mutations.
