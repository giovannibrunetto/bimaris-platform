# BIMARIS — DS-MFA-01/G — Matrice di copertura amministrativa e piano di migrazione legacy

**Data:** 7 novembre 2026  
**Mandante:** Direzione Strategica BIMARIS  
**Stato:** audit documentale read-only; nessuna modifica applicativa  
**Baseline esaminata:** repository `giovannibrunetto/bimaris-platform`, branch `feature/admin-individual-mfa`, commit di partenza `2b772f0ef548c3754124c159fc53a61b6e5f268a`.  
**Production:** NO-GO.

## 1. Esito esecutivo

**Copertura dell'accesso individuale obbligatorio: INCOMPLETA.** Tutte le pagine amministrative riservate e le API amministrative operative esaminate usano `isAuthorizedAdmin()`, che ammette **prima** il cookie legacy `bimaris_admin_session` e, soltanto in alternativa, il controllo individuale `getVerifiedSuperAdmin()`. Un accesso legacy valido evita quindi i controlli individuali AAL2, ruolo e sessione Auth. È una scelta transitoria esplicita, non una nuova regressione introdotta dall'audit. Il superamento D-07 certifica un solo percorso API e il solo ramo individuale, **non** la copertura obbligatoria dell'intero amministrativo.

**Guard individuale documentato:** hostname Supabase Staging vincolato a `nzdeoimwikhoidtladnu.supabase.co`; `auth.getUser(accessToken)`; confronto identità/sessione; livello AAL2; RPC service-only `is_active_super_admin_session(user_id,session_id)` che controlla `auth.sessions`, AAL2 e `security.admin_members` attivo e non revocato. La migrazione SQL revoca l'esecuzione RPC a `anon`/`authenticated` e la concede a `service_role`. Questi sono controlli **da codice**, non collaudi universali.

## 2. Legenda della matrice

- **PC — PROTETTO E COLLAUDATO:** prova runtime eseguita per lo specifico comportamento e percorso.
- **PN — PROTETTO DA CODICE, NON COLLAUDATO:** guard individuato, ma nessuna prova runtime specifica.
- **PI — PROTEZIONE INCOMPLETA:** per il requisito di MFA individuale obbligatoria, il legacy resta un'alternativa autorizzante, oppure controllo assente.
- **NA — NON APPLICABILE:** login/logout, pagina di collaudo, endpoint pubblico o operatore con distinta identità e autorizzazione.

**Regola di lettura:** le colonne *guard corrente* e *copertura individuale obbligatoria* sono separate. Un percorso può avere guard PN/PC e contemporaneamente essere PI per il requisito futuro, senza implicare che sia anonimamente accessibile.

## 3. Inventario completo delle pagine /admin

| Pagina (suffisso di `/admin`) | Funzione | Guard corrente | MFA individuale obbligatoria |
|---|---|---|---|
| `/` | dashboard, aggregazioni | PN, `isAuthorizedAdmin` | PI, legacy |
| `/analytics` | indicatori amministrativi | PN, stesso guard | PI |
| `/candidature` | elenco candidature | PN | PI |
| `/candidature/[id]` | dettaglio candidatura | PN | PI |
| `/esperienze` | redirect interno | PN | PI |
| `/esperienze/[id]` | dettaglio esperienza | PN | PI |
| `/esperienze/[id]/revisione` | revisione editoriale | PN | PI |
| `/esperienze/nuova` | form nuova esperienza | PN | PI |
| `/eventi` | moderazione eventi | PN | PI |
| `/itinerari` | itinerari | PN | PI |
| `/operatori` | elenco operatori | PN | PI |
| `/operatori/[id]` | scheda operatore | PN | PI |
| `/operatori/[id]/revisioni-profilo` | revisioni profilo | PN | PI |
| `/operatori/accessi` | membership e accessi | PN | PI |
| `/revisione-esperienza` | redirect a revisione | PN | PI |
| `/revisioni-esperienze` | coda revisioni | PN | PI |
| `/login` | accesso legacy | NA, pagina di login | NA; dipendenza legacy |
| `/mfa-staging` | login MFA sperimentale | NA, collaudo autorizzato | NA; non è area amministrativa privilegiata |

Le 16 pagine riservate chiamano il guard nel proprio componente server; il layout `/admin/layout.tsx` usa anch'esso il guard per mostrare navigazione e contatori, **ma non sostituisce** i controlli delle pagine e delle API. Nessuna delle 16 pagine è stata singolarmente collaudata in runtime nel mandato G.

## 4. Inventario completo API /api/admin

