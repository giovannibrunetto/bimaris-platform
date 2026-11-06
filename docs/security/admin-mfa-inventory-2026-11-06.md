# BIMARIS — MFA-01 Inventario superfici amministrative
Data 2026-11-06 | Branch feature/admin-individual-mfa | Stato: inventario strutturale verificato, audit per singola route ancora da completare.

## Risultato
Git tree ricorsivo non troncato: 17 pagine app/admin/**/page.tsx (inclusa pagina login) e 12 API app/api/admin/**/route.ts (incluse login/logout). Presente layout amministrativo condiviso.

## Pagine (17)
- /admin
- /admin/login
- /admin/analytics
- /admin/candidature
- /admin/candidature/[id]
- /admin/esperienze
- /admin/esperienze/[id]
- /admin/esperienze/[id]/revisione
- /admin/esperienze/nuova
- /admin/eventi
- /admin/itinerari
- /admin/operatori
- /admin/operatori/[id]
- /admin/operatori/[id]/revisioni-profilo
- /admin/operatori/accessi
- /admin/revisione-esperienza
- /admin/revisioni-esperienze

## API (12)
- /api/admin/applications
- /api/admin/events/[id]/status
- /api/admin/experience-revisions
- /api/admin/experiences/[id]/collaboration
- /api/admin/experiences/create
- /api/admin/experiences
- /api/admin/itineraries
- /api/admin/login
- /api/admin/logout
- /api/admin/operator-memberships
- /api/admin/operator-revisions
- /api/admin/operators

## Rischi verificati
- admin-auth.ts: un solo segreto password e un solo segreto TOTP, cookie sessione non legato a identità.
- /api/admin/operators e /api/admin/applications: autorizzazione legacy con isAdminAuthenticated; uso del client con service role.
- /admin/layout.tsx: controllo legacy; il layout non deve essere l'unico gate per route/API.
- /proxy.ts: gestisce modalità prelaunch, NON autorizzazione amministrativa.
- lib/supabase/user-server.ts: esiste un client SSR Supabase per utenti, riutilizzabile solo dopo audit dei cookie e delle sessioni.

## Priorità operative
P0: verificare tutte le 12 API e 17 pagine per controlli server-side, anche richiami privilegiati fuori namespace admin; definire tabella/metadata ruoli.
P1: realizzare helper unico requireSuperAdmin con verifica utente, allowlist e AAL2; fail closed.
P1: sostituire in maniera coordinata gate delle route e pagine; impedire bypass legacy.
P1: realizzare login Supabase, enrollment/challenge TOTP e gestione recovery.
P2: test sicurezza e regressione, build/typecheck, prova con due dispositivi e due account.
Nessun cambiamento DB, auth, produzione o deploy in questo inventario.
