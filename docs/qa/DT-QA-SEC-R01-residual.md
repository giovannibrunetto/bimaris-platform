# DT-QA-SEC-R01 — Correction and media promotion

27 novembre 2026 — PR #58. Tested commit `8dff461a70aef83b4e74bd3beb5de0c77fcaa47f`.

Evidence: https://github.com/giovannibrunetto/bimaris-platform/actions/runs/45998755905/job/140504726568
CI: https://github.com/giovannibrunetto/bimaris-platform/actions/runs/45998763634 — completed/success.

90 PASS log lines: 10 preparation, 80 functional checks. Two synthetic identities; 34 additional assertions beyond the previous 56-PASS revision suite. Prior seven-suite total 273; deduplicated incremental total 307 (including setup). Do not count the 56 repeated assertions twice or include failed attempts.

Both actors: privileged correction recorded, visible to owner; metadata tampering denied; rejected revision edited; malformed upload path denied; canonical private upload and link successful; anonymous private download denied; correction resubmitted; live experience unchanged before application; cross-bucket copy and SHA-256 equality; promoted media linked; corrected description applied; promoted gallery contains one cover; temporary object removed; published proxy returns identical SHA-256. Prior authorization assertions repeated successfully. Initial run 45998392659 failed at malformed test path, corrected without weakening policy.

SEC-R01.08 and .09 PASS in isolated scope. Privileged operations use local service_role and reproduce the route steps, not positive HTTP execution with real Super Admin MFA. Actual positive admin HTTP path, compensation failure handling and notification delivery not certified here. Manual screenshot on 27 November supports dashboard MFA access only. No remote database or Production mutation; no merge. Overall SEC-R01 isolated scope PASS, integrated administrative residual remains unverified unless separately evidenced. REL-R01 remains blocked.