| Metodo e percorso | Operazione / privilegi | Guard corrente | MFA individuale obbligatoria |
|---|---|---|---|
| POST `/applications` | candidature: review, reject/accept, pubblicazione, invio accessi; RPC privilegiate | PN | PI |
| POST `/events/[id]/status` | approvazione/rifiuto eventi | PN | PI |
| POST `/experience-revisions` | richiesta modifiche, applicazione revisione; RPC e storage | PN | PI |
| GET `/experiences/[id]/collaboration` | lettura collaborazione con service client | PN | PI |
| POST `/experiences/create` | creazione esperienza, membership, media/storage | PN | PI |
| POST `/experiences` | approvazione, pubblicazione, territorio, evidenza | PN | PI |
| POST `/itineraries` | creazione/modifica, copertina, tappe, pubblicazione | PN | PI |
| POST `/operator-memberships` | collega, cambia ruolo, revoca accessi operatore | PN | PI |
| POST `/operator-revisions` | approva/applica o rifiuta revisione; RPC | PN | PI |
| POST `/operators` | modifica, editoriale, pubblica/nasconde operatore | **PC solo** per POST con azione invalida nel ramo individuale (D-07); altre azioni PN | PI |
| POST `/login` | crea sessione legacy dopo password e TOTP legacy opzionale | NA, autenticazione legacy | NA; dipendenza |
| POST `/logout` | pulizia cookie legacy e signOut individuale local | NA, endpoint di logout | NA |

**Totale:** 12 route handler `/api/admin`: 10 operativi protetti da adapter, 2 di autenticazione. D-07 ha collaudato il solo guard della route `/operators` mediante azione deliberatamente invalida; non prova gli effetti delle azioni valide.

## 5. Confini con operatori e servizi interni

Le route `/api/operator/*` non costituiscono automaticamente operazioni Super Admin. Applicano identità Supabase utente, membership e/o RLS di operatore, non AAL2 amministrativo. Sono **NA** rispetto alla copertura Super Admin, ma richiedono audit separato di autorizzazione tenant e ownership:

| Route | Metodi | Meccanismo documentato | Classificazione |
|---|---|---|---|
| `/api/operator/b2b-matches` | GET | claims + membership; service client per candidati | NA; test tenant separato |
| `/api/operator/b2b-profile` | GET/POST | client utente Supabase/RLS | NA; test RLS separato |
| `/api/operator/calendar-import` | POST | claims + membership owner/manager; service client per scritture | NA; test ownership prioritario |
| `/api/operator/collaborations/invite` | POST/DELETE | client utente e regole membership | NA |
| `/api/operator/collaborations` | POST | client utente + RPC `respond_to_experience_collaboration` | NA |
| `/api/operator/profile-revisions` | POST | client utente/RLS | NA |
| `/api/operator/territory-classify` | POST | claims + membership owner/manager | NA |

Sono altresì fuori dal perimetro Super Admin gli endpoint pubblici `/api/analytics/track`, `/api/contact`, `/api/operator-applications`, `/api/operator-interest`, gli handler `/auth/callback` e `/auth/confirm`, e le operazioni di profilo/onboarding/raccolta. Non vanno protetti con AAL2 amministrativo indiscriminatamente: necessitano controlli propri (antiabuso, RLS, autorizzazioni operatore).

**Service role e RPC:** `createServiceClient()` usa `SUPABASE_SECRET_KEY` o `SUPABASE_SERVICE_ROLE_KEY` lato server; le 10 API amministrative operative lo usano per operazioni privilegiate, comprese RPC `accept_operator_application`, `reject_operator_application`, `admin_apply_experience_revision`, `admin_apply_operator_revision`, e scritture dirette su tabelle/storage. L'uso server-side è legittimo **soltanto dopo** un controllo d'accesso robusto. I servizi operatori `b2b-matches` e `calendar-import` usano service role dopo controlli di membership: non sono accessi amministrativi umani, ma hanno impatto privilegiato e richiedono test dedicati. Non è stata eseguita una scansione dinamica di tutte le chiamate RPC o delle policy RLS effettivamente applicate.

## 6. Lacune e rischi

**G-01 — ALTA, dipendenza legacy:** `isAuthorizedAdmin()` accetta il cookie legacy prima di verificare Supabase MFA. Il login legacy emette `bimaris_admin_session` con password condivisa e TOTP legacy opzionale; non associa l'operazione a una identità individuale Supabase, né a `auth.sessions`. Non classificare il legacy come MFA individuale, anche se il TOTP condiviso fosse abilitato. È un rischio di governance e tracciabilità e impedisce enforcement AAL2 individuale.

**G-02 — ALTA, ampiezza privilegi:** il ruolo individuale riconosciuto dal guard è soltanto `super_admin`, condiviso da tutte le operazioni. Nessuna granularità per approvazioni, pubblicazioni, gestione membership e contenuti. Proporre futura matrice permessi/segregazione; non implementare nel mandato G.

**G-03 — MEDIA/ALTA, copertura runtime limitata:** un solo endpoint amministrativo ha evidenza D-07. Gli altri nove handler operativi e tutte le pagine richiedono test mirati anonimo, AAL1, AAL2 senza ruolo, AAL2 con ruolo, revoca ruolo, revoca sessione, legacy. Priorità massima a membership, candidature, pubblicazione, RPC e storage.

**G-04 — MEDIA, privilegi service role:** l'applicazione esegue operazioni dirette con chiave di servizio dopo guard; occorre verificare per ciascun ramo di azione validazione input, ownership, anti-CSRF e audit trail. Il guard non sostituisce controlli di business né tracciamento attore.

