# BIMARIS — DS-MFA-01/L — Rapporto implementazione I-1

**Data:** 7 novembre 2026  
**Stato:** IMPLEMENTAZIONE DEPOSITATA; **ACCETTAZIONE I-1 SOSPESA IN ATTESA DI ESECUZIONE TEST**  
**Ambiente:** GitHub branch `feature/admin-individual-mfa`; Production NO-GO.

## File e commit
1. `apps/web/lib/admin-policy-core.ts` — `41fec8a1357d8621d95bdba0571ae71aa9117f2f`.
2. `apps/web/lib/admin-policy.ts` — `47f3a1dc9991f05deb0533bb45730e11b0fedf8d`.
3. `apps/web/tests/admin-policy.test.mjs` — `037130667f3d372ee55a18b2c00322923761322e`.
4. `docs/security/ds-mfa-01-l-i1-implementation-notes-2026-11-07.md` — `b4eac86fc3ee8c0e8eb0ee408ee38040aa2b827a`.

## Architettura
Policy core senza dipendenze dal framework, risorse e azioni esplicite, deny-by-default, modalità `individual_required` e `legacy_explicit`. La modalità legacy **non autorizza mai** nella nuova policy. Adapter opt-in `authorizeAdmin()` server-only usa `getVerifiedSuperAdmin()` già esistente, che valida AAL2, sessione e ruolo attivo tramite Supabase e RPC. Nessuna chiamata al guard legacy in questo nuovo adapter. Predisposto callback per permessi granulari.

## Matrice iniziale
11 risorse logiche: dashboard (read), analytics (read), applications (read/review/accept/reject/publish), events (read/approve/reject), experiences (read/create/review/publish/unpublish/feature/manage_territory), experience_revisions (read/request_changes/approve_apply), collaborations (read), itineraries (read/create/update/publish/manage_stops), operators (read/update/select/publish/unpublish), operator_memberships (read/link/update_role/revoke), operator_revisions (read/approve_apply/reject). Le denominazioni sono policy future, **non ancora mapping operativo** degli action string esistenti.

## Test predisposti
Otto casi automatizzati: matrice, unknown resource/action, legacy denied, unknown mode, AAL1/ruolo/sessione non valida, AAL2 valido, permesso negato, errore nel permission checker. **Non eseguiti in questa sessione:** non è disponibile qui una checkout locale del repository con ambiente Node/pnpm sincronizzato né un esecutore CI autorizzato. Non attribuire PASS senza output. Anche typecheck, suite preesistente, build e verifica di regressione runtime sono **NON ESEGUITI**.

Comandi necessari:
```bash
node --experimental-strip-types --test apps/web/tests/admin-policy.test.mjs
pnpm --filter @bimaris/web typecheck
pnpm test:auth
pnpm --filter @bimaris/web build
```
La build richiede rispetto della guardia prebuild di Staging; non forzare deployment.

## Compatibilità e limiti
Nessun file preesistente modificato, nessun import da route/page/layout verso la nuova policy: **assenza di variazioni intenzionali** del flusso legacy e individuale esistente, verificata staticamente dal perimetro dei commit. **Assenza di regressioni runtime non certificata** fino all'esecuzione dei test. Nessun nuovo segreto, dipendenza o costo.

L'actor restituito contiene `userId`, `aal`, `role`, risorsa e azione; non contiene `sessionId` perché il guard attuale non lo espone. La revoca sessione è comunque controllata dal guard. La tracciabilità sessione e l'audit sono riservati a fasi successive. Il permesso granulare è predisposto ma non ancora associato a ruoli futuri.

## Rollback
Revert dei quattro commit I-1 nell'ordine inverso, senza toccare commit G/H/I; oppure eliminazione dei quattro file introdotti. Verificare che `admin-access.ts`, tutte le route e pagine risultino invariati; eseguire typecheck e suite preesistente. Nessun rollback DB, RPC, configurazioni o Production.

## Valutazione I-2
Non autorizzata. Richiede mapping preciso di 10 API e 16 pagine, integrazione graduale della policy, separazione ruoli/permessi e audit actor-based, test runtime, progettazione anti-CSRF e piano di recovery. Stima I-2 invariata **4–7 giornate tecniche** preliminari; da rivalutare dopo esito dei test I-1.

## Decisione
**I-1 non può essere dichiarata conclusa secondo i criteri della Direzione Strategica finché i test automatici e la regressione non risultano eseguiti con evidenza PASS.** Nessuna implementazione I-2–I-7 autorizzata. Production NO-GO.
