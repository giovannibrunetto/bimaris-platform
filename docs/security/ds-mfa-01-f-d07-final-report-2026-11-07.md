# BIMARIS — DS-MFA-01/F — Collaudo definitivo D-07

**Data:** 7 novembre 2026  
**Mandante:** Direzione Strategica BIMARIS  
**Perimetro:** branch `feature/admin-individual-mfa`; Vercel Preview; Supabase Staging `nzdeoimwikhoidtladnu`.  
**Esito:** **D-07 PASS**; pulizia **PASS**; **Production NO-GO**.

## 1. Correzione integrativa DS-MFA-01/F-INT01
La pagina di collaudo MFA usava l'indirizzo hardcoded di un'identità precedente già eliminata, causando `invalid_credentials` anche con password corretta. In seguito ad autorizzazione integrativa è stato sostituito il riferimento fisso con un campo email per identità fittizie `@bimaris.invalid`, senza modificare guard server-side, legacy, database o Production.

**Commit correttivo:** `53b4ac42623603442ecd0a5f8f3e4aa3b1a8f1fd`.  
**Deployment Preview READY:** `dpl_FTCQXyxxMSAxMa6j4ZRqhpZ4GvzJ`; URL `https://bimaris-platform-2po32w6jk-giovannibrunetto84-1508.vercel.app/admin/mfa-staging`.  
**Verifica finale codice:** nessuna email D-07 o D-INT02 hardcoded nel componente; campo email presente. Il controllo applicativo di staging richiede l'host `nzdeoimwikhoidtladnu.supabase.co`.

## 2. Evidenze runtime
1. Login identità fittizia Staging riuscito; AAL1 senza ruolo automatico; registrazione TOTP e successiva AAL2 confermate in pagina e mediante interrogazioni read-only Supabase.
2. Ruolo `super_admin` temporaneo assegnato solo all'identità fittizia e verificato attivo.
3. Richiesta POST di prova a `/api/admin/operators` con azione deliberatamente invalida: redirect a `/admin/operatori/d07-verifica?state=invalid` prima della revoca, confermando passaggio del guard; nessuna mutazione operatore prevista.
4. Cookie SSR originale preservato esclusivamente in memoria browser. JWT con `session_id` corrispondente alla sessione Auth terminante `f63a9daf`; token non scaduto al controllo preliminare, con scadenza dichiarata 7 novembre 2026 ore 10:48:35 italiane.
5. Revoca mediante logout ufficiale Supabase Auth dalla pagina di collaudo. Interrogazione Supabase successiva: sessione originale assente, altra sessione fittizia ancora presente, ruolo `super_admin` ancora attivo.
6. Ripristino locale del cookie originale e replay della stessa richiesta POST: redirect finale a `/admin/login`; esito `respinto: true`. Il controllo precedente era `autorizzato: true`. La revoca del ruolo non ha causato il rifiuto, essendo avvenuta soltanto dopo il replay.

**Conclusione D-07:** **PASS** — la richiesta privilegiata precedentemente autorizzata è stata respinta dopo revoca della sessione Auth originale, pur mantenendo il ruolo attivo. Il codice HTTP 200 osservato è relativo alla pagina finale dopo redirect; la prova usa la destinazione del redirect, non il 200 come criterio.

## 3. Pulizia
Dopo il replay: ruolo amministrativo temporaneo revocato (`active=false`, `revoked_at` valorizzato), account fittizio eliminato tramite Dashboard Supabase. Verifica SQL finale: **0 utenti, 0 sessioni Auth, 0 refresh token, 0 fattori MFA, 0 ruoli attivi, 0 associazioni amministrative residue** per l'identità D-07. Nessuna password, JWT, cookie o chiave TOTP conservata in questo rapporto.

## 4. Limiti, rischi residui e raccomandazione
Il test è circoscritto alla Preview e all'endpoint amministrativo campione; non certifica l'intero sistema, né autorizza il passaggio a Production. Il login legacy rimane disponibile come da mandato e non è stato modificato: la MFA individuale non è ancora un obbligo generalizzato. Non risultano riferimenti email di prova hardcoded nel componente finale, quindi il debito tecnico specifico è risolto. Raccomandati ulteriori controlli su ogni endpoint privilegiato e piano di migrazione del legacy prima di qualsiasi decisione di produzione.

**Decisione proposta alla Direzione Strategica:** acquisire **D-07 PASS** e pulizia **PASS**; mantenere **Production NO-GO** fino a deliberazione separata.
