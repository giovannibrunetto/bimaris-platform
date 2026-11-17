# BIMARIS — DS-PRIVACY-QUESTIONARIO-01 | Preflight schema Production
Data: 17 novembre 2026
Stato: **PREFLIGHT IN SOLA LETTURA — NON APPLICARE MIGRAZIONI A PRODUCTION**
PR: #57 (DRAFT), branch: `integration/bimaris-consolidated-20261115`

## Perimetro verificato
- Supabase Staging: `nzdeoimwikhoidtladnu` — attivo.
- Supabase Production: `vhvccwvcqdhiovpopsze` — riattivato, `ACTIVE_HEALTHY`.
- Vercel project `bimaris-platform` — `ssoProtection.deploymentType="all"` e accesso pubblico vietato fino ad autorizzazione.
- Ultimo controllo SQL Production: **48 migrazioni storiche**, 35 tabelle public, schema `survey_private` assente, RPC `public.submit_citizen_survey` assente, estensione `pg_cron` assente, ruolo `service_role` presente.
- Staging: **150 migrazioni**, 52 tabelle public, schema `survey_private`, RPC e `pg_cron` presenti.

## Dipendenze effettive del questionario nel repository
Le migrazioni del questionario nel branch sono, in ordine:
1. `20261116170327_citizen_survey_staging.sql` — schema privato, tabelle TEST e RPC test; **guardia project_ref Staging**.
2. `20261117052153_citizen_survey_retention_v4.sql` — retention policy, log, `pg_cron`, cancellazione delle tabelle TEST; **commento Staging-only**.
3. `20261117052751_citizen_survey_privacy_v2.sql` — aggiornamento consenso TEST; **Staging-only**.
4. `20261117074430_citizen_survey_release_ready_v5.sql` — tabelle collection_control/responses/launch_contacts/rate_limits, RPC raccolta e `pg_cron`; **staging-only** e dipende da retention_policy + contact_expiry.
5. `20261117074827_citizen_survey_release_multiline_v5.sql` — sostituzione RPC.
6. `20261117104500_citizen_survey_admin_readonly.sql` — riepilogo admin.
7. `20261117111500_citizen_survey_admin_summary_fix.sql` — correzione riepilogo.
8. `20261117113500_citizen_survey_admin_ideas_paging.sql` — risposte aperte.
9. `20261117142500_citizen_survey_admin_rehearsal_readonly.sql` — riepilogo test, dipende da tabelle TEST.

**Non applicare questi file in blocco su Production.** Il primo contiene un vincolo esplicito al project_ref di Staging; il quarto presuppone tabelle/funzioni create in precedenza. Un trasferimento integrale di Staging copierebbe anche funzionalità non autorizzate e rischierebbe di introdurre dati sintetici.

## Piano minimo futuro — NON eseguito
1. Ottenere un backup di Production sicuro, cifrato, verificato con un ripristino di prova indipendente. L'utility `scripts/backup-survey-encrypted.sh` copre solo `survey_private`, quindi **non sostituisce** il backup prima di una migrazione delle 35 tabelle public e dell'intero ambiente.
2. Progettare migrazioni **nuove e specifiche per Production**: schema `survey_private`, retention policy approvata, collection gate impostato su `enabled=false` / `staging_only=true`, tabelle reali vuote, `pg_cron` e log di cancellazione, autorizzazioni esplicite solo server. Non duplicare le tabelle TEST storiche se non sono richieste. Adattare il codice admin perché i conteggi TEST non dipendano da tabelle assenti nel contesto Production.
3. Conservare la versione privacy `2026-11-17-v2` e il consenso `launch-only-v1`; nessuna raccolta senza conferme contrattuali e approvazione formale della titolare.
4. Verificare con test solo sintetici in **database isolato** l'applicazione e il rollback delle migrazioni specifiche.
5. Dopo autorizzazione di rilascio: eseguire il backup pre-migrazione, applicare migrazioni specifiche a Production, confermare RLS, grants, RPC, retention e blocco raccolta; aggiornare soltanto allora la configurazione server necessaria e mantenere `BIMARIS_SURVEY_COLLECTION_MODE` diverso da `live` fino al GO finale.
6. Ricontrollare **dopo ogni passaggio** `ssoProtection.deploymentType="all"`, disponibilità pubblica e guardia `citizen_survey_collection_open`.

## Query di preflight Production (sola lettura)
```sql
SELECT
  EXISTS(SELECT 1 FROM pg_extension WHERE extname='pg_cron') AS pg_cron_installed,
  EXISTS(SELECT 1 FROM pg_namespace WHERE nspname='survey_private') AS survey_private_exists,
  EXISTS(SELECT 1 FROM pg_proc p JOIN pg_namespace n ON n.oid=p.pronamespace
    WHERE n.nspname='public' AND p.proname='submit_citizen_survey') AS survey_rpc_exists,
  EXISTS(SELECT 1 FROM pg_roles WHERE rolname='service_role') AS service_role_exists,
  (SELECT count(*) FROM information_schema.tables WHERE table_schema='public') AS public_tables;
```

## Stato e decisioni
- PASS: database Production riattivato, Vercel Authentication applicata a tutti i deployment, Staging funzionale, CI #1989.
- FAIL (preparazione schema): oggetti questionario assenti in Production.
- BLOCKED: backup integrale / restore test, DPA account-specifici, conferma della titolare per allineamento informativa, autorizzazione DDL Production.
- HOLD: merge, deploy Production, raccolta reale, rimozione protezione Vercel.
- **NO-GO alla raccolta reale allo stato attuale**.
