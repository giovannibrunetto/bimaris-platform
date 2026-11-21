# BIMARIS — DS-MFA-01/I
## Piano tecnico di migrazione legacy, enforcement MFA e completamento collaudi

**Data:** 7 novembre 2026  
**Committente:** Direzione Strategica BIMARIS  
**Funzione:** Direzione Tecnica 8  
**Stato:** PROGETTAZIONE DOCUMENTALE — nessuna implementazione autorizzata  
**Baseline:** `giovannibrunetto/bimaris-platform`, branch `feature/admin-individual-mfa`; audit DS-MFA-01/G e DS-MFA-01/H  
**Production:** **NO-GO**

### 1. Sintesi esecutiva e decisione

**Raccomandazione: alternativa B, policy centrale esplicita per risorsa/azione con enforcement individuale AAL2 e fallback di emergenza fuori dal percorso ordinario.** L'alternativa A, sostituzione progressiva dell'adapter legacy-first con switch di modalità per ambiente, è più semplice ma espone a errori di configurazione e non introduce autorizzazioni granulari. Nessun cutover va effettuato prima di una delibera esecutiva distinta.

Evidenza attuale: H-04–H-08 dimostrano rifiuto AAL1, accesso AAL2 con ruolo attivo e revoca ruolo/sessione su `POST /api/admin/operator-memberships`, mediante azione invalida. **Non dimostrano mutazioni valide né la protezione runtime degli altri nove endpoint.** L'adapter attuale in `apps/web/lib/admin-access.ts` controlla prima `isAdminAuthenticated()` (cookie legacy) e solo dopo `getVerifiedSuperAdmin()`. Di conseguenza MFA individuale **non obbligatoria**.

### 2. Baseline tecnica verificata

- `apps/web/lib/admin-access.ts`: `if (await isAdminAuthenticated()) return true; return (await getVerifiedSuperAdmin()) !== null;`.
- `apps/web/lib/admin-auth.ts`: cookie legacy `bimaris_admin_session` firmato HMAC-SHA256, scadenza massima 12 ore, `HttpOnly`, `SameSite=Strict`, `Secure` in `NODE_ENV=production`; credenziali condivise da environment; TOTP legacy condizionato alla presenza di segreto. Cookie non collegato a identità/sessione Supabase e non revocabile per utente.
- `apps/web/app/api/admin/login/route.ts`: login legacy con rate limit e controlli `Origin`/`Sec-Fetch-Site`; `apps/web/app/admin/login/page.tsx` effettua redirect a `/admin` se cookie legacy valido.
- `apps/web/lib/admin-mfa-guard.ts`: host Supabase individuale vincolato esplicitamente a Staging, verifica access token tramite `auth.getUser`, AAL2 e RPC privilegiata `is_active_super_admin_session`, che incrocia `auth.sessions` e `security.admin_members`. **Il vincolo host non è adatto a Production senza un progetto separato di configurazione e verifica**.
- `apps/web/lib/supabase/user-server.ts`: Supabase SSR cookie client; `apps/web/lib/supabase/server.ts`: service role lato server.
- `apps/web/app/api/admin/logout/route.ts`: pulisce cookie legacy e tenta `signOut({scope:'local'})` individuale; la cancellazione del refresh token non è sufficiente, da sola, per garantire invalidazione immediata di ogni JWT.
- `apps/web/app/admin/layout.tsx`: usa `isAuthorizedAdmin()` per menu e conteggi, ma ogni pagina e ogni API devono imporre il proprio guard.
- Inventario: 10 route operative, 16 pagine riservate, 2 route auth, 2 pagine auth/collaudo. Le 7 API operatore sono fuori dal dominio Super Admin e non vanno ricondotte indiscriminatamente all'AAL2 amministrativo.

### 3. Alternative architetturali

