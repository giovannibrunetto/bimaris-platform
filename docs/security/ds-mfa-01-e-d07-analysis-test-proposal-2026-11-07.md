# DS-MFA-01/E — Analisi del requisito D-07 e proposta di collaudo definitivo

**Data:** 7 novembre 2026  
**Mandante:** Direzione Strategica BIMARIS  
**Natura:** analisi esclusivamente documentale; nessuna modifica a codice, configurazioni, identità o database.  
**Perimetro esaminato:** `feature/admin-individual-mfa`, Supabase Staging `nzdeoimwikhoidtladnu`.  
**Decisione proposta:** **NO-GO Production / GO condizionato a un futuro collaudo D-07 esplicitamente autorizzato**.

## 1. Sintesi esecutiva
La revoca del ruolo amministrativo è stata provata in runtime. Non è stato invece eseguito il test distinto che mantiene un access token JWT precedente alla revoca di **sessione Auth**, lo ripresenta mediante il trasporto SSR realmente usato da BIMARIS e misura il risultato del guard. L'account tecnico è stato successivamente eliminato e la pulizia verificata (0 identità, 0 sessioni, 0 refresh token, 0 fattori MFA, 0 membership). Questa pulizia impedisce di riprendere la stessa prova.

Il codice corrente presenta un controllo session-aware favorevole alla revoca immediata **se** la revoca Auth rimuove la riga `auth.sessions` prima del replay; questo comportamento è **deducibile**, non certificato dal test mancante. La presenza del percorso legacy alternativo impone inoltre di non affermare che MFA sia obbligatoria globalmente.

## 2. Perché D-07 non è stato completato
1. Il ciclo iniziale non aveva conservato un token/cookie pre-revoca in un contesto volatile isolato.
2. Il logout browser elimina le credenziali locali: ripetere la richiesta dopo logout avrebbe testato l'assenza del cookie, non il rifiuto di un cookie preesistente.
3. Un header `Authorization: Bearer` arbitrario non riproduce la sessione SSR che il guard legge dai cookie.
4. Il connettore Supabase disponibile espone SQL e documentazione, ma non un'azione Auth Admin per revocare le sessioni di un altro utente; non era appropriato modificare direttamente `auth.sessions` o `auth.refresh_tokens`.
5. Durante la pulizia autorizzata, l'account fittizio è stato bannato e poi eliminato mediante Dashboard Auth, senza un replay controllato. Pertanto D-07 rimane **NON ESEGUITO**, non PASS né FAIL.

## 3. Provider: fatti documentati
**Supabase Auth** distingue access token JWT (firmato, con `exp` e `session_id`) e refresh token (utilizzato per emettere nuove coppie). Il logout `global` riguarda tutte le sessioni dell'utente, `local` solo quella corrente, `others` le altre. Il logout revoca refresh token e termina le sessioni interessate. Tuttavia un JWT emesso può continuare a superare una verifica puramente crittografica fino alla sua scadenza. Supabase raccomanda, per azioni sensibili che richiedono revoca immediata, di confrontare `session_id` con `auth.sessions`: se la riga è assente dopo logout, la sessione è terminata. Una sessione scaduta per timeout non necessariamente è cancellata subito; perciò sono importanti anche i controlli di validità temporale. L'eliminazione dell'utente **non deve essere assunta** come invalidazione immediata dei JWT già emessi.

Fonti ufficiali:
- https://supabase.com/docs/guides/auth/signout
- https://supabase.com/docs/guides/auth/sessions
- https://supabase.com/docs/reference/javascript/auth-signout

**Disabilitazione/ban:** la Dashboard indica che il ban impedisce l'accesso per la durata selezionata; non è una prova che il JWT già emesso sia immediatamente rifiutato. Nel ciclo precedente, dopo il ban risultavano ancora 1 sessione e 2 record refresh token. Non equiparare ban a revoca della sessione.

