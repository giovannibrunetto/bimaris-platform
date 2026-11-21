# BIMARIS — DT16 | Audit online revoca consenso, cancellazione e retention
Data: 18 novembre 2026
Stato: REVIEW ONLY / NO-GO raccolta reale; nessuna esecuzione di procedure di cancellazione né modifica dati.

## Ambito e fonti
- Staging Supabase `nzdeoimwikhoidtladnu`: cataloghi PostgreSQL `pg_proc`, `pg_tables`, `cron.job`, `cron.job_run_details` letti senza consultare indirizzi email o testo delle risposte.
- Candidato SQL non applicato: `docs/qa/sql/DS-PRIVACY-QUESTIONARIO-01-V8-production-review-only.sql` nella PR #58.
- Bozza informativa live: `docs/qa/DT16-PRIVACY-QUESTIONARIO-LIVE-DRAFT-2026-11-18.md`.

## Evidenze
1. Su Staging esiste la funzione interna `survey_private.erase_launch_contact(p_email text)` con `SECURITY INVOKER` (non SECURITY DEFINER). Normalizza la mail in minuscolo dopo trim, elimina la riga corrispondente in `survey_private.launch_contacts` e registra il conteggio in `survey_private.release_retention_runs` con motivo `erasure`. Nessuna cancellazione è stata chiamata durante questo audit.
2. Il ruolo PostgreSQL `service_role` **non dispone** di EXECUTE su `erase_launch_contact`; neppure `anon` e `authenticated`. Questo è positivo come isolamento, ma impone un canale amministrativo sicuro per l'esecuzione dell'operazione, con autenticazione forte e audit; non è stata dimostrata la disponibilità di un'interfaccia completa.
3. La funzione `survey_private.run_release_retention(p_reason)` è `SECURITY INVOKER`, riservata al ruolo operativo `postgres`. Su Staging il job `bimaris-citizen-survey-retention` (id 1) è attivo con **28 run succeeded, 0 altre**, e il job `bimaris-citizen-survey-release-retention` (id 4) è attivo con **25 run succeeded, 0 altre** alla rilevazione.
4. Le tabelle Staging `survey_private.responses`, `launch_contacts`, `rate_limits`, `collection_control` hanno RLS abilitata.
5. La funzione di cancellazione è presente anche nel candidato SQL V8, che però resta non applicato e privo di prova operativa su Production.
6. `run_release_retention` esegue pulizia di risposte scadute, contatti secondo `contact_expiry`, rate-limits e log oltre 30 giorni. Il suo superamento nello Staging non prova di per sé che la futura istanza Production abbia ruoli, estensioni e permessi sufficienti.

## Requisiti ancora aperti
- **P0 — Processo revoca e diritto alla cancellazione**: definire chi accede alla casella `info@bimarisnet.it`, come viene autenticata la richiesta, chi esegue la procedura, modalità e tempi di riscontro e tracciamento senza reinserire indirizzi nei log. Evitare un'API pubblica di cancellazione basata soltanto su email.
- **P0 — Esecuzione amministrativa**: scegliere un percorso a privilegi minimi, senza esporre `postgres` né concedere EXECUTE generalizzato ai client web. Effettuare collaudo con un indirizzo sintetico in ambiente controllato e verificare conteggi e l'assenza della riga.
- **P0 — Backup/restore**: chiarire la permanenza temporanea di dati rimossi nei backup e la procedura post-ripristino per applicare revoche e cancellazioni, da allineare al testo dell'informativa.
- **P1 — Consenso unico lancio**: verificare modalità documentata per l'invio *una sola volta* e la registrazione di `launch_announced_at`, senza invii duplicati e senza che i contatti revocati ricevano messaggi.
- **P1 — Alerting cron**: i run success esistono; non è ancora dimostrato l'invio di una segnalazione quando un job fallisce o non gira e l'eventuale runbook di recupero.
- **P1 — Test evento di cancellazione**: provare idempotenza su indirizzo assente, log senza dati personali e non interferenza con risposte separate.

## Decisione
PASS solo per esistenza delle funzioni, RLS e storico positivo dei job su Staging. **BLOCKED** la certificazione end-to-end del diritto alla cancellazione e della retention Production.
Non cambiare le funzioni, non applicare SQL, non fare merge, non attivare raccolta o accesso pubblico. SSO BIMARIS principale invariato.
