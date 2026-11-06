# DS-MFA-01/C — Registro esecuzione B1–B4 (6 novembre 2026)

Stato: implementazione tecnica parziale sul branch `feature/admin-individual-mfa`. Nessun deployment, nessun account personale, nessun cambiamento a Production.

## B1 — ESEGUITO E VERIFICATO SU STAGING
- Migration: `supabase/migrations/20261106_ds_mfa_01_b1_private_admin_roles.sql`
- Supabase target verificato: `nzdeoimwikhoidtladnu` (BIMARIS Staging), distinto da Production `vhvccwvcqdhiovpopsze`.
- Creazione `security.admin_members`, RLS abilitata, nessuna membership inserita.
- RPC `public.is_active_super_admin(uuid)`: solo `service_role` EXECUTE; `anon` e `authenticated` negati.
- Verifica SQL post-migrazione: tabella presente, 0 admin, ruoli pubblici senza USAGE sullo schema e senza EXECUTE sulla RPC.
- Rollback SQL presente in testa alla migration; eseguibile solo previa verifica delle dipendenze e senza account/membership.
- Nota: la funzione invoker deve essere verificata anche mediante chiamata RPC effettiva con chiave di servizio in un ambiente di test, non soltanto tramite metadati SQL.

## B2 — IN CORSO
- `apps/web/lib/admin-mfa-guard.ts` usa RPC con client service-role e verifica `auth.getUser()`, AAL2, ruolo attivo.
- Mancano verifica sessione revocata (JWT ancora valido), prove runtime, integrazione completa e audit log.
- Non considerare il guard operativo.

## B3 — NON ESEGUITO
- 12 API admin e 17 pagine admin censite, ancora protette dal legacy.
- Implementare un adapter transitorio documentato e poi rimuovere il legacy solo su successivo mandato B8.
- Conservare distinzione approvazione/pubblicazione.

## B4 — PARZIALE, NON ATTIVATO
- `apps/web/lib/api-rate-limit.ts` legge prima `BIMARIS_RATE_LIMIT_HMAC_SECRET`, poi temporaneamente `BIMARIS_ADMIN_PASSWORD`.
- La variabile dedicata non è stata configurata, né generata; fallback legacy ancora presente.
- Prima dell'attivazione: verificare scope Preview/staging, rotazione e impatto sulla finestra rate-limit, test contatti/candidature/login, fail-closed senza segreto e senza DB.
- Rimuovere fallback solo dopo prova effettiva con chiave dedicata. Non disattivare password admin senza mandato B8.

## Criteri di arresto
- Nessuna modifica a produzione.
- Nessun deployment senza verifica target e rollback.
- Nessun account personale o MFA TOTP.
- Nessuna dichiarazione PASS per test non eseguiti.
- Se il runtime non riesce a consultare il ruolo in schema privato, fermarsi e correggere prima di integrare le superfici.

## Prossimi passi autorizzati
1. Validare l'accesso RPC a Staging tramite test controllato senza account personali.
2. Progettare revoca sessioni server-side verificabile.
3. Integrare B2/B3 senza interrompere l'accesso legacy in attesa di B8.
4. Configurare segreto rate-limit solo in Preview/Staging, poi testare e rimuovere il fallback.
5. Consegnare rapporto intermedio con commit e prove reali.


## Aggiornamento tecnico — controllo build e copertura
- 10 API amministrative operative aggiornate al gate transitorio; login/logout legacy rimangono separati.
- 16 pagine amministrative e il layout aggiornati; corretto import nella pagina `admin/esperienze/nuova`.
- Vercel Preview build del commit `bba4eb6`: **ERROR**, TypeScript `TS2304 Cannot find name 'isAuthorizedAdmin'` in `app/api/admin/experiences/create/route.ts:13`.
- Correzione commit `40a0c13` nella route interessata. **Nessun PASS build successivo ancora disponibile**.
- L'integrazione dual-path mantiene intenzionalmente il legacy; MFA non è ancora obbligatoria e B8 resta non autorizzato.
- Il deployment Preview automatico del branch feature non equivale a deployment Staging approvato.
- Vercel non riporta env branch-specific per `feature/admin-individual-mfa` nel filtro verificato; la configurazione `BIMARIS_RATE_LIMIT_HMAC_SECRET` non è stata attestata.
- SQL Staging `is_active_super_admin` su UUID inesistente: `false`; non equivale a prova HTTP RPC con service client.
- Non dichiarare B2/B3/B4 completati fino a test runtime, revoca sessioni, audit e rate-limit.


