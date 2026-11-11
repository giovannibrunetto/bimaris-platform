# DS-DISC-01 — matching core (isolated)
Status: feature branch only; NOT wired to public discovery, NOT approved for merge.

The pure function in `match.ts` applies fail-closed gates for publication, operator selection, discovery flag, intent, children, age, verified duration, resolved availability slots and per-experience verified round-trip travel times. It returns IDs and internal exclusion codes, not public experience records.

**Integration prerequisites**
1. Build a server-only adapter for Supabase with RLS-aware publication/approval checks. Never use `discovery_active` alone to publish.
2. Resolve availability recurrence into offset-aware ISO instants in `Europe/Rome`, including DST and booking notice/cutoff rules.
3. Resolve origin/destination and travel times through an approved provider; no straight-line ETA or shared travel time across experiences.
4. Keep diagnostic exclusions server-side; publish only approved candidate details.
5. Add automated repository tests, end-to-end tests and browser QA before connecting to the public UI.
6. Confirm staging/production database isolation before any data mutation.

Local prototype regression: 22/22 Node test scenarios passed before the TypeScript port. **Repository CI has not been run**. No deployment, merge, database writes or public UI changes were performed.
