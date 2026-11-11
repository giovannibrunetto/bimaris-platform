# DS-OP-IDENTITY-01 — Security QA / Staging
Data: 2026-11-11
Stato: PARZIALE — NO-GO RILASCIO

## Verifiche eseguite
- Funzione public.link_operator_to_business_account(uuid,uuid,uuid) presente su Staging.
- Privilegi EXECUTE: anon=false; authenticated=false; service_role=true.
- Test SQL negativo con UUID sintetici e chiamante privo di auth.role()='service_role': eccezione insufficient_privilege attesa e intercettata.
- Nessun operatore collegato ad account aziendale alla verifica.
- Nessun dato di produzione modificato.

## Limiti delle evidenze
- Non ancora verificata una chiamata effettiva con JWT service_role.
- Non ancora verificati casi di proprietario valido, proprietario errato, account inesistente, operatore già associato, richieste concorrenti.
- Non ancora verificata l'integrazione con UI, middleware, route server e regressione RLS cross-account.
- La funzione richiede doppia proprietà attestata dalle membership preesistenti; nessun claim via email/VAT.
- La nuova struttura è isolata; nessuna associazione o backfill automatico.

## Gate prima dell'uso
1. Preparare identità e operatori fittizi di collaudo in Staging, senza riutilizzare credenziali reali.
2. Eseguire matrice di test con role service_role e proprietari diversi.
3. Controllare log, transazioni e isolamento.
4. Implementare endpoint amministrativo server-side con autenticazione forte e audit.
5. Testare UI e regressione; richiedere approvazione separata per merge e Production.