## Gate di separazione ambienti — BLOCCO OPERATIVO
- Verifica Vercel `filter_project_envs(decrypt=false)`: `SUPABASE_SECRET_KEY` Preview limitata a branch `staging`; un'altra `SUPABASE_SECRET_KEY` solo Production.
- `NEXT_PUBLIC_SUPABASE_URL` e `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` genericamente Preview: il metadata non prova che corrispondano al progetto Staging.
- `BIMARIS_RATE_LIMIT_HMAC_SECRET` assente.
- Nessun custom environment Vercel configurato (verifica `list_project_custom_environments`).
- Preview feature commit `fe0a141` READY, ma build riuscita non implica connessione a Staging.
- Decisione: **NO-GO per test runtime e mutazioni su Preview feature** fino a mapping verificato di URL, publishable key e service secret verso `nzdeoimwikhoidtladnu`. Non copiare mai il segreto Production e non cambiare valori Preview generici senza analisi dell'impatto.
- Soluzione ammessa: variabili Preview branch-specific per `feature/admin-individual-mfa`, verificate tramite identificativo progetto e controllo applicativo non sensibile. Richiede materiale credenziale Staging recuperato da canale sicuro, non da documenti o log.
- Nessun valore segreto letto, scritto o pubblicato in questa verifica.


## Preview aggiornata — test anonimi di sola lettura
- Configurate per il solo branch feature le variabili Preview `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`, `SUPABASE_SECRET_KEY` (sensitive) e `BIMARIS_RATE_LIMIT_HMAC_SECRET` (sensitive). Nessuna credenziale inserita nel repository.
- Deployment forzato da commit `c0961f5`: `dpl_HfEH4cz8Md1kL3BGJK9BsBCBBA6X`, stato READY, Preview (non Production).
- Richieste GET anonime a `/admin`, `/admin/analytics`, `/admin/operatori`, `/admin/candidature`, `/admin/esperienze`: risposta Next.js contenente `NEXT_REDIRECT;replace;/admin/login`. Per le ultime quattro il fetch HTTP ha restituito 200 con redirect nel payload RSC: **PASS limitato** alla presenza del redirect server-side, non verifica browser.
- GET anonimo a `/api/admin/operators`: HTTP 405, metodo non ammesso; **NON** costituisce test di autorizzazione POST.
- Codice esaminato: le route POST `/api/admin/applications`, `/api/admin/experiences`, `/api/admin/experience-revisions` controllano `isAuthorizedAdmin()` prima delle operazioni privilegiate. Verifica statica, non runtime.
- **Non verificato:** validità effettiva della secret key Staging dal runtime Vercel, revoca immediata, AAL2 e ruolo attivo, comportamento POST non autenticato, rate limiting end-to-end, regressioni editoriali.
- Nessuna POST amministrativa eseguita, nessuna modifica ai dati, nessun account B5 creato. Production NO-GO.


## Estensione test anonimi — 11 pagine
- GET anonime sulla Preview `dpl_HfEH4cz8Md1kL3BGJK9BsBCBBA6X` alle ulteriori route `/admin/itinerari`, `/admin/eventi`, `/admin/revisioni-esperienze`, `/admin/operatori/accessi`, `/admin/esperienze/nuova`, `/admin/revisione-esperienza`: tutte presentano `NEXT_REDIRECT;replace;/admin/login` nel payload Next.js.
- Totale pagine verificate con redirect anonimo: **11**. Test di sola lettura, nessuna mutazione.
- Decisione sul diagnostico service-role: **non introdurre endpoint pubblico di verifica** che possa esporre informazioni di configurazione o accesso privilegiato. Serve una verifica autenticata server-side su ambiente isolato, con osservabilità sicura e rimozione del codice diagnostico; non simulare un PASS sulla sola presenza della variabile.
- Build documentale `ac3fbc2` READY; l'esito build non equivale a test della chiave server.


## Riconferma SQL autorizzazioni Staging
- Query di sola lettura sul progetto Supabase **nzdeoimwikhoidtladnu**: `security.admin_members` 0 righe; USAGE schema `security` negato a `anon` e `authenticated`; EXECUTE `public.is_active_super_admin(uuid)` negato a entrambi; EXECUTE consentito a `service_role`; UUID inesistente restituisce `false`.
- **PASS** per isolamento SQL e caso negativo; **NON TESTATO** l'uso effettivo della chiave server Vercel né la sessione AAL2, perché mancano identità amministrative autorizzate e non è stato introdotto un endpoint diagnostico pubblico.
- Analisi statica: `apps/web/app/api/admin/login/route.ts` invoca il rate limit prima di controllare la password e nega in caso `unavailable` (HTTP 503). Il segreto HMAC indipendente è configurato ma la RPC non è ancora stata testata dal runtime Vercel.
- Mantenere il fallback password legacy in `api-rate-limit.ts` fino a test funzionale e autorizzazione al taglio; nessun bypass della modalità prelaunch.


