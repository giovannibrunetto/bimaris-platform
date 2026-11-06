# DS-MFA-01/D — Rapporto di collaudo integrato (apertura)

**Mandato:** Direzione Strategica BIMARIS, 6 novembre 2026 — GO collaudo controllato.
**Stato:** IN CORSO — non è un rapporto conclusivo.
**Ambiente autorizzato:** Supabase `nzdeoimwikhoidtladnu` (BIMARIS Staging); Vercel Preview branch `feature/admin-individual-mfa`.
**Ambiente escluso:** Supabase `vhvccwvcqdhiovpopsze` (BIMARIS Production); Vercel Production.

## Verifiche preliminari
- Supabase API get_project: Staging `nzdeoimwikhoidtladnu` ACTIVE_HEALTHY, Production `vhvccwvcqdhiovpopsze` distinto. Nessuna operazione su Production.
- Preview commit `adfbc34`: deployment `dpl_h4rVmnvx5Cmk6vNack1FtMdarnHJ` READY, build smoke session-aware RPC PASS.
- Staging: tre sessioni esistenti, nessuna AAL2 e nessun amministratore individuale attivo all'ultima ispezione. Non sono stati letti identificativi personali nei report.
- Security Advisor Staging: avviso preesistente `auth_leaked_password_protection` (WARN); `security.admin_members` RLS attivo senza policy (INFO), coerente con accesso esclusivo service-role. Nessuna impostazione cambiata.

## Matrice obbligatoria
| ID | Condizione | Atteso | Osservato | Esito |
|---|---|---|---|---|
| D-01 | Nessuna autenticazione | Negato | Test pagina anonima precedente; non rieseguito nel nuovo ciclo | NON ESEGUITO |
| D-02 | Identità Auth ordinaria senza ruolo | Negato | Nessuna identità fittizia predisposta | NON ESEGUITO |
| D-03 | Super Admin senza AAL2 | Negato | Non testato con identità fittizia | NON ESEGUITO |
| D-04 | Super Admin AAL2 e ruolo attivo | Consentito | Non testato | NON ESEGUITO |
| D-05 | Ruolo revocato, sessione ancora attiva | Negato alla successiva operazione | Non testato | NON ESEGUITO |
| D-06 | Logout della sessione | Nessuna successiva operazione privilegiata | Non testato | NON ESEGUITO |
| D-07 | Sessione revocata, JWT preesistente | Negato anche con token residuo | Non testato | NON ESEGUITO |
| D-08 | Account tecnico disabilitato | Negato | Non testato | NON ESEGUITO |
| D-09 | API amministrativa diretta | Guard server-side applicato | Non testato con identità fittizia | NON ESEGUITO |

## Dipendenza operativa per il collaudo
Gli strumenti Supabase collegati in questa sessione espongono SQL, progetti, log e advisor, **non** le operazioni Supabase Auth Admin `createUser`, `deleteUser`, login e enrollment/challenge TOTP. Non creare account inserendo righe direttamente in `auth.users` o `auth.mfa_factors`: sarebbe una simulazione non rappresentativa e potenzialmente distruttiva.

Per avviare D-02–D-09 serve un canale ufficiale Supabase Auth (dashboard Staging o client di collaudo autenticato) che possa creare l'utente fittizio, eseguire MFA e cancellare l'account. Nessun segreto/password/TOTP deve essere copiato nel rapporto o nella chat.

## Regole di arresto
Interrompere su accesso non autorizzato, revoca inefficace, esposizione di credenziali, differenza di progetto o richiesta di modifiche strutturali fuori mandato. Non alterare la modalità prelaunch o il sistema legacy.

## Chiusura
**NON CHIUSO.** Nessun account di prova creato e nessuna pulizia dichiarata. Production NO-GO.