| Criterio | A — Switch ambientale e adapter duale esplicito | B — Policy centrale per risorsa e azione (raccomandata) |
|---|---|---|
| Principio | `legacy_only` / `dual_explicit` / `individual_required` per ambiente; in duale il legacy è riconosciuto solo dove esplicitamente consentito | `authorizeAdmin({resource,action,requiredAssurance})` restituisce un contesto attore; matrice deny-by-default e `individual_aal2` per ogni operazione privilegiata |
| Enforcement | Migrazione per endpoint mediante wrapper e flag | Migrazione per endpoint **e azione**, compresi loader SSR, API e RPC |
| Identità | In modalità legacy manca un attore nominativo | Identità Supabase obbligatoria nelle azioni migrate; `actor_user_id`, `session_id`, `assurance`, `request_id` |
| Fallback | Switch di modalità, rischio di riabilitazione troppo ampia | Percorso break-glass separato e circoscritto, mai fallback automatico nell'ordinario |
| Complessità relativa | Bassa–media | Media–alta |
| Rischio principale | Configurazione errata, bypass silenzioso se `dual` | Errori nella mappatura di risorse/azioni, maggiore superficie di refactor |
| Reversibilità | Alta, ma rollback di flag può riaprire bypass | Alta con release precedente e flag granulari approvati; non riaprire automaticamente il legacy |
| Impatto operativo | Minore nel breve, debito tecnico più alto | Più test iniziali, migliore tracciabilità e gestione futura dei privilegi |
| Adatta a cutover definitivo | Solo transitoria | Sì, dopo test completi |

**Alternativa A, design:** sostituire il booleano generico con `resolveAdminAuthMode(requestContext)` e `authorizeAdminForRoute(routeId)`, usando una allowlist versionata di route legacy. Qualsiasi route migrata rifiuta sempre il cookie legacy anche se presente; evitare `legacy || individual`. Flag mancanti, malformati o sconosciuti: fail-closed. L'uso di flag lato server è previsto ma non autorizzato oggi. Non affidarsi a un semplice flag globale per differenziare azioni ad alto rischio.

**Alternativa B, design raccomandato:** introdurre un servizio server-only `authorizeAdmin({resource, action, context})` che restituisce una discriminated union `{ok:true,actor:{userId,sessionId,aal,permissions},requestId}` oppure `{ok:false,reason}`. Per ogni operazione migrata: verificare token, identità, sessione persistente, AAL2, ruolo attivo, permesso per azione, eventuale contesto risorsa e vincoli di stato. Nessun `isAdminAuthenticated()` in un ramo `individual_required`. Il servizio non deve esporre chiavi segrete o dettagli interni al client. La policy è versionata e testabile; default deny per azioni non dichiarate.

**Scelta:** B, con introduzione incrementale dei componenti e rollout simile ad A ma senza mantenere `dual` come comportamento autorizzante delle operazioni migrate.

### 4. Matrice di enforcement proposta

| API | Azioni principali | Requisito proposto | Priorità |
|---|---|---|---|
| POST `/api/admin/operator-memberships` | link, update_role, revoke | AAL2 + permesso `memberships.manage`; controllo ultimo owner e tenant | P0 |
| POST `/api/admin/applications` | review, accept/reject, select, publish/unpublish | AAL2 + `applications.review` / `operators.publish` | P0 |
| POST `/api/admin/operators` | modifica, selezione, publish/unpublish | AAL2 + `operators.edit` / `operators.publish` | P0 |
| POST `/api/admin/events/[id]/status` | approve/reject | AAL2 + `events.moderate` | P0 |
| POST `/api/admin/experiences` | review, territory, publish, feature | AAL2 + permessi distinti `experiences.review/publish/feature` | P0 |
| POST `/api/admin/experiences/create` | create, media upload | AAL2 + `experiences.create` | P0 |
| POST `/api/admin/experience-revisions` | request-changes, approve-apply | AAL2 + `revisions.apply` | P0 |
| POST `/api/admin/operator-revisions` | approve/apply, reject | AAL2 + `revisions.apply` | P0 |
| POST `/api/admin/itineraries` | create, edit, publish, stops | AAL2 + `itineraries.manage/publish` | P0 |
| GET `/api/admin/experiences/[id]/collaboration` | dati riservati | AAL2 + `collaborations.read` | P0 |

