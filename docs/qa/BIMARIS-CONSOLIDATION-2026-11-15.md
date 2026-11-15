# BIMARIS — Registro di consolidamento delle versioni

**Data:** 15 novembre 2026  
**Riferimento:** DS-CONSOLIDAMENTO-01  
**Stato:** IN CORSO — NO-GO MERGE / PRODUCTION  
**Branch di lavoro:** `integration/bimaris-consolidated-20261115`  
**Base immutata all'apertura:** PR #56, commit `4ba83134ce61e9329b3ff6d9f29728f6dbb5d40c`.

## Scopo e regole

Convergere su una sola versione candidata a Staging senza cancellare decisioni già approvate. Ogni differenza fra branch è classificata, implementata con verifica isolata oppure mantenuta in HOLD con motivazione. Non fare merge su `staging`/`main`, deployment Production, mutazioni Supabase, modifiche account o spese.

## Sorgenti del confronto (GitHub)

- `staging`: branch di riferimento esistente, non modificato.
- PR #36 `UX-B2B-01` — head `e56b7dcdc183bf2edcd2769ad568c9176cc2859c`, ancora aperta e in bozza.
- PR #47 — head `8635eef48020f51cca780b92010e70cffb0f81bd`: base MFA individuale.
- PR #55 — head `6c1c366d0f75e9b3a3593b3f83456141083694e9`: eventi senza riconciliazione MFA autonoma.
- PR #56 — head iniziale `4ba83134ce61e9329b3ff6d9f29728f6dbb5d40c`: MFA + eventi + code operatori + correzioni browser.

Confronto GitHub PR #36 vs PR #56: divergenza di **97 commit behind / 220 ahead** rispetto alla testa PR #36, non prova di equivalenza UX. La PR #56 è direttamente ahead di 28 commit e behind 0 dalla PR #47.

## Interventi di consolidamento eseguiti sul nuovo branch

1. Recuperato **OperatorWorkspaceSwitcher.tsx** e **workspace-switcher.css** dalla PR #36; la navigazione usa l'attività corrente e cancella parametri sensibili al cambio dell'attività (`experience`, `step`, `collaboration`, `invito`).
2. Connesso il selettore alle tre superfici: `/area-operatore`, `/area-operatore/calendario`, `/area-operatore/network-b2b`.
3. Rimossa la navigazione doppia dal layout condiviso dell'area operatore.
4. Selezione calendario: il parametro `operatore` accetta id o slug, senza ricadere silenziosamente su una seconda attività per richieste non riconosciute.
5. Aggiunta suite `operator-workspace-consolidation.test.mjs`, senza modifica dei controlli server-side delle membership.
6. Ereditate dalla PR #56 le correzioni: intestazione dashboard unica, revisione profilo esposta come attività autonoma, icona occhio per password, MFA/CSRF, due fasi di approvazione/pubblicazione eventi.

## Differenze PR #36 ancora da riconciliare (HOLD)

Questa fase non dimostra una piena equivalenza UX. Confrontare e decidere singolarmente i seguenti file, senza trascrizione massiva:
- `app/area-operatore/ExperienceManager.tsx` e `experience-manager.css`: disposizione creazione esperienza, visualizzazione liste, wizard.
- `app/area-operatore/OperatorProfileEditor.tsx`, `OperatorLogoutButton.tsx`, `CalendarImporter.tsx`: UX di editing/accesso/importazione.
- `app/area-operatore/network-b2b/B2BNetwork.tsx` e `operator-area.css`: layout, dati mostrati, azioni e permessi.
- `app/area-operatore/calendario/page.tsx`, `page.tsx`: raffinatezze di hero, gerarchia e responsività.
- `app/accedi/*`, `components/Header.tsx`, `app/profilo/*`, `home-journey-v2.css`: differenze possibili fuori dall'Area Operatore.
- `app/api/operator/profile-revisions/route.ts`: verificarne compatibilità RLS/authorization prima di recepire modifiche.
- In particolare, PR #36 possiede stili di navigazione e composizione mobile distinti; una build riuscita non equivale a collaudo visuale.

## Gate prima di un unico riferimento Staging

- [ ] Confronto file-per-file degli elementi approvati PR #36 e delle altre PR aperte rilevanti.
- [ ] Test automatici: lint, typecheck, auth, regressioni operatore/amministrazione, build.
- [ ] QA browser desktop 1280/1440, tablet 768, mobile 360/390/430.
- [ ] Login reale amministratore + MFA, risoluzione messaggio generico `Credenziali non valide` in Preview.
- [ ] QA di gestione operatore, profilo, esperienza ripetuta, collaborazione B2B, calendario e permessi per attività.
- [ ] QA code admin: revisioni profilo/esperienze, candidati, eventi acquisiti, separazione approvazione/pubblicazione.
- [ ] Verifica che nessuna integrazione con staging/main renda pubblici contenuti test o dati ancora da approvare.
- [ ] Approvazione esplicita della promozione a `staging` e solo successivamente eventuale `main`.

**Nota:** tutto il lavoro qui documentato è preparatorio e su branch isolato. Non dichiarare «versione unica consolidata» prima della chiusura dei gate.
