# DS-MFA-01/D-INT02 — Protocollo dei test residui

**Mandato:** Direzione Strategica BIMARIS, 7 novembre 2026.
**Stato:** PREPARATO; test D-03, D-07 e D-09 non ancora eseguiti.
**Perimetro:** branch `feature/admin-individual-mfa`, Supabase Staging `nzdeoimwikhoidtladnu`, Vercel Preview; Production esclusa.

## Preflight
- Verificare progetto Supabase esatto e Preview collegata allo stesso Staging.
- Confermato all'avvio: account `mfa-collaudo@bimaris.invalid` assente, ruoli `security.admin_members` attivi = 0.
- Usare un'identità fittizia nuova, password temporanea non condivisa, TOTP solo su dispositivo locale.
- Non utilizzare account personali, non riattivare legacy come bypass, non disattivare Vercel Deployment Protection.
- Non modificare codice di autorizzazione o database schema. Se serve un harness, ottenere prima valutazione autorizzativa; nessun bypass permanente.

## Metodo e ordine di esecuzione
1. Predisporre una singola identità tecnica effimera tramite Supabase Auth Dashboard Staging; non inserire righe direttamente in `auth.users`.
2. D-09 anonimo: POST diretto a `/api/admin/operators` con payload invalido e senza credenziali. Verificare redirect/deny, nessuna mutazione. Separare protezione Vercel da risposta dell'applicazione.
3. D-09 ordinario: login AAL1 senza ruolo, POST diretto stesso endpoint. Atteso deny server-side.
4. D-03 + D-09 AAL1: attribuire solo all'identità tecnica il ruolo super_admin attivo, mantenere AAL1, POST diretto. Atteso deny server-side.
5. Registrare TOTP e verificare AAL2, confermare autorizzazione via RPC session-aware e POST controllato con `operator_id` assente o inesistente e `action` invalida. Atteso passaggio del guard, ma nessuna modifica ai dati. Distinguere chiaramente l'eventuale redirect applicativo `invalid` dal redirect `/admin/login`.
6. D-07 ruolo: mantenere la sessione AAL2 e l'access token pre-revoca in memoria volatile del client di collaudo, senza copiarlo in chat, log, URL o report. Revocare ruolo; ripetere POST con il medesimo token/cookie precedentemente emesso. Atteso deny.
7. D-09 ruolo revocato: ripetere POST diretto con sessione AAL2 ancora attiva. Atteso deny.
8. D-07 sessione: per isolare la revoca della sessione dal ruolo, riattivare temporaneamente il ruolo solo per l'identità fittizia e ottenere nuova sessione AAL2; conservare token pre-revoca esclusivamente in memoria volatile. Revocare sessione e refresh token mediante Auth, ripetere la richiesta con token precedente ancora formalmente valido. Atteso deny. Se l'access token resta valido per operazioni privilegiate, interrompere e segnalare FAIL; non correggere senza nuovo mandato.
9. Pulizia: revocare ruolo, invalidare sessioni e refresh token, eliminare account fittizio tramite Auth, controllare assenza account, sessioni, fattori e ruoli residui.

## Controlli tecnici
- Endpoint rappresentativo: `POST /api/admin/operators`, che invoca `isAuthorizedAdmin()` prima di eseguire operazioni. Non usare ID reali e non inviare azioni di scrittura valide.
- Un POST con payload invalido può dimostrare il superamento del guard tramite redirect applicativo, ma non prova l'esecuzione di una scrittura; registrare esattamente questo limite.
- Un JWT in header Authorization non equivale automaticamente alla sessione SSR basata su cookie. Per il test JWT occorre verificare il trasporto effettivo delle credenziali usato dal guard, senza simulare falsi positivi.
- La validità formale JWT e la revoca Auth/sessione sono concetti distinti. Verificare timestamp, session_id e deny del guard senza registrare i valori segreti.
- Classificare ogni scenario PASS/FAIL/NON ESEGUITO; screenshot con dati sensibili oscurati e solo risultati di risposta, mai credenziali.
- Arresto immediato se un'identità non autorizzata esegue operazioni, se il ruolo revocato conserva accesso, se emerge esposizione di segreti o se si rende necessaria una modifica strutturale.

## Stato iniziale
| Test | Stato |
|---|---|
| D-03 | NON ESEGUITO |
| D-07 ruolo | NON ESEGUITO |
| D-07 sessione | NON ESEGUITO |
| D-09 anonimo/ordinario/AAL1/revocato/AAL2 | NON ESEGUITO |

**Production: NO-GO.** Nessun account creato e nessuna credenziale acquisita durante la redazione del protocollo.