**16 pagine riservate:** applicare `admin.read` con AAL2 per ogni pagina SSR, inclusi dettagli e revisioni, e mantenere controlli autonomi nelle API; la sola invisibilità del menu non è una protezione. La pagina `/admin/login` e quella tecnica `/admin/mfa-staging` restano escluse dal requisito di accesso già autenticato, ma il login tecnico non deve divenire un endpoint di produzione.

**API operatore:** mantenere autenticazione, membership e RLS indipendenti; un Super Admin non deve acquisire implicitamente un ruolo operatore. `calendar-import` e `b2b-matches` richiedono un audit tenant dedicato.

### 5. Identità, autorizzazioni minime e recupero

- Identità personali Supabase Auth; nessuna credenziale condivisa nell'ordinario; MFA TOTP individuale obbligatoria e policy di enrollment verificata prima dell'attivazione.
- Ruoli proposti, **non esistenti nella baseline**: `super_admin` (policy, recovery e accessi), `admin_operations` (operatori e candidature), `admin_editor` (contenuti e pubblicazione secondo delega), `admin_auditor` (sola lettura). Implementare privilegi per azione, non soltanto nomi di ruolo.
- Matrice concessioni `role -> permission` versionata; deny-by-default; principio del minimo privilegio; nessuna elevazione tramite `user_metadata`.
- Revoca immediata: disattivazione membership amministrativa + invalidazione sessioni server-side; verifica della RPC per ogni richiesta sensibile; cancellazione/rotazione refresh token secondo capacità Auth. Documentare latenza e limiti.
- Recovery MFA: verifica identità fuori banda con due approvatori distinti, revoca dei fattori compromessi, registrazione evento, re-enrollment, notifica e controllo post-recovery; evitare recupero mediante password condivisa.
- Almeno due identità di emergenza personali separate e custodite secondo policy; esercizio recovery in Staging. La disponibilità delle identità non autorizza oggi a crearle.

### 6. Break-glass e rollback

**Fallback raccomandato:** non riutilizzare il cookie legacy come bypass automatico. Predisporre un processo break-glass separato, disabilitato per impostazione predefinita, con richiesta motivata, doppia approvazione, durata limitata (proposta massimo 60 minuti, da deliberare), perimetro di azioni strettamente necessario, registrazione immutabile, alert e revisione post-evento. Se non è tecnicamente possibile attribuire un attore individuale verificato, limitare il recovery a un'operazione infrastrutturale autorizzata fuori dal normale gestionale; non creare una nuova sessione amministrativa anonima.

**Rollback:** checkpoint prima di ogni fase; test automatizzati e manuali su release precedente; snapshot delle configurazioni non segrete; promozione/rollback Vercel soltanto dopo autorizzazione. Il rollback non deve comportare la disattivazione indiscriminata dell'MFA né il ripristino silenzioso del cookie legacy su route migrate. In caso di lockout, bloccare rollout, usare recovery approvato e ripristinare release sicura con policy equivalente; ogni eccezione richiede delibera separata e scadenza. Testare rollback in Staging prima di Production.

### 7. Sicurezza applicativa: requisiti di implementazione

