# BIMARIS — DS-MFA-01/H — Esito parziale runtime e audit delle API amministrative

**Data:** 7 novembre 2026  
**Ambiente:** Supabase Staging `nzdeoimwikhoidtladnu`; Preview Vercel, branch `feature/admin-individual-mfa`  
**Stato:** audit documentale integrativo completato; runtime parziale; **certificazione finale NON concessa**  
**Production:** **NO-GO**. Nessuna modifica a codice, schema, configurazione o produzione.

## 1. Risultato verificato

Sequenza browser sulla route `POST /api/admin/operator-memberships`, account tecnico fittizio, richieste con azione volutamente inesistente:

| Test | Stato identità | Destinazione finale | Esito limitato |
|---|---|---|---|
| H-04 | AAL1, senza ruolo | `/admin/login` | PASS rifiuto |
| H-05 | AAL1, ruolo super_admin attivo | `/admin/login` | PASS rifiuto |
| H-06B | AAL2, ruolo attivo | `/admin/operatori/accessi` | PASS attraversamento guard |
| H-07 | AAL2, ruolo revocato | `/admin/login` | PASS rifiuto |
| H-08 PRE | AAL2, ruolo riattivato | `/admin/operatori/accessi` | PASS attraversamento guard |
| H-08 POST | Ruolo attivo, sessione AAL2 cancellata | `/admin/login` | PASS rifiuto |

Il codice HTTP 200 era quello della **pagina finale dopo redirect**, non della risposta originale del POST. Il risultato positivo non equivale alla riuscita di una mutazione: l'azione era intenzionalmente invalida.

Conferma diretta Supabase: sessione AAL2 e fattore TOTP verificato durante il test. Revoca sessione verificata con test browser. Pulizia finale verificata: **0 utenti, 0 ruoli, 0 sessioni, 0 fattori MFA** per `mfa-h01-collaudo@bimaris.invalid`.

## 2. Matrice statica aggiornata delle dieci API operative

| Endpoint | Guard individuale da codice | Runtime individuale | Azione valida / effetti |
|---|---|---|---|
| POST `/api/admin/applications` | `isAuthorizedAdmin()` | NON ESEGUITO | NON ESEGUITO |
| POST `/api/admin/events/[id]/status` | idem | NON ESEGUITO | NON ESEGUITO |
| POST `/api/admin/experience-revisions` | idem | NON ESEGUITO | NON ESEGUITO |
| GET `/api/admin/experiences/[id]/collaboration` | idem | NON ESEGUITO | NON ESEGUITO |
| POST `/api/admin/experiences/create` | idem | NON ESEGUITO | NON ESEGUITO |
| POST `/api/admin/experiences` | idem | NON ESEGUITO | NON ESEGUITO |
| POST `/api/admin/itineraries` | idem | NON ESEGUITO | NON ESEGUITO |
| POST `/api/admin/operator-memberships` | idem | **PASS H-04–H-08** solo guard | NON ESEGUITO |
| POST `/api/admin/operator-revisions` | idem | NON ESEGUITO | NON ESEGUITO |
| POST `/api/admin/operators` | idem | evidenza precedente D-07/H-03 di rifiuto, non matrice completa | NON ESEGUITO |

Nessuna delle 16 pagine amministrative riservate ha ricevuto in questa fase una matrice runtime completa. Le due API login/logout sono classificate separatamente.

## 3. Rilievi prioritari, fondati sul codice

**P0 — Bypass architetturale dell'obbligatorietà MFA.** `apps/web/lib/admin-access.ts` restituisce `true` immediatamente se `isAdminAuthenticated()` riconosce il cookie legacy. Soltanto in alternativa chiama `getVerifiedSuperAdmin()`. Pertanto il requisito *MFA individuale obbligatoria* non è soddisfatto, anche se il ramo individuale ha superato i test H-04–H-08. Il bypass è **dimostrato staticamente**; un login legacy valido non è stato provato in runtime in questo mandato.

