# DT-QA — ED-R02 incremental isolated restore

2026-11-27. Candidate `763c4004bd8ec59cdd933a0596a34f171e34dedc`. Private backup repository workflow run 46059435824, job 140709832252, corrective commit e95d329df46626117b0ef07be76fe610bfcb4a74. Verified completed/success and actual job logs.

- Encrypted archive SHA-256 verified; decrypted using existing repository secret.
- 19/19 actual archived editorial objects restored through isolated Supabase Storage API, 36,058,268 bytes; readback SHA-256 matched.
- 19/19 actual candidate editorial image proxy responses matched recovered bytes; image MIME and nosniff verified.
- 39/39 negative checks: anonymous preview and withdrawn synthetic link for each object, one unknown UUID.
- Local private bucket size limit temporarily raised from 3,145,728 to 3,589,905 bytes for restore, then restored before proxy checks. No remote bucket change.
- Schema replay uses previously verified diagnostic 160-migration sequence; no claim of full current schema equivalence.

PASS for incremental archive recovery and candidate proxy with synthetic editorial links. ED-R02 overall remains open for real restored editorial references and historical objects; REL-R01 full application database/Storage restore remains open. No merge or Production change. No repeat of this successful delta test required absent relevant changes.