1. **CSRF:** policy uniforme per tutte le mutazioni: verifica `Origin` e `Sec-Fetch-Site` dove applicabile, gestione esplicita delle richieste senza header, `SameSite`, protezione CSRF token per form/sessioni cookie secondo modello adottato, test same-origin/cross-site e proxy; non affidarsi al solo `SameSite=Strict`. Verificare i flussi API JSON e form.
2. **Service role:** `createServiceClient()` esclusivamente server-side **dopo** autorizzazione per azione; whitelist campi, validazione ID UUID e stato risorsa, ownership, limiti upload e path storage; nessun secret nei log/browser.
3. **Input:** schema per azione con tipi, enum, limiti, lunghezze, stato atteso, idempotenza ove possibile; rifiuto esplicito di azioni sconosciute.
4. **Mutazioni:** leggere stato prima, applicare vincoli atomici/condizionali, controllare `count`/`returning` e stato dopo; differenziare `no-op`, conflitto e successo. Per esempio `events/[id]/status` oggi redirige a `approved` quando non c'è errore, anche senza verificare righe effettivamente aggiornate: progettare un riscontro esplicito.
5. **RPC:** riesaminare `accept_operator_application`, `reject_operator_application`, `admin_apply_experience_revision`, `admin_apply_operator_revision` e le altre RPC privilegiate; limitare `EXECUTE`, verificare `SECURITY DEFINER`, `search_path`, validazione attore e atomicità. Le RPC chiamate con service role non devono presumere che l'identità dell'attore sia disponibile in `auth.uid()`.
6. **Audit log:** evento strutturato con `request_id`, `actor_user_id`, `session_id` (identificatore non segreto), `aal`, `permission`, `resource_type/id`, `action`, `decision`, `outcome`, `before/after` redatti, `timestamp`, versione policy; no token, password, OTP, PII superflue. Definire retention, accesso ristretto, protezione da alterazione, correlazione e gestione errori di scrittura audit.
7. **Separazione dei privilegi:** ruoli operatori su `operator_memberships` distinti dai ruoli amministrativi; evitare autorizzazioni trasversali per mera coincidenza di `user_id`.

### 8. Modifiche future richieste (NON autorizzate ora)

**Codice:** nuovo modulo `apps/web/lib/admin-policy.ts` (proposto), evoluzione `admin-access.ts`, `admin-mfa-guard.ts`, `admin-auth.ts`, login/logout, layout e 16 pagine, tutte le 10 route amministrative, test di integrazione, logging e utility CSRF. I percorsi dei nuovi moduli sono indicativi.

**Schema dati:** valutare tabella privata `security.admin_role_permissions` o policy versionata in codice; `security.admin_audit_events` con RLS/privilegi restrittivi; eventuale `security.admin_break_glass_grants` con scadenza e doppia approvazione. La tabella `security.admin_members` esistente supporta oggi solo `super_admin`: introdurre altri ruoli richiede revisione del vincolo `admin_members_role_check` e del modello di provisioning. **Nessuna migrazione applicata.**

**RPC:** evoluzione o sostituzione di `is_active_super_admin_session` per permessi per azione; audit transazionale per mutazioni sensibili; revisione RPC business e autorizzazione service-role. Nessuna RPC modificata.

**Configurazione:** mapping sicuro Staging/Production del Supabase host (oggi hardcoded su Staging), feature flags fail-closed versionati, gestione segreti, telemetria, rate limit e alert. **Nessun segreto letto o modificato.**

### 9. Piano di collaudo runtime completo

**Preparazione:** fixture univoche `MFA-I-*` e dataset isolato Staging; snapshot pre-test; account fittizi con ruoli diversi; reset controllato; sessioni browser con cookie Vercel Preview e Supabase SSR; nessun dato reale. Test anonimo, utente senza ruolo, AAL1 con ruolo, AAL2 con ruolo/permesso, AAL2 senza permesso, ruolo revocato, sessione revocata, cookie legacy valido isolato e cookie assente. Test del legacy richiede ambiente autorizzato e credenziali non condivise in chat.

**Per ognuna delle 10 API:** (i) verificare status **originale**, header `Location`, corpo e log, non solo HTTP finale; (ii) richiesta invalida per guard; (iii) azione valida su fixture con stato **prima e dopo** via query; (iv) richiesta negata con stato invariato; (v) audit log correlato all'attore; (vi) ripetizione/idempotenza e error path; (vii) cleanup e riconciliazione zero residui. Per GET collaboration: verificare dati e non-divulgazione, non mutazioni. Per upload/revisioni: controllare bucket, righe e compensazioni.

**Per le 16 pagine:** accesso diretto SSR per ciascuna, anonimo/AAL1/AAL2/ruolo revocato/sessione revocata/legacy, verifica che non vengano renderizzati dati privilegiati, controllo cache, redirect e link; test desktop/mobile non sostituisce il test di sicurezza.

**Regressione:** test automatici unitari della policy, integrazione delle route e RPC, anti-CSRF, autorizzazione cross-tenant, revoca immediata, audit, rollback; prove manuali end-to-end. Matrice con evidenze `PASS/FAIL/BLOCKED/NOT EXECUTED`, timestamp, commit, ambiente, fixture, query prima/dopo e cleanup.

