# DS-MFA-01 / DS-OP-IDENTITY-01 — Verifica ramo MFA
Data: 2026-11-11
Stato: IMPLEMENTAZIONE INDIVIDUATA — INTEGRAZIONE NON AUTORIZZATA

## Evidenze GitHub
Ramo feature/admin-individual-mfa rispetto a staging: diverged; 153 commit ahead, 2 behind alla verifica.
- apps/web/lib/admin-mfa-guard.ts implementa getVerifiedSuperAdmin: vincolo host Staging, sessione Supabase, getUser(accessToken), AAL2, RPC is_active_super_admin_session, fail-closed.
- apps/web/lib/admin-access.ts espone isAuthorizedAdmin() su gate individuale.
- apps/web/app/api/admin/operators/route.ts usa isAuthorizedAdmin() e rejectCrossSiteAdminMutation().
- Presenti test admin-mfa-regression, admin-origin-guard, admin-origin-runtime, admin-policy.
- Sul ramo fix/ds-ux-admin-02-a1-a5 resta la rotta legacy: le modifiche non sono state integrate.

## Criticità
- La divergenza estesa richiede confronto e selezione dei commit, non merge automatico.
- Il guard impone hostname Staging, corretto per il collaudo ma non è una configurazione Production pronta.
- Test runtime individuali, token/sessione e revoca devono essere verificati nel contesto di deployment prima del rilascio.
- Nessuna route account linking deve usare il cookie legacy.

## Decisione
Non modificare il ramo MFA, non fondere i rami, non attivare account linking. Preparare coordinamento con Direzione Tecnica per integrazione selettiva e gate DS-MFA-01.
