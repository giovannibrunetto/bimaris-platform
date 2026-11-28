# DT-QA-RESP — Differential editorial Chromium evidence
Date: 2026-11-27. PR #58. Tested commit ae88387b1a152892d055954c3be4a701a7e8a927.
Run 46008717650, job 140538389632, completed SUCCESS.
https://github.com/giovannibrunetto/bimaris-platform/actions/runs/46008717650
14/14 PASS, 0 FAIL. Chromium Playwright 1.58.2, local Supabase and Next application, synthetic story data. Two representative story detail templates (Crono cover and Dina contain), seven CSS viewports: 360x640, 375x667, 390x844, 430x932, 768x1024, 1280x800, 1440x900.
All cases: document scrollWidth equals viewport width; credit scrollWidth equals clientWidth; credit and text within measured boundaries; 12px credit font; two links with positive measured widths; images decoded. Credit heights 70–88px.
Screenshot artifact 15203490297, 5475531 bytes, SHA-256 archive digest 8cffafa5696d8429988b2aff1e7f79e3f2417d0425efdbf138745f95ce701436, expires 2026-12-04 13:39:56 UTC. Artifact upload confirmed; images not independently inspected by reviewer.
https://github.com/giovannibrunetto/bimaris-platform/actions/runs/46008717650/artifacts/15203490297
Previous failed run 46008282130 was fixture setup error 42P10, fixed by replacing upsert with insert. No application changes.
Decision: PASS differential automated layout checks of recent story detail credits, within synthetic scope. Reuse earlier responsive evidence; no blanket claim of full site visual certification, actual Staging content review, external links reachability or device-specific Safari testing. No merge or Production access. Remaining gates per DT-QA-residual-gates-2026-11-27.md.
