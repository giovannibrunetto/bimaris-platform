# DS-MFA-01/D — Rapporto di collaudo integrato

**Mandati:** DS-MFA-01/D e DS-MFA-01/D-INT01, Direzione Strategica BIMARIS, 6 novembre 2026.
**Chiusura delle prove:** 7 novembre 2026.
**Esito:** COLLAUDO PARZIALE; alcuni requisiti non verificati. **Production: NO-GO.**
**Perimetro:** repository `giovannibrunetto/bimaris-platform`, branch `feature/admin-individual-mfa`; Supabase Staging `nzdeoimwikhoidtladnu`; Vercel Preview associata. Supabase Production `vhvccwvcqdhiovpopsze` escluso.

## Implementazione e distribuzione
- Guard server-side: identità Supabase verificata, AAL2 e ruolo `super_admin` attivo; RPC session-aware `public.is_active_super_admin_session`. Sistema legacy mantenuto come percorso alternativo, non disattivato.
- Flusso separato `/admin/mfa-staging`: login tecnico, enrollment TOTP, challenge/verify, stato AAL e logout; controllo ambiente Preview/branch/Staging.
- Implementazione iniziale del flusso: commit `47899a8`. Correzioni TOTP/QR e build: `d5ab68d`, `f66a6de` (deployment READY). Commit intermedi `78f22d9` e `a5a6b45` falliti in build e sostituiti.
- Preview utilizzata nel collaudo: `https://bimaris-platform-dumto3hfj-giovannibrunetto84-1508.vercel.app`. Il completamento della build non sostituisce i test runtime.
- Nessun segreto, QR, codice TOTP, password, token o identificativo personale incluso nel rapporto.

## Matrice dei test
| ID | Condizione iniziale | Operazione | Atteso | Osservato | Esito |
|---|---|---|---|---|---|
| D-01 | Browser senza credenziali | Richiesta GET a `/admin` su Preview | Accesso negato | Risposta HTML Next.js con redirect `/admin/login`; nessuna dashboard | PASS (pagina) |
| D-02 | Identità tecnica autenticata AAL2 senza ruolo | Verifica RPC con sessione tecnica reale | Accesso amministrativo negato | 1 sessione AAL2, 0 autorizzate; nessun ruolo attivo | PASS (RPC); pagina non provata in questa condizione |
| D-03 | Identità Super Admin con AAL1, senza AAL2 | Tentativo di operazione privilegiata | Accesso negato | Non eseguito con ruolo attivo e AAL1 | NON ESEGUITO |
| D-04 | Identità tecnica AAL2, ruolo Super Admin temporaneamente attivo | Apertura `/admin` nella Preview | Dashboard consentita | Dashboard «Centro operativo» visualizzata; RPC 1 sessione AAL2 autorizzata | PASS (dashboard + RPC) |
| D-05 | Identità tecnica AAL2 ancora autenticata | Revoca ruolo in Staging e aggiornamento dashboard | Successiva richiesta negata | Redirect alla pagina login legacy; RPC 0 sessioni autorizzate, 1 sessione AAL2 ancora presente | PASS |
| D-06 | Ruolo già revocato, sessione AAL2 presente | Logout tramite flusso di collaudo | Logout locale e revoca sessione/refresh token | UI `AAL: none`; successiva query: 0 sessioni, 0 refresh token, 0 ruoli attivi | PASS per logout e rimozione record; non prova riuso JWT |
| D-07 | Access token emesso prima della revoca/logout | Riutilizzo controllato del JWT precedente | Nessuna operazione privilegiata | JWT non conservato né riutilizzato; impossibile attestare revoca immediata del token in questo test | NON ESEGUITO |
| D-08 | Identità tecnica senza ruolo/sessioni | Disabilitazione/eliminazione e controllo residui | Nessuna autorizzazione residua | Account eliminato; 0 account, 0 fattori MFA orfani, 0 ruoli orfani e 0 ruoli attivi | PASS (pulizia e assenza privilegi); tentativo di login post-eliminazione non eseguito |
| D-09 | Chiamata diretta POST API admin senza cookie | Invocazione diretta `/api/admin/operators` | Guard server-side rifiuta | Codice esaminato: `isAuthorizedAdmin()` precede accesso ai dati; richiesta POST runtime non eseguita | NON ESEGUITO |

**Regola di interpretazione:** i PASS circoscritti non dimostrano automaticamente gli altri requisiti. La GET anonima alla dashboard non è un test POST delle API. La rimozione dei record di sessione non dimostra da sola il comportamento di un JWT precedentemente emesso.

## Evidenze e distinzione delle revoche
1. **Revoca ruolo:** aggiornamento `security.admin_members` a inattivo/revocato; sessione AAL2 mantenuta; RPC passa da autorizzata a negata e la dashboard rimanda al login al refresh. **Verificato runtime.**
2. **Logout browser:** pagina di collaudo mostra `AAL: none`. **Verificato runtime.**
3. **Sessioni/refresh token:** prima del logout 1 sessione e 2 record refresh token; dopo il logout 0 e 0. **Verificato nel database Staging.**
4. **Access token già emessi:** non è stata eseguita una richiesta privilegiata usando un token acquisito prima della revoca. **Non verificato**; non dichiarare revoca immediata JWT.
5. **Separazione ambienti:** test e modifiche svolti sul progetto Supabase Staging e branch Preview autorizzati; nessuna modifica a Production effettuata nell'ambito del collaudo.

## Anomalie e rischi residui
- Due build Preview intermedie fallite per modifiche al trattamento dei fattori incompleti; sostituite dalla versione compilata `f66a6de`.
- Un fattore TOTP incompleto generato durante il collaudo; successivo fattore verificato e infine eliminazione dell'account di prova. Verifica finale: nessun fattore MFA orfano.
- Test D-03, D-07 e D-09 non completati. Per D-02 e D-08 la prova è limitata a RPC/DB e pulizia, rispettivamente.
- Il sistema legacy resta deliberatamente attivo e costituisce un percorso amministrativo alternativo: la MFA individuale non è obbligatoria per tutti gli accessi.
- Per D-09 la Preview protetta e gli strumenti disponibili non hanno consentito una richiesta POST runtime senza introdurre un meccanismo ulteriore; non è stata rimossa la protezione Vercel.
- Non escludere a priori access token residui ancora validi a livello Auth; il controllo privilegiato session-aware deve essere provato con token pre-revoca in un ciclo successivo.

## Pulizia
Identità tecnica `mfa-collaudo@bimaris.invalid` eliminata esclusivamente da Supabase Staging dopo revoca del ruolo e logout. Verificati 0 account di test, 0 fattori MFA orfani, 0 membership amministrative orfane, 0 membership amministrative attive. Nessun account personale creato.

## Raccomandazione alla Direzione Strategica
**NO-GO per Production e per la disattivazione del legacy.** Acquisire il presente rapporto come chiusura del ciclo di collaudo parziale, non come approvazione del rilascio. Autorizzare, se ritenuto opportuno, un successivo collaudo circoscritto D-03/D-07/D-09 con identità tecnica effimera, test POST non mutativo o payload invalido e gestione sicura del token pre-revoca; documentare le prove e ripulire nuovamente l'ambiente. Nessuna implementazione ulteriore o migrazione è autorizzata da questo rapporto.
