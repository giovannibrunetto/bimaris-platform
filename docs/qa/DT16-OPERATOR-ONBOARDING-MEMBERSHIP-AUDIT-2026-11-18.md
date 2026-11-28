# BIMARIS — DT16 | Audit onboarding operatore e assegnazione delle membership
Data: 18 novembre 2026
Stato: REVIEW ONLY, nessun DDL/DML, invito email, merge, deployment o modifica dei permessi.

## Codice analizzato nella PR #58
- `apps/web/app/api/admin/applications/route.ts`: POST richiede `rejectCrossSiteAdminMutation` e `isAuthorizedAdmin()` prima dell'uso del client privilegiato. Approva una candidatura tramite RPC `accept_operator_application`; in seguito legge l'email della candidatura accettata, cerca l'utente in Supabase Auth, lo invita oppure tenta OTP e aggiunge la membership `owner` in `public.operator_memberships` tramite `service_role`. La membership non è concessa al richiedente dal client web.
- `apps/web/lib/admin-mfa-guard.ts`: `getVerifiedSuperAdmin()` richiede sessione Auth verificata, MFA AAL2 e controllo server di membership Super Admin; guard limitato intenzionalmente a Staging.
- `apps/web/lib/supabase/server.ts`: `createServiceClient()` utilizza segreto server-side.
- `apps/web/app/api/admin/operators/route.ts`: modifica solo campi editoriali del profilo operatore, non le appartenenze Auth.

## Riscontri Supabase Staging in sola lettura
1. `public.operator_memberships` ha RLS attiva, policy SELECT `user_id=auth.uid()` per `authenticated`, **nessuna policy INSERT/UPDATE/DELETE** rilevata. I privilegi SQL generici per `authenticated` includono INSERT/UPDATE, ma la RLS, in assenza di policy di scrittura, nega l'operazione; non interpretare i grant da soli come accesso effettivo.
2. `public.operators` ha RLS attiva e policy SELECT per operatori collegati all'utente; contiene anche la prevista policy di visibilità pubblica limitata a operatori `published=true` e `selection_status='selected'`. Nessuna policy INSERT/UPDATE utente presente nel controllo.
3. `public.operator_applications` ha RLS attiva, senza policy rilevate, pur avendo alcuni grant; gli accessi applicativi privilegiati devono essere verificati separatamente.
4. `public.business_accounts` e `public.business_account_memberships`: RLS attiva, grant diretti a `authenticated` assenti, policy assenti. Le tabelle risultano vuote (0 e 0).
5. Conteggi Staging senza identificativi: `operators`=4; `operator_memberships`=4; `operator_applications`=3.
6. Funzione privilegiata `accept_operator_application`: genera un luogo e un operatore, aggiorna lo stato della candidatura. La funzione **non** crea nella propria definizione un record `business_accounts` o `business_account_memberships`.
7. `link_operator_to_business_account`: eseguibile dal solo `service_role`, controlla la medesima ownership tra account e operatore, quindi collega se non già assegnato. Non sono stati individuati trigger automatici di creazione account nelle quattro tabelle ispezionate; l'assenza di trigger non dimostra l'assenza di ogni possibile percorso applicativo.
8. `protect_last_operator_owner`: trigger `BEFORE DELETE OR UPDATE` sulle membership operatore; impedisce la rimozione dell'ultimo owner, quando scatta il caso previsto.
9. La funzione `my_business_accounts()`, disponibile a `authenticated`, filtra per `auth.uid()`; non modifica membership.

## Problemi aperti e rischi
**P1 — Raccordo tra operatori e business account:** il processo amministrativo di accettazione/invito letto non crea il profilo aziendale, mentre lo schema prevede una funzione separata per il collegamento. Definire esplicitamente quando viene costituito un account per partita IVA, chi ne verifica la titolarità e come vengono aggregate più attività nello stesso profilo.
**P1 — Test multi-tenant:** i controlli statici RLS sono favorevoli, ma richiedono test con identità A/B sintetiche e membership diverse per dimostrare assenza di accesso incrociato.
**P1 — Retry inviti/OTP:** il codice aggiunge la membership prima dell'invio OTP per utenti esistenti; se l'OTP fallisce l'associazione esiste. Verificare che il ripristino/reinvio rimanga riservato al Super Admin, che gli errori non producano escalation e che l'invito non venga inviato a indirizzi non verificati dal processo.
**P1 — Stato amministrativo:** nell'handler di approvazione, la RPC crea l'operatore prima dell'accesso email; il fallimento del messaggio viene gestito come errore di invio e non annulla l'approvazione. È necessario un flusso di recupero deterministico e verificabile.
**P2 — SQL link:** `link_operator_to_business_account` verifica `auth.role()='service_role'`; funzione di auth deprecata secondo la documentazione Supabase, da aggiornare solo dopo test di compatibilità.
**P2 — Protezione owner:** accertare con test sintetici casi owner multipli e modifica concorrente.

## Test da predisporre
- Accettazione candidatura e invito con solo Super Admin AAL2; richieste senza sessione o cross-origin negate.
- Utente A visualizza solo il proprio operatore, utente B solo il proprio.
- POST diretti con sessione `authenticated` per INSERT/UPDATE di `operator_memberships`: bloccati per RLS.
- Invito fallito e rinvio: nessuna perdita o duplicazione incontrollata dei collegamenti.
- Più attività della stessa partita IVA: un account aziendale e membership coerenti dopo verifica titolarità, secondo decisione commerciale.
- RPC `link_operator_to_business_account` rifiuta ownership incrociata e operatori già assegnati.

## Decisione tecnica
**PASS limitato alla revisione statica di accesso e RLS; HOLD su onboarding multi-account end-to-end**. Richiesto disegno esplicito del raccordo tra candidatura, operatore e account aziendale, prima di attivare il relativo percorso commerciale.
Non sono autorizzati interventi in Production, merge, invii reali o modifiche SSO. Il sito principale BIMARIS rimane protetto.