## Audit API e rate-limit RPC
- Audit statico di sette ulteriori API amministrative: `operator-memberships`, `itineraries`, `experiences/create`, `events/[id]/status`, `experiences/[id]/collaboration`, `operators`, `operator-revisions`. In ciascuna il controllo `isAuthorizedAdmin()` precede `createServiceClient()`; test runtime non equivalente.
- Tentativo GET anonimo su `/api/admin/experiences/00000000-0000-0000-0000-000000000000/collaboration` bloccato dalla protezione Preview Vercel con `deployment_authentication_required` dopo redirect. **NON TESTATO** l'esito applicativo; non disattivare protezione per aggirare il blocco.
- Ispezione SQL Staging della funzione `public.consume_api_rate_limit(text,text,integer,integer)`: `SECURITY INVOKER`; EXECUTE `anon=false`, `authenticated=false`, `service_role=true`. Controlla scope, hash di 64 caratteri, limiti 1..100, finestra 60..86400 s; aggiorna `public.api_rate_limits`. **PASS statico/privilegi**, non prova end-to-end.
- Nessuna chiamata mutante al rate limiter, nessun dato o account creato. Production NO-GO.


## Test funzionale SQL rate limit e gap logout
- Test Staging eseguito in transazione con `ROLLBACK` e hash fittizio dedicato, scope `contact`, limite `1` su finestra `60` secondi: prima chiamata `true`, seconda `false`. **PASS comportamento SQL**. La transazione è stata annullata, senza persistenza dei contatori di test. Non è un test end-to-end Vercel.
- Audit `apps/web/app/api/admin/logout/route.ts`: il POST invoca esclusivamente `clearAdminSession()` per il cookie legacy. **GAP B2**: manca la chiusura esplicita della sessione Supabase per il futuro percorso MFA individuale. Non dichiarare logout/revoca MFA PASS.
- Audit `apps/web/lib/admin-auth.ts`: il cookie legacy firmato rimane valido fino alla scadenza (12 ore) salvo rotazione del segreto; non offre revoca per singola sessione. Il percorso legacy resta autorizzato nella transizione, ma impedisce di definire la MFA obbligatoria.
- Nessuna modifica al logout eseguita in questa fase; necessaria progettazione e collaudo compatibili con B5/B8 non autorizzati.


## PASS verificato: credenziale server Preview → Supabase Staging
- Commit `15d8f3a`, deployment Vercel Preview `dpl_9c8AXaTYYbuhKqCh4fx6WFQY5a2e`, stato **READY**.
- Build log verificato: `DS-MFA staging smoke: PASS (service RPC reachable; unknown user denied)`.
- Test prebuild `apps/web/scripts/mfa-staging-smoke.mjs` eseguito solo se `VERCEL_ENV=preview` e `VERCEL_GIT_COMMIT_REF=feature/admin-individual-mfa`. Verifica hostname Staging `nzdeoimwikhoidtladnu.supabase.co`, usa `SUPABASE_SECRET_KEY` server-side per chiamare `public.is_active_super_admin` con UUID inesistente, richiede HTTP OK e risposta JSON `false`.
- **PASS** credenziale server/RPC Staging **nell'ambiente di build Vercel**. Non ancora provata la stessa chiamata durante l'esecuzione di una funzione server runtime né il percorso MFA AAL2 con account reale.
- Non sono stati esposti valori di chiavi, creati utenti, modificati record o toccata Production. B2–B4 non ancora chiusi.


## Implementazione transitoria logout individuale
- `apps/web/app/api/admin/logout/route.ts` modificato su branch MFA, commit correttivo `3416595`. Il POST cancella il cookie legacy; se è presente una sessione Supabase Auth nel client server, chiama `auth.signOut({scope:"local"})`. Se non c'è sessione individuale, preserva il flusso legacy.
- Errori nel controllo/session logout individuale sono restituiti come HTTP 503 senza affermare che la sessione sia stata invalidata. Nessun token o segreto viene registrato.
- **LIMITAZIONE**: signOut locale non garantisce revoca immediata degli access JWT già emessi; servono controlli server-side di sessione/revoca e test autorizzati. Non classificare B2 come concluso.
- Build automatica Preview del commit `3416595` rilevata inizialmente in stato INITIALIZING; verifica finale ancora necessaria.


## Analisi revoca immediata — decisione tecnica preliminare
- Ispezione **read-only** di `auth.sessions` in Supabase Staging: colonne `id`, `user_id`, `aal`, `not_after`, `factor_id` disponibili. Non sono stati letti o divulgati ID/token delle sessioni.
- `has_table_privilege('service_role','auth.sessions','SELECT') = false`; anche `authenticated` e `anon` non hanno SELECT. **Non** tentare accesso diretto dalla API service-role né concedere SELECT sulla tabella Auth.
- Proposta per B2: RPC ristretta, `SECURITY DEFINER`, proprietario privilegiato, con `search_path=''`, `EXECUTE` solo `service_role`, per controllare esistenza sessione `auth.sessions` associata all'utente, `aal='aal2'`, `not_after` valido e `security.admin_members.active=true`. Il server deve derivare `session_id` da JWT verificato, mai da input client arbitrario. Verificare semantica di revoca Supabase e testare in staging prima di applicare.
- **Nessuna migration o modifica al guard effettuata in questa fase**: servono verifica documentale del ciclo di vita delle sessioni e test negativi prima di dichiarare revoca immediata PASS. Legacy cookie continua a bypassare il percorso MFA fino a B8 autorizzato.