**P0 — Identità e revoca legacy non equivalenti a Supabase.** `apps/web/lib/admin-auth.ts` usa cookie firmato HMAC con scadenza di 12 ore e nessuna associazione a identità individuale Supabase; il cookie non consulta `auth.sessions` o `security.admin_members`. La revoca di ruolo o sessione Supabase non revoca tale cookie. Il login legacy richiede TOTP **solo se** è configurato `BIMARIS_ADMIN_TOTP_SECRET`: il TOTP condiviso, anche se attivo, non equivale all'MFA individuale. Non è stato verificato il valore delle variabili d'ambiente.

**P1 — Anti-CSRF non uniforme.** Da lettura dei route handler: `/api/admin/applications` e `/api/admin/operators` controllano `sec-fetch-site` e `origin`; `/api/admin/operator-memberships` controlla `origin` se presente; altre route operative, tra cui `/api/admin/events/[id]/status`, `/api/admin/experiences`, `/api/admin/experience-revisions`, `/api/admin/itineraries`, non presentano lo stesso controllo locale. Il cookie legacy è `SameSite=Strict`, mitigazione rilevante, ma non sostituisce una revisione uniforme di CSRF e dei flussi autenticati via cookie. **Rischio da valutare, non exploit dimostrato.**

**P1 — Privilegi service-role e audit.** Le API usano `createServiceClient()` dopo il guard per scritture, RPC, media e pubblicazione. È necessario verificare per ogni azione controlli di input, attore, ownership, effetti, log e rollback. La route eventi aggiorna lo stato solo se `verification_status='pending'`, ma il redirect di successo dipende dall'assenza di errore e non verifica esplicitamente il numero di righe aggiornate: il messaggio di successo può non provare una mutazione effettiva.

**P1 — Autorizzazione grossolana.** Il guard individuale riconosce il solo ruolo `super_admin`, senza separazione di privilegi per gestione accessi, approvazioni e pubblicazione. È un tema di governance da deliberare, non una modifica autorizzata.

**Nota positiva.** `apps/web/lib/admin-mfa-guard.ts` verifica identità con Supabase Auth, AAL2, session ID e RPC `is_active_super_admin_session`, e vincola l'host al progetto Staging; H-04–H-08 supportano la correttezza del ramo individuale sulla route provata.

## 4. Decisione e piano proposto

**Decisione raccomandata: mantenere Production NO-GO.** Il requisito MFA individuale obbligatoria è bloccato dal ramo legacy e mancano test runtime per nove delle dieci API operative e per le azioni valide.

1. **P0, approvazione Direzione Strategica:** deliberare politica di cutover e fallback controllato; vietare un bypass legacy silenzioso nelle operazioni migrate.
2. **P0, mandato tecnico separato:** progettare modifica reversibile dell'adapter `isAuthorizedAdmin`, copertura di pagine/API e test automatici AAL1/AAL2/ruolo/sessione/legacy.
3. **P0, collaudo Staging:** fixture fittizie reversibili per tutte le dieci API e operazioni ad alto impatto; test con risposte originali e verifica dello stato dati, non solo URL finale.
4. **P1:** uniformare revisione anti-CSRF, audit per attore individuale, permessi per azione, recovery e rollback testato.
5. **Solo dopo evidenze e delibera:** pilot individuale e progressiva dismissione delle credenziali condivise.

## 5. Perimetro e limitazioni

Audit di codice eseguito su branch `feature/admin-individual-mfa` per `admin-access.ts`, `admin-mfa-guard.ts`, `admin-auth.ts`, login e dieci route operative. Le altre nove route non sono state collaudate in runtime in questa fase perché non è disponibile qui una sessione browser autenticata da orchestrare direttamente; non si attribuiscono PASS fittizi. Nessun intervento esecutivo su codice, deploy o produzione. Questo documento è un **rapporto di avanzamento e gap analysis**, non un certificato di sicurezza finale.

**Esito:** ramo MFA individuale verificato positivamente su un endpoint; enforcement amministrativo generale **INCOMPLETO**; **Production NO-GO**.
