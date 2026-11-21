# DS-MFA-01/D-INT02 — Rapporto conclusivo di sicurezza e pulizia

**Data:** 7 novembre 2026  
**Mandante:** Direzione Strategica BIMARIS  
**Perimetro:** branch `feature/admin-individual-mfa`; Supabase Staging `nzdeoimwikhoidtladnu`; Vercel Preview.  
**Production:** NO-GO.

## 1. Esito
**Pulizia dell'identità tecnica: PASS, verificata tramite query diretta su Staging.**  
**Collaudo sicurezza: PARZIALE, con D-07 riutilizzo token pre-revoca NON ESEGUITO.** Non è autorizzabile un rilascio Production sulla base di queste sole evidenze.

## 2. Matrice consolidata D-INT02
| Prova | Osservazione | Esito |
|---|---|---|
| D-09 anonimo | POST API admin, 303 verso `/admin/login` | PASS |
| D-09 utente ordinario AAL1 | POST API admin, 303 verso `/admin/login` | PASS |
| D-03 Super Admin AAL1 | Ruolo attivo, POST API admin, 303 verso `/admin/login` | PASS |
| D-09 Super Admin AAL2 | TOTP verificato; POST payload invalido, 303 verso `/admin/operatori/?state=invalid`, guard superato, nessuna mutazione dimostrata | PASS (guard) |
| D-07 revoca ruolo | Con stessa sessione AAL2, dopo revoca ruolo POST 303 verso `/admin/login` | PASS |
| D-07 RPC post-revoca | Sessione AAL2 presente; `is_active_super_admin_session` = false | PASS |
| D-07 revoca sessione con riutilizzo JWT pre-revoca | Non eseguita richiesta con lo stesso token/cookie dopo revoca Auth | NON ESEGUITO |
| Pulizia identità fittizia | Eliminazione tramite Dashboard Auth Staging, poi verifica SQL dei residui | PASS |

## 3. Sequenza finale di pulizia
Identità fittizia `mfa-int02-collaudo@bimaris.invalid`, ID `50dacba2-8ffc-438f-b610-635796b9f492`. Prima della pulizia: ruolo `super_admin` già revocato; sessione AAL2 presente; 2 record refresh token; 1 fattore MFA. L'utente è stato temporaneamente bannato tramite Dashboard Auth, quindi eliminato dalla stessa Dashboard. Il ban non è stato interpretato come prova di revoca immediata del JWT.

Query finale su Staging:
| Oggetto associato all'identità tecnica | Conteggio |
|---|---:|
| `auth.users` (ID o email) | 0 |
| `auth.sessions` | 0 |
| `auth.refresh_tokens` | 0 |
| `auth.mfa_factors` | 0 |
| `security.admin_members` | 0 |
| Membership attive e non revocate | 0 |

**Pulizia completa per l'identità tecnica: verificata.** La cancellazione Auth è stata effettuata con interfaccia ufficiale; nessuna modifica SQL diretta alle tabelle interne Auth.

## 4. Limiti e rischi
- Il JWT precedentemente emesso non è stato conservato e riprodotto dopo la revoca effettiva della sessione; pertanto non è dimostrata la negazione runtime in tale condizione.
- La rimozione dei record Auth e il rifiuto dopo revoca ruolo non sostituiscono il test del JWT pre-revoca.
- La documentazione Supabase indica che gli access token possono rimanere validi fino alla scadenza; il guard BIMARIS usa anche una RPC session-aware, ma il comportamento dopo revoca Auth non è stato provato con replay.
- Il percorso amministrativo legacy resta disponibile: l'MFA individuale non è ancora obbligatoria per tutti gli accessi.

## 5. Raccomandazione
Acquisire la chiusura **amministrativa e di pulizia** di D-INT02, ma non certificare il completamento integrale dei requisiti di sicurezza. Se il requisito D-07 rimane condizione obbligatoria di rilascio, predisporre un successivo test controllato con un'identità fittizia nuova, preservando in memoria volatile il token pre-revoca e riproducendo il trasporto SSR effettivo dopo revoca Auth; richiedere autorizzazione specifica prima di eventuali modifiche tecniche. Nessuna implementazione o rilascio autorizzato da questo rapporto.

**Production: NO-GO.**
