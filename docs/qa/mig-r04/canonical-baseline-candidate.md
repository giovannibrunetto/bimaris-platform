# MIG-R04 — Candidate canonical baseline (application scope)
Status: CANDIDATE, isolated testing only; no remote registry mutation, no merge or Production.
The canonical candidate is a deterministic ordered set of 159 recovered/integrative migrations followed by the observed reconciliation SQL as one final local-only migration. It preserves every source migration as a separate historical unit rather than flattening potentially noncommutative DDL. The final migration uses the next unused local test version 20261125100943, a diagnostic label only, not a proposed remote registration. No survey migrations or temporary backup permissions.
Input Git blob IDs:
- 20261021-registry-replay.json e3e1e6d3e528bb1c31ceda3acc5637f95fd64e4b
- 20261022-20261125-replay.json 13672e7ee86c70a5f1f1b274a2b7fed6302fa107
- observed-staging-reconciliation.sql edec7fdfa79ca96ddb979301d2b325e2f8c72ce0
Acceptance: clean local boot and reset, each applying all 160 units including reconciliation; compare 2264 selected Staging fingerprints after each run. No remote credentials, no seed, no operational files modified. A successful run establishes candidate reconstructability only; runtime tests and full production deployment plan remain distinct.
Existing environments: do not execute this baseline over an existing schema. Preserve registry and compare version/name/content and actual objects; resolve unmatched/overlapping files individually. Any future registration-only strategy requires evidence for each migration and separate approval, including review of data effects that structural fingerprints cannot prove. Do not mark unapplied migrations as applied. Preserve survey and backup history independently. No registry repair command authorized.
