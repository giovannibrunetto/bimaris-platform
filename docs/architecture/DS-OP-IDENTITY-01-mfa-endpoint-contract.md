# DS-OP-IDENTITY-01 — Contratto di integrazione con MFA amministrativa
Data: 2026-11-11
Stato: SPECIFICA ESECUTIVA, NON ATTIVATA

## Riscontri
- apps/web/app/api/admin/operators/route.ts usa isAdminAuthenticated() legacy e createServiceClient().
- apps/web/lib/admin-auth.ts valida cookie bimaris_admin_session con HMAC; non attesta Supabase Auth user_id né aal2.
- Supabase Staging dispone della tabella security.admin_members.
- La funzione public.link_operator_to_business_account(uuid,uuid,uuid) è riservata a service_role.

## Contratto endpoint futuro
POST /api/admin/business-accounts/link-operator (da implementare solo dopo gate MFA)
Body JSON: {operator_id: UUID, account_id: UUID, owner_user_id: UUID}.
1. Validare Origin e Sec-Fetch-Site; anti-CSRF robusto; payload UUID e limite dimensione.
2. Ottenere l'utente da sessione Supabase Auth verificata lato server, non da body.
3. Richiedere aal2 e privilegi Super Admin attivi in security.admin_members con verifica server-side e revoca effettiva.
4. Registrare audit con admin_user_id, operator_id, account_id, owner_user_id, outcome e timestamp; evitare PII superflua.
5. Invocare RPC solo dopo autorizzazione, usando service_role esclusivamente server-side.
6. Non permettere account claim tramite semplice email o partita IVA; richiedere proprietà verificata su entrambe le membership.
7. Rispondere con errore generico ai client, dettagli sicuri in audit; rate limiting.
8. Gestire 409 su operatore già collegato; nessuna riassegnazione implicita.
9. Testare con sessioni MFA individuali reali di Staging, sessioni revocate e utenti non amministratori.

## Separazione ruoli
- Admin: associa account ad attività dopo verifica documentale.
- Owner aziendale: visualizza i propri account con my_business_accounts().
- Owner operatore: mantiene le autorizzazioni esistenti su experiences via operator_memberships.
- Un account membership NON concede automaticamente diritti di modifica su tutti gli operatori collegati.

## Gate
Nessuna route privilegiata aggiunta al legacy. Nessun cambio di Production, nessun merge. Richiesto coordinamento con DS-MFA-01 prima di procedere.
