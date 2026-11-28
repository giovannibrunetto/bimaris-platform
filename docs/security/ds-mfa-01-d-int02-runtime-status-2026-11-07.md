# BIMARIS — DS-MFA-01/D-INT02 — Stato del collaudo runtime
**Data:** 7 novembre 2026
**Ambiente:** Supabase Staging `nzdeoimwikhoidtladnu`, Vercel Preview, branch `feature/admin-individual-mfa`.
**Production:** NO-GO. Nessuna modifica Production autorizzata.
**Identità fittizia:** `mfa-int02-collaudo@bimaris.invalid` (ID `50dacba2-8ffc-438f-b610-635796b9f492`).

## Esiti osservati
| Prova | Evidenza | Esito |
|---|---|---|
| D-09 anonimo | POST `/api/admin/operators`, HTTP 303, `Location: /admin/login` | PASS |
| Login tecnico AAL1 | UI collaudo mostra `aal1` | PASS |
| D-09 utente ordinario AAL1, nessun ruolo | POST HTTP 303, `Location: /admin/login` | PASS |
| D-03 super_admin AAL1 | Ruolo temporaneo attivo; POST HTTP 303, `Location: /admin/login` | PASS |
| TOTP/AAL2 | UI collaudo mostra `aal2` dopo verifica TOTP | PASS |
| D-09 super_admin AAL2 | POST HTTP 303, `Location: /admin/operatori/?state=invalid`; guard superato, payload invalido, nessuna scrittura dimostrata | PASS (guard) |
| D-07 revoca ruolo | Ruolo posto `active=false` e `revoked_at` valorizzato; stessa sessione browser AAL2: POST HTTP 303, `Location: /admin/login` | PASS |
| D-07 RPC post-revoca | Sessione AAL2 presente; `public.is_active_super_admin_session` restituisce `false` | PASS (RPC) |
| D-07 revoca sessione e riuso JWT pre-revoca | Non è stata eseguita la revoca Auth con replay controllato del medesimo token/cookie | NON ESEGUITO |

## Stato verificato dopo le prove
- `security.admin_members`: ruolo `super_admin` dell'identità fittizia inattivo, revocato il 2026-11-07 alle 07:31:39 UTC.
- `auth.sessions`: 1 sessione; `aal2`; RPC autorizzazione = `false`.
- `auth.refresh_tokens`: 2 record; `auth.mfa_factors`: 1 fattore.
- Non sono stati letti, salvati o trasmessi password, JWT, cookie, QR o codici TOTP.
- L'identità tecnica NON è stata ancora eliminata: pulizia finale in sospeso.

## Limiti e decisione
Il test di revoca del ruolo prova il rifiuto delle operazioni privilegiate anche con sessione AAL2 precedentemente autorizzata. Non equivale a una prova di revoca immediata del JWT dopo sign-out o revoca Auth. La documentazione Supabase precisa che gli access token possono restare validi fino a scadenza; per questo serve verificare la sessione lato server.

La funzione di guard `apps/web/lib/admin-mfa-guard.ts` verifica l'identità con Auth, richiede AAL2 e invoca RPC session-aware. `apps/web/lib/admin-access.ts` mantiene tuttavia il percorso legacy come alternativa, perciò la MFA individuale non è ancora obbligatoria per ogni accesso amministrativo.

**Decisione operativa:** mantenere revocato il ruolo tecnico. Non riattivarlo senza predisporre una procedura verificabile per revoca Auth e replay della stessa sessione, evitando bypass, modifiche allo schema Auth e segreti nei log. D-07 sessione rimane NON ESEGUITO. Non dichiarare completato il collaudo o autorizzato il rilascio.

**Azioni residue:** test D-07 sessione con sessione/token pre-revoca, verifica deny server-side, revoca finale di sessioni e refresh token tramite API Auth, rimozione dell'identità fittizia e verifica assenza residui. La pulizia finale richiede di non compromettere prima il test ancora aperto.

## Riferimenti
- Protocollo: `docs/security/ds-mfa-01-d-int02-test-protocol-2026-11-07.md`.
- Rapporto precedente: `docs/security/ds-mfa-01-d-integrated-test-report.md` (fotografia del ciclo precedente, non aggiornato da questo addendum).
- Supabase: https://supabase.com/docs/guides/auth/signout
