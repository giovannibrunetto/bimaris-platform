# BIMARIS — DT16 | Revisione statica del candidato SQL Production
Data: 17 novembre 2026
Ambito: sola lettura e preparazione. **NO-GO a migrazione, raccolta reale e apertura pubblica.**

## Dati confermati
- Repository: PR #58 draft, SQL in `docs/qa/sql/DS-PRIVACY-QUESTIONARIO-01-V7-production-candidate.sql`; file espressamente REVIEW ONLY.
- Supabase Production `vhvccwvcqdhiovpopsze`: `survey_private` assente, RPC `submit_citizen_survey` assente, `pg_cron` assente (verifica SQL in sola lettura).
- Supabase Staging `nzdeoimwikhoidtladnu`: `collection_control.enabled=false`, `staging_only=true`, privacy `2026-11-17-v2`, autorizzazione al rilascio assente.
- Vercel: SSO attivo per tutti i deployment sia sul progetto BIMARIS principale sia su `bimaris-questionario-isolato`. Preview protetta, raccolta disattivata.
- Ultimi test CI dell'invio nel ramo PR #58: PASS. Nessuna prova live Production.

## Punti positivi verificati staticamente
1. Guard iniziale respinge uno schema `survey_private` già presente, evitando applicazioni cieche.
2. `collection_control` nasce con `enabled=false` e `staging_only=true`; la guardia finale verifica che la raccolta rimanga chiusa.
3. Tabelle dedicate: `responses`, `launch_contacts`, `rate_limits`, retention e run logs, con RLS abilitata.
4. Non sono previsti grant SELECT/EXECUTE ad `anon` e `authenticated` per dati riservati e RPC; le RPC esposte sono `SECURITY INVOKER` e riservate al ruolo server.
5. Versione privacy `2026-11-17-v2`; consenso email versione `launch-only-v1`, archivi distinti per risposte e contatti.
6. La funzione admin di riepilogo test in Production restituisce zero, senza dipendere dalle tabelle storiche Staging.
7. L'applicazione isolata risponde con 503 all'endpoint di invio quando la raccolta non è configurata live, senza fallback verso la modalità di test.

## Requisiti ancora aperti
- **P0 backup:** archivio cifrato realmente prodotto da Production e ripristino riuscito in database diverso; documentare copertura e recupero di ruoli, file Storage, configurazioni.
- **P0 cron:** il candidato crea `pg_cron`, registra il job orario e accede a `cron.job_run_details`. Non è stato verificato su Production; collaudare ruolo di esecuzione, permessi DELETE/INSERT, persistenza job, log e cancellazione effettiva con soli dati sintetici in ambiente isolato.
- **P0 funzione di invio duplicata:** nel candidato SQL sono presenti `CREATE FUNCTION public.submit_citizen_survey(...)` e successivo `CREATE OR REPLACE FUNCTION`. La versione definitiva rifiuta `p_rehearsal=true`, ma un'esecuzione frammentaria prima della sostituzione lascerebbe una definizione diversa. Preparare un candidato atomico con una sola definizione definitiva e verificare in transazione controllata.
- **P0 autorizzazione:** titolare/accordi con fornitori e verifica trasferimenti/log devono risultare formalmente completati, e la Direzione Strategica deve dare GO separato per il DDL Production.
- **P1 report privacy:** l'informativa descrive ancora il collaudo Staging; prima di aprire la raccolta produrre una versione pubblica coerente con Production e verificare canale effettivo per i diritti/cancellazione email.
- **P1 operatività:** documentare recovery/alerting in caso di mancata esecuzione di cron, pulizia delle tabelle di test e verifica fine-to-fine di submit con dati sintetici.
- **P1 accesso pubblico:** eseguire collaudo HTTP effettivo non autenticato su ogni rotta, prima di rimuovere SSO solo al progetto isolato e soltanto dopo GO; per il progetto principale SSO rimane SEMPRE attivo durante la campagna.

## Decisione
PASS della revisione statica preliminare, **non** PASS di applicabilità in Production. Nessuna migrazione eseguita, nessun merge e nessuna modifica della protezione Vercel. Non usare questo rapporto come autorizzazione alla pubblicazione.