## 4. Codice BIMARIS: deduzioni verificabili
File esaminati su branch di prova:
- `apps/web/lib/admin-mfa-guard.ts`
- `apps/web/lib/admin-access.ts`
- `apps/web/lib/supabase/user-server.ts`
- `apps/web/app/api/admin/operators/route.ts`
- Definizione SQL letta da `pg_get_functiondef` per `public.is_active_super_admin_session(uuid,uuid)`.

Per ogni invocazione di `getVerifiedSuperAdmin()`:
1. Controlla hostname Supabase Staging e costruisce un client SSR da cookie.
2. Recupera sessione/access token tramite `getSession()` e legge il `session_id` dal JWT, come chiave di lookup.
3. Richiede `auth.getUser(accessToken)`, confrontando l'identità restituita con quella della sessione.
4. Richiede `mfa.getAuthenticatorAssuranceLevel()` con `currentLevel === 'aal2'`.
5. Interroga via client service-role la RPC `is_active_super_admin_session(user_id,session_id)`, che verifica `auth.sessions` esistente, user_id coerente, `s.aal='aal2'`, `s.not_after` non scaduto, membership `super_admin` attiva e `revoked_at IS NULL`. In caso di errore o risultato diverso da `true`, rifiuta.

**Inferenza:** se il logout elimina la riga della sessione e la richiesta successiva raggiunge questa RPC con il JWT pre-revoca, la RPC restituisce `false` anche se il JWT non è ancora scaduto. Il codice non usa soltanto i claim del JWT per autorizzare.

**Limite critico:** `isAuthorizedAdmin()` controlla **prima** `isAdminAuthenticated()` (cookie legacy) e autorizza senza MFA individuale se questo restituisce `true`. Pertanto il test D-07 deve usare un contesto senza cookie legacy, e la migrazione a MFA obbligatoria rimane separata e non autorizzata. Inoltre il comportamento concreto di `getSession()` e dei cookie durante refresh/replay deve essere verificato, non dedotto.

**Nota di sicurezza:** la RPC è `SECURITY DEFINER`; l'uso nel guard è service-role. È opportuno verificare i permessi EXECUTE effettivi prima di una futura release, senza alterare la funzione nel mandato corrente.

## 5. Evidenze runtime disponibili
| Scenario | Osservato | Stato |
|---|---|---|
| Anonimo / ordinario AAL1 su POST admin | Redirect `/admin/login` | PASS |
| Super Admin AAL1 | Redirect `/admin/login` | PASS |
| Super Admin AAL2, payload invalido | Redirect applicativo `state=invalid` | PASS guard, non prova scrittura |
| Revoca ruolo con stessa sessione AAL2 | Redirect `/admin/login` | PASS |
| RPC con ruolo revocato e sessione AAL2 presente | `false` | PASS |
| Replay JWT dopo revoca **Auth session** | Nessun replay eseguito | **NON ESEGUITO** |
| Pulizia account tecnico | 0 account/sessioni/refresh/fattori/ruoli | PASS |

Le evidenze sono descritte nei rapporti `ds-mfa-01-d-int02-runtime-status-2026-11-07.md` e `ds-mfa-01-d-int02-final-security-cleanup-report-2026-11-07.md`.

## 6. Valutazione del rischio
**Rischio D-07: non quantificato sperimentalmente; rilevanza alta** per un endpoint amministrativo che usa service-role per modificare dati. Il controllo server-side su `auth.sessions` è una mitigazione plausibile, ma l'assenza del replay lascia un'incertezza non accettabile per certificare il requisito.

Rischi distinti:
- JWT formalmente valido dopo logout: comportamento documentato, non equivale automaticamente ad accesso amministrativo.
- Cookie SSR ripresentato dopo logout: esito non testato.
- Cookie legacy valido: percorso alternativo che bypassa MFA individuale per progetto, da trattare nella futura decisione di dismissione, non come FAIL automatico di D-07.
- Verifica incompleta della matrice di endpoint amministrativi: il POST `/api/admin/operators` è rappresentativo, non prova universale.

