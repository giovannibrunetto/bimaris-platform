# DS-MFA-01/C — Matrice di collaudo e criteri di rilascio

**Stato:** predisposizione documentale, nessun test runtime autorizzabile finché il mapping Preview → Supabase Staging non è verificato.

## Precondizioni obbligatorie
1. Verificare che URL Supabase, publishable key e service key utilizzate dalla Preview del branch `feature/admin-individual-mfa` appartengano **tutte** al progetto Staging `nzdeoimwikhoidtladnu`, senza riportare credenziali nei log.
2. Dimostrare che le variabili condivise non puntano a Production `vhvccwvcqdhiovpopsze`. In caso di incertezza: STOP.
3. Verificare la protezione Preview e il prelaunch gate senza introdurre bypass.
4. Predisporre rollback delle modifiche di codice e della migrazione Staging. Nessun test con account personali (B5 non autorizzato).
5. Configurare un segreto HMAC dedicato soltanto sul branch Preview autorizzato prima di rimuovere il fallback legacy.

## Matrice B2 — autorizzazione
| ID | Caso | Atteso |
|---|---|---|
| AUTH-01 | Sessione assente, nessun cookie legacy | 401/redirect; nessuna operazione service-role |
| AUTH-02 | Supabase Auth AAL1 senza MFA | Accesso negato |
| AUTH-03 | Supabase Auth AAL2 senza ruolo attivo | Accesso negato |
| AUTH-04 | Ruolo non attivo o revocato | Accesso negato al primo nuovo controllo |
| AUTH-05 | URL Supabase diverso da Staging | Nuovo percorso MFA negato |
| AUTH-06 | Errore RPC o servizio Supabase indisponibile | Nuovo percorso MFA negato |
| AUTH-07 | Sessione legacy valida | Accesso legacy invariato fino a B8; NON prova MFA obbligatoria |
| AUTH-08 | Sessione Supabase revocata | Negata immediatamente: **da progettare e provare** |
| AUTH-09 | Utente AAL2 attivo | Non eseguibile senza autorizzazione B5 |

## Matrice B3 — route e regressioni
- Controllare tutte le API amministrative GET/POST/PATCH/DELETE e tutte le pagine `/admin`, incluse le route dinamiche, le server action e i redirect.
- Verificare che nessuna scrittura con service role avvenga prima dell'autorizzazione.
- Verificare l'assenza di escalation dalle API pubbliche e dalle aree operatore.
- Preservare le distinzioni approvazione/pubblicazione, revisioni, selezione operatori e visibilità editoriale.
- Eseguire test negativi con sessioni anonime e di operatori fittizi già autorizzati in Staging.

## Matrice B4 — rate limiting
| ID | Caso | Atteso |
|---|---|---|
| RATE-01 | Chiave HMAC dedicata presente | Consumo RPC regolare |
| RATE-02 | Segreto assente | 503, non bypass |
| RATE-03 | IP mancante | 503, non bypass |
| RATE-04 | Superamento soglia | 429 con Retry-After corretto |
| RATE-05 | RPC indisponibile | 503, non bypass |
| RATE-06 | Rotazione chiave | Impatto sui contatori hash documentato e accettato |
| RATE-07 | Form pubblici contatto/candidatura/interesse | Nessuna regressione |
| RATE-08 | Login legacy | Nessuna regressione finché B8 non autorizzato |

## Criticità residue e decisione
- Il gate transitorio è **legacy OR MFA**: finché B8 non è autorizzato, l'MFA non è un requisito generale.
- La verifica statica dell'URL Staging nel solo `admin-mfa-guard` **non protegge** tutte le API con service-role, che possono continuare attraverso il percorso legacy: non eseguire test sul branch senza mapping completo.
- La revoca immediata delle sessioni Supabase non è dimostrata da `auth.getUser()` e richiede una progettazione dedicata.
- Il registro audit per operazioni amministrative non è ancora implementato.
- La funzione `is_active_super_admin` è stata verificata solo via SQL; manca prova RPC attraverso client server-side.
- Build READY non equivale a PASS di sicurezza o a go-live.

**Gate:** B2/B3/B4 non completati. Production NO-GO. B5–B9 non autorizzati.