**Criterio finale:** 10/10 API operative con test positivi e negativi di guard e azioni valide; 16/16 pagine con test accesso; zero bypass legacy sulle operazioni migrate; revoca immediata; audit attribuibile; rollback Staging esercitato; nessun difetto critico o alto aperto. Solo allora proposta di Production GO, mai GO automatico.

### 10. Fasi indipendenti, prerequisiti e decisioni

| Fase | Obiettivo / componenti | Prerequisiti | Accettazione | Rischio e rollback | Stima | Delibera |
|---|---|---|---|---|---|---|
| I-0 (documentale, presente) | Baseline, alternative, matrice, backlog | G/H | Piano consegnato, nessun cambiamento esecutivo | Nessun rollback applicativo | 1–2 gg analisi | Acquisizione piano |
| I-1 (P0) | Policy centrale, `admin-access`, guard, flag fail-closed, test unitari | scelta B e autorizzazione codice | route migrate rifiutano legacy e AAL1; no bypass | regressione accesso; rollback release Staging con checkpoint | 3–5 gg | GO sviluppo Staging |
| I-2 (P0) | 10 API, 16 pagine, login/logout, permessi azione | I-1; matrice ruoli | 100% guard e azioni mappate, default deny | lockout; rollback per gruppo di route | 4–7 gg | GO integrazione Staging |
| I-3 (P0) | CSRF, input, RPC, service role, audit, schema eventuale | I-1/I-2; approvazione migrazioni | audit actor-based, zero mutazioni non autorizzate, schema testato | impatto dati/RPC; backup, migrazioni reversibili, restore provato | 4–7 gg | GO DB/config Staging |
| I-4 (P0) | Identità personali, MFA, recovery e break-glass | policy identità e doppia approvazione | enrollment/revoca/recovery testati; nessun fallback silenzioso | lockout; recovery out-of-band | 2–4 gg | GO provisioning Staging |
| I-5 (P0) | Runtime 10 API + 16 pagine, fixture, regressione, rollback | I-1–I-4 | matrice completa PASS, zero P0/P1 aperti | dati residui; cleanup verificato, rollback esercitato | 4–7 gg | GO collaudo e riesame |
| I-6 (P0 prima di prod) | Review separazione ambienti, release, segreti, piano cutover | I-5, security review | checklist Production, decisione esplicita | errori config; nessun deploy senza GO | 2–3 gg | Delibera Production separata |
| I-7 (P1 post-lancio) | Raffinamenti RBAC, analytics security, alert avanzati | sicurezza base già garantita | miglioramenti misurabili, no regressioni | rollback modulare | 2–4 gg | GO evolutivo eventuale |

**Stima complessiva indicativa: 22–39 giornate tecniche**, con sovrapposizioni possibili ma senza preventivo o spesa autorizzata. Le stime non includono incidenti, ritardi di terzi o audit indipendente esterno. I-1–I-6 sono prerequisiti di sicurezza per Production; I-7 può seguire solo se le funzionalità differite non sono necessarie all'enforcement, al recovery, all'audit minimo e alla revoca. Non differire anti-CSRF, audit essenziale, verifica service role o rollback.

### 11. Dipendenze e punti di decisione

1. Approvare **B** oppure scegliere consapevolmente **A** come transizione temporanea con scadenza.
2. Deliberare policy di ruoli e permessi, recupero MFA e break-glass; definire responsabili delle approvazioni.
3. Autorizzare **separatamente** codice Staging, eventuali migrazioni SQL/RPC, configurazioni, provisioning e test con fixture.
4. Dopo collaudo e review, decidere con atto distinto il cutover Production.
5. Conservare G/H/I come baseline e registro delle evidenze.

**Conclusione:** **GO alla sola valutazione del piano; NO-GO a qualsiasi implementazione automatica e a Production.** Il risultato H è positivo nel suo perimetro, ma non rimuove il bypass legacy né completa la certificazione.