## 7. Procedura proposta per un nuovo test autorizzato
**Prerequisiti:** delibera distinta, nuova identità fittizia su Staging, nessuna credenziale personale, Preview protetta, controllo dell'assenza di cookie legacy. Nessun cambiamento di Production.

1. Preparare un ambiente di test isolato con client SSR che riproduca esattamente i cookie e le richieste della Preview. Verificare la fattibilità di preservare **in memoria volatile** una copia del cookie/sessione pre-revoca senza scriverla su disco, log, chat o report.
2. Creare identità effimera, assegnare temporaneamente `super_admin`, autenticare con TOTP AAL2. Verificare via Auth e RPC `session_id`, livello e ruolo. Accertare che il JWT pre-revoca non sia scaduto; registrare solo esito booleano e tempi relativi, non token.
3. Con il cookie originale effettuare POST innocuo con azione invalida: atteso passaggio del guard e redirect applicativo; nessuna mutazione.
4. Revocare la sessione e i refresh token **tramite API Auth ufficiale** (logout appropriato o Auth Admin) in un contesto separato che non cancelli il cookie preservato nel client di replay. Verificare tramite query di sola lettura che la specifica sessione e i refresh token non siano più presenti.
5. Ripresentare **esattamente** il cookie pre-revoca nella richiesta POST alla medesima route, prima della scadenza JWT. Non utilizzare solo header Authorization. Atteso `/admin/login` o rifiuto esplicito prima dell'azione; verificare nessuna mutazione.
6. **PASS** soltanto con revoca Auth provata, JWT pre-revoca ancora formalmente valido, replay del trasporto SSR dimostrato e accesso negato. **FAIL** se il guard lascia passare un'operazione privilegiata dopo la revoca. **NON ESEGUITO** se non è possibile preservare/reinviare il cookie o verificare la revoca. Non confondere redirect da Vercel Deployment Protection con redirect applicativo.
7. Qualunque esito: revocare ruolo, sessioni/refresh token tramite Auth, eliminare identità di prova tramite Auth, verificare zero residui e documentare.

**Stop conditions:** accesso non autorizzato, leak credenziali, richiesta di bypass, variazione ambienti, impossibilità di distinguere cookie legacy o sessione SSR. Non effettuare scritture valide per il test.

## 8. Strumenti/modifiche eventualmente necessari e stima
**Preferenza A — senza modifiche applicative:** client di test isolato con cookie jar volatile e due contesti indipendenti (uno preserva il cookie; uno invoca logout/revoca Auth), con possibilità di autenticare la Preview protetta senza rimuovere Deployment Protection. Verificare prima che il trasporto sia identico a quello reale. Strumenti possibili: browser con automazione locale o harness esterno temporaneo, purché approvato e senza registrazione segreti. **Stima indicativa: 3–6 ore tecniche** inclusa raccolta evidenze e pulizia, subordinata a disponibilità credenziali e accesso.

**Alternativa B — se A non riproduce i cookie SSR:** progettare un harness temporaneo in branch Preview, esclusivamente previa delibera specifica e code review; non alterare il guard, non aggiungere bypass o esporre token. **Stima indicativa: 1–2 giornate** inclusi revisione, collaudo e rimozione dell'harness. Non autorizzata.

**Possibili correzioni:** nessuna correzione architetturale è dimostrata necessaria oggi. Se il replay fallisse il requisito, analizzare ordine di validazione, stato `auth.sessions`, refresh automatico e trasporto cookie; formulare una proposta separata con cause e test di regressione. **Nessuna modifica proposta come esecutiva in questa fase.**

## 9. Raccomandazione alla Direzione Strategica
**GO** per acquisire il presente studio documentale. **NO-GO** per attivazione identità amministrative personali, dismissione legacy e rilascio Production. Autorizzare, se ritenuto necessario, soltanto un nuovo collaudo D-07 con procedura e prerequisiti qui descritti. Un PASS circoscritto non autorizzerebbe automaticamente il rilascio: resterebbero la decisione sul legacy e il riesame della superficie amministrativa.

**Stato del requisito D-07: APERTO — NON VERIFICATO.**
