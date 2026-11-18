# BIMARIS — DT16 | QA statico candidato SQL identità fiscale
Data 18 novembre 2026
Stato: REVIEW ONLY, SQL non eseguito.

## Fonti verificate
- `docs/qa/sql/DT16-BUSINESS-ACCOUNT-TAX-ID-REVIEW-ONLY-20261118.sql` su PR #58.
- Catalogo Supabase Staging `nzdeoimwikhoidtladnu` interrogato esclusivamente con SELECT e `to_regclass`.
- Suite ripetibile aggiunta a `scripts/tests/business-account-tax-id-static.test.mjs`.

## Esito verifiche statiche nel controllo online
**11 / 11 PASS** su: blocco deliberato prima del DDL, presenza nuova tabella, PK/FK account, vincolo univoco (country_code, identifier_kind, identifier_normalized), FK verificatore Auth, RLS abilitata, revoca grant pubblici, SELECT solo service_role, nessun backfill degli operatori, nessun invio email, indicazione REVIEW ONLY.

Con SELECT su catalogo Staging:
- `to_regclass('public.business_account_tax_identities') IS NULL`: candidata **non applicata** in Staging.
- `public.business_accounts` e `auth.users` esistono.
- In Staging: 0 business account e 0 operatori collegati a business account.

## Limiti e punti da rivedere
- I test statici verificano la presenza dei vincoli **nel testo**, non che PostgreSQL esegua il DDL con successo. Non sono stati eseguiti inserimenti, rollback o test RLS con utenti differenti.
- La tabella proposta ha `account_id` come PK: **un account può avere al massimo un'identità fiscale verificata**. È un vincolo intenzionale da ratificare; una futura estensione multi-paese/multi-identificatore richiederebbe disegno diverso.
- Il CHECK `^[A-Z0-9]{4,32}$` valida solo il formato, **non la correttezza amministrativa della Partita IVA**. La verifica ufficiale resta un passaggio separato.
- La nuova tabella è proposta nello schema `public` con RLS e grant revocati; prima di autorizzarla va valutata l'alternativa schema privato per minimizzare la superficie API.
- La FK `verified_by` presuppone una identità Supabase Auth per il verificatore e `ON DELETE RESTRICT`: definire processi di sostituzione/admin lifecycle.
- Lo script contiene un `RAISE EXCEPTION` intenzionale: anche in clone **non può essere applicato così com'è**. Soltanto dopo GO, produrre una migrazione distinta usando la procedura ufficiale e collaudarla sul clone, non rimuovere il blocco dal file di review e non applicarlo in Production.
- Non è implementato il flusso atomico candidatura → account → membership, la verifica della titolarità, l'anti-race applicativo o la fatturazione unica.
- La suite test in GitHub è stata aggiunta ma l'effettiva esecuzione Node da runner CI deve essere confermata separatamente. L'esito 11/11 qui riguarda i controlli effettuati dal revisore sul contenuto del file.

## Piano test su clone autorizzato, non eseguito
1. DDL in transazione su clone con un nuovo file migrazione esplicitamente autorizzato; rollback provato.
2. Due identità fiscali diverse → creazione indipendente; stessa identità su due account → errore UNIQUE.
3. Un account con più operatori → un'unica posizione commerciale.
4. Utente anonimo/authenticated → nessun accesso diretto alle identità fiscali.
5. Owner non verificato e richiedente con P.IVA altrui → nessuna membership assegnata.
6. Inserimenti concorrenti → nessuna identità fiscale duplicata.
7. Operatori legacy scollegati → nessuna perdita o backfill forzato.

## Decisione
**PASS QA statico; HOLD test dinamici, migrazione e produzione.** Nessun merge PR #58, nessuna raccolta reale, nessuna rimozione SSO sul sito BIMARIS principale.
