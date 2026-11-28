# Unified village draft save — isolated QA gate

Status: candidate, OFF by default. Do not enable BIMARIS_VILLAGE_UNIFIED_SAVE or execute candidate SQL on remote environments until isolated QA and a registered migration are approved. No Production.

- One existing form submits text, sources, location, optional cover and credits. Separate publication unchanged.
- New service-role-only SECURITY INVOKER RPC reuses versioned, audited existing save/photo operations in one transaction. Replacement clears only pending reference, not Storage or public cover. Superseded files stay private pending separate reference-aware cleanup.
- Existing pending cover credits prefilled; can change without uploading a new file. Editing a published-only cover's credits requires a replacement file.
- Stale version, wrong model, archived workspace, invalid cover, and missing storage object must reject without changing any text, photo, or audit. Existing legend and culture paths must remain unchanged.
- Test in isolated database: text-only (one version increment), text + valid image (two audited increments, one pending cover), replacement (one pending cover), metadata-only pending cover (same id), stale revision (rollback), invalid file (no mutation), public cover unchanged until publish, publish updates source/license and image reference, anonymous/authenticated denied RPC, mobile/desktop one save control.
- Test actual browser session including file selection, preview, submit, reload and published image after explicit approval. CI + Vercel READY alone do not constitute runtime PASS.
- SQL candidate: docs/qa/sql/village-unified-save-candidate.sql. CLI unavailable in current environment; do not invent migration history or reapply existing migrations.
