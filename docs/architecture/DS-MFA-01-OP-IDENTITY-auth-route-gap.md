# DS-MFA-01 / DS-OP-IDENTITY-01 — Ricognizione rotte applicative
Data: 2026-11-11
Stato: GAP CONFERMATO — NO-GO NUOVE OPERAZIONI PRIVILEGIATE

## File verificati su fix/ds-ux-admin-02-a1-a5
- apps/web/app/api/admin/login/route.ts: password condivisa + eventuale TOTP configurato via ambiente; createAdminSession() genera cookie legacy.
- apps/web/app/admin/login/page.tsx: form password e OTP; verifica isAdminAuthenticated() legacy.
- apps/web/lib/admin-auth.ts: cookie HMAC bimaris_admin_session; non verifica Supabase Auth session/user_id/aal2.
- apps/web/app/api/admin/operators/route.ts: usa isAdminAuthenticated() e createServiceClient().
- Database Staging: public.is_active_super_admin_session(user_id,session_id) disponibile e controlla auth.sessions.aal2 + security.admin_members.

## Decisione
Non modificare queste rotte nell'ambito di DS-OP-IDENTITY-01 finché DS-MFA-01 non stabilisce la sostituzione della sessione legacy e non conclude i test di regressione. Non attivare endpoint account-linking basati sul cookie legacy.

## Sequenza di integrazione
1. Individuare o implementare in ramo MFA dedicato la sessione individuale Supabase Auth con TOTP aal2.
2. Estrarre user_id/session_id esclusivamente da credenziali verificate lato server.
3. Verificare admin attivo e sessione aal2 tramite gate database, inclusa revoca.
4. Migrare rotte privilegiate con test CSRF, rate limit e regressione.
5. Solo successivamente introdurre endpoint account linking con audit e test cross-account.

Nessun merge, nessun deployment, nessuna modifica Production.
