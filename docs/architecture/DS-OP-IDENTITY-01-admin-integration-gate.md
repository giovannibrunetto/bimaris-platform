# DS-OP-IDENTITY-01 — Gate di integrazione amministrativa
Data: 2026-11-11
Stato: BLOCCO INTEGRAZIONE — DB FOUNDATION DISPONIBILE SU STAGING

## Evidenza verificata
La rotta apps/web/app/api/admin/operators/route.ts richiama isAdminAuthenticated() da apps/web/lib/admin-auth.ts. Questa verifica usa il cookie legacy bimaris_admin_session firmato con secret, non attesta direttamente un'identità Supabase Auth individuale né aal2.
La rotta utilizza createServiceClient(), perciò un endpoint di associazione account che ne imitasse il modello potrebbe eseguire operazioni privilegiate senza il gate individuale richiesto.

## Decisione
- NON aggiungere action link_business_account alla rotta legacy.
- NON esporre direttamente la RPC link_operator_to_business_account ai ruoli anon/authenticated.
- Conservare la RPC solo service_role; nessun collegamento o backfill automatico.
- Dipendenza esplicita dal completamento del gate DS-MFA-01 e relativa validazione server-side.

## Requisiti per sblocco
1. Identità individuale Supabase Auth, aal2 verificato lato server e ruolo amministrativo revocabile.
2. Protezione CSRF/origin e rate limiting.
3. Audit: admin_user_id, operator_id, account_id, timestamp, outcome; nessuna chiave segreta nei log.
4. Transazione atomica con controllo di proprietà e impossibilità di riassegnazione silenziosa.
5. Test negativi: anon, auth senza aal2, ex-admin, admin revocato, owner non corrispondente, operator già collegato, cross-account.
6. Test positivi con identità fittizie Staging, regressione UI/esperienze/discovery.
7. Autorizzazione separata per merge e Production.

## Stato
La base dati business_accounts, business_account_memberships e operators.business_account_id è presente in Staging. La RPC link_operator_to_business_account è riservata a service_role. Nessuna UI di gestione account autorizzata.