**G-05 — MEDIA, separazione ambienti:** il guard individuale vincola esplicitamente il Supabase host di Staging, mentre il legacy è gestito separatamente; verificare nella futura implementazione la matrice di configurazione e l'assenza di percorsi alternativi su Preview/Production. Nessun accesso Production eseguito.

**G-06 — MEDIA, logout e revoca:** la revoca D-07 è provata per la sessione originale, non per tutti gli endpoint né per la sessione legacy. Il logout individuale non invalida automaticamente un cookie legacy eventualmente presente su un altro client.

## 7. Piano di test proposto, NON autorizzato

**T1 (P0):** matrice runtime per ciascuna delle 10 API operative: anonimo; AAL1; AAL2 senza ruolo; AAL2 con ruolo; ruolo revocato; sessione revocata con JWT non scaduto; legacy isolato. Utilizzare azioni senza effetto o fixture reversibili e dati fittizi, evitando mutazioni reali.  
**T2 (P0):** verifica operazioni ad alto impatto: membership, candidature, pubblicazione, applicazione revisioni e RPC, upload/storage.  
**T3 (P1):** pagine e letture privilegiate: accesso diretto, SSR, dati restituiti e comportamento post-revoca.  
**T4 (P1):** controlli anti-CSRF, origine, rate limit, session fixation, scadenza e cookie legacy; test tenant su `calendar-import` e `b2b-matches`.  
**T5 (P1):** audit logging per identità individuale e rollback esercitato.

Nessun test T1–T5 è stato eseguito nell'ambito G.

## 8. Migrazione progressiva e reversibile proposta

**M0 — baseline e decisione:** congelare inventario, endpoint, metriche di utilizzo legacy, procedure di emergenza e backup configurazione; approvare criteri di accesso e proprietari delle autorizzazioni.

**M1 — copertura e test:** ottenere autorizzazione distinta per eventuali correzioni, verificare tutti i percorsi privilegiati, rendere osservabili i due rami del guard senza registrare segreti, introdurre test automatici di regressione.

**M2 — account personali (solo dopo delibera):** provisioning nominativo, MFA TOTP individuale, ruoli a minimo privilegio, processo di recupero e revoca; separare responsabilità e predisporre almeno due amministratori di emergenza secondo policy approvata.

**M3 — pilot limitato:** consentire l'accesso individuale a un gruppo autorizzato su Preview/Staging, misurando login, fallimenti, operazioni e revoche. Legacy ancora disponibile soltanto come fallback formalmente controllato.

**M4 — enforcement graduale:** dopo evidenze positive e delibera, rendere AAL2+ruolo+sessione obbligatori per endpoint e pagine ad alto impatto, poi estendere agli altri; evitare l'alternativa silenziosa legacy per operazioni già migrate.

**M5 — dismissione legacy:** solo dopo collaudo completo, approvazione esplicita e piano di recupero, rimuovere l'autorizzazione legacy dal percorso ordinario, ruotare credenziali condivise e verificare i log.

## 9. Rollback proposto

- Ogni fase deve avere un checkpoint approvato, snapshot delle configurazioni non segrete e procedura di ripristino documentata.
- In caso di regressione di accesso: bloccare il rollout, verificare stato Supabase/Auth e Vercel, riportare il traffico alla versione Preview/Release precedentemente approvata secondo governance.
- Eventuale riabilitazione temporanea legacy richiede **delibera esplicita**, limite temporale, registrazione degli accessi e monitoraggio; non va lasciata come bypass permanente.
- Non eseguire rollback mediante disattivazione indiscriminata dei controlli MFA, modifica manuale di `auth.sessions`, o esposizione di service key.
- Testare la procedura di rollback su ambiente non produttivo prima di qualsiasi cutover.

## 10. Stima preliminare impegno (non preventivo, nessuna spesa autorizzata)

| Attività futura | Stima indicativa |
|---|---:|
| Test runtime e regression suite delle 10 API, pagine, RPC | 3–6 giornate tecniche |
| Audit ownership, CSRF, service role, logging | 2–4 giornate |
| Definizione RBAC e controlli per-azione | 2–4 giornate di analisi |
| Account personali, recovery, pilot e osservabilità | 3–6 giornate |
| Cutover progressivo e prova rollback | 2–4 giornate |
| **Totale non impegnativo** | **12–24 giornate tecniche** |

Intervalli di pianificazione, non costi né stime validate: potranno variare in base ai difetti rilevati e al modello autorizzativo scelto.

## 11. Raccomandazione alla Direzione Strategica

**Acquisire DS-MFA-01/G come audit documentale completato.** Non dichiarare l'intero amministrativo coperto da MFA individuale: il legacy è ancora una via alternativa per tutte le operazioni esaminate. Priorità successiva raccomandata: mandato separato per test runtime T1/T2 e valutazione di una policy di enforcement graduale. **Nessuna modifica, deployment, creazione utenti o intervento Production è autorizzato o eseguito dal presente audit.**

**Decisione vigente: D-07 CHIUSO — PASS nel suo perimetro; Production NO-GO.**
