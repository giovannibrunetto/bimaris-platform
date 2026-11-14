# BIMARIS — QA di integrazione amministrativa eventi / PR #56

**Data:** 14 novembre 2026
**Baseline:** PR #47 / `integration/mfa-staging-reconciliation-20261112`
**Candidato:** PR #56 / `integration/mfa-events-review-20261114`
**Stato:** CI automatica PASS; QA browser e MFA live NON ESEGUITI; merge/deploy HOLD.

## Evidenze verificate in sola lettura

- CI GitHub #1811 PASS con test di autenticazione/MFA, API eventi simulate, lint, typecheck web/mobile e build.
- Vercel Preview deployment `dpl_5TDCwTsHzj7H22nVqkEJtVFmozPh`, SHA `6c6b7f2d1c7345a0c356903d226826f06258d49b`, READY, target Preview, SSO Protection attiva.
- La variabile Vercel `NEXT_PUBLIC_SUPABASE_URL` globale Preview punta al progetto Supabase **BIMARIS Staging**; verificare gli altri segreti prima dell'E2E.
- Supabase Staging: `public.events` ha RLS attiva; unica policy di lettura pubblica con condizione `published=true`; 4 record `pending, published=false` rilevati, senza alterazioni.
- Vincolo database esistente limita `verification_status` a `pending|verified|rejected`. **Non esiste ancora il CHECK `NOT published OR verification_status='verified'`**. Non introdurre modifiche DB senza revisione della compatibilità con dati e importazioni.
- Supabase Security Advisor: INFO su tabelle senza policy RLS (default deny), WARN per `public.my_business_accounts()` SECURITY DEFINER eseguibile da `authenticated` e protezione password compromesse non abilitata. **Non** equiparare gli avvisi a vulnerabilità confermate; aprire valutazione di sicurezza distinta.
- Vercel Preview non accessibile dalla rete del runner esterno (DNS); non è stato effettuato collaudo browser reale né disabilitata la protezione SSO.

## Collaudi E2E da effettuare in sessione autorizzata

| ID | Prova | Atteso |
|---|---|---|
| SEC-01 | Senza login su `/admin/eventi` | Redirect a login; nessun dato privato |
| SEC-02 | Utente normale autenticato | Accesso admin negato |
| SEC-03 | Super Admin AAL1 | Accesso negato fino ad MFA AAL2 |
| SEC-04 | Super Admin AAL2 attivo | Accesso alla coda consentito |
| SEC-05 | Super Admin revocato/sessione revocata | Accesso negato anche con cookie precedente |
| SEC-06 | POST senza Origin né Fetch Metadata | 403, nessuna mutazione |
| SEC-07 | POST Origin cross-site | 403, nessuna mutazione |
| EVT-01 | `pending,published=false` → Approva | `verified,published=false`, fuori dalla prima coda e nella seconda |
| EVT-02 | `verified,published=false` → Pubblica | `verified,published=true`, non compare in coda |
| EVT-03 | `pending,published=false` → Scarta | `rejected,published=false` |
| EVT-04 | Doppio invio/replay stessa azione | Nessuna seconda modifica; feedback `stale` |
| EVT-05 | Pubblica un pending / scarta un verified | Nessuna modifica |
| EVT-06 | 0, 1, molti record con descrizioni e titoli lunghi | Rendering leggibile, conteggi corretti |
| EVT-07 | Fonti WhatsApp, web, sconosciute | Canale e fonte distinguibili senza attribuire contenuti a MAI |
| EVT-08 | Dashboard prima e dopo Approva | Totale include pending + approved non ancora pubblicati |
| EVT-09 | Errori database/transazione | Feedback di errore, nessun falso successo |

Le prove che mutano lo stato richiedono **record fittizi in un ambiente sicuro e un'autorizzazione specifica**. Non utilizzare i quattro record Staging reali come fixture.

## Matrice visiva obbligatoria

| Larghezza | Stato |
|---|---|
| 360px | NON ESEGUITO |
| 390px | NON ESEGUITO |
| 430px | NON ESEGUITO |
| 768px | NON ESEGUITO |
| 1280px | NON ESEGUITO |
| 1440px | NON ESEGUITO |

A ogni larghezza verificare: nessuno scroll orizzontale, card evento e metadati leggibili, CTA cliccabili e distanziate, navigazione amministrativa coerente, due code chiaramente separate, focus tastiera visibile, assenza di sovrapposizione col layout amministrativo condiviso. Salvare screenshot reali per ciascuna larghezza.

## Gate per merge

Non effettuare merge su `integration/mfa-staging-reconciliation-20261112` o `staging` fino a: CI ultimo commit PASS, collaudo browser registrato, test MFA autorizzati positivi e negativi, revisione degli avvisi security pertinenti e approvazione esplicita. Nessun deploy Production o integrazione MAI in questa fase.
