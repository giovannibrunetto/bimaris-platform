# BIMARIS — Piano tecnico accessi amministrativi individuali e MFA
Data: 2026-11-06 | Ambiente: staging | Stato: progettazione, nessuna migrazione autorizzata in produzione

## Decisione
Due Super Admin con pari privilegi, identità distinte e fattori TOTP individuali. Non riutilizzare BIMARIS_ADMIN_TOTP_SECRET come fattore condiviso.

## Evidenze da staging
- apps/web/lib/admin-auth.ts: password e segreto TOTP globali, sessione HMAC non associata a user_id.
- apps/web/app/api/admin/login/route.ts: controllo password globale e TOTP condizionale.
- apps/web/app/api/admin/operators/route.ts: isAdminAuthenticated() precede chiamate con service client.
- apps/web/lib/supabase/server.ts: createServiceClient() usa chiave privilegiata.
- Supabase staging: tabella public.profiles esistente ma vuota al controllo; non emerge una tabella amministratori dedicata.
- Supabase Auth documenta enroll/challenge/verify, listFactors e livello AAL2.

## Architettura proposta (da implementare solo con revisione e test)
1. Identità: due utenti distinti in Supabase Auth staging, credenziali individuali; non salvare password o seed TOTP in repository o chat.
2. Ruolo: allowlist server-side basata su auth.users.id in tabella privata di amministrazione (o app_metadata gestito esclusivamente lato server), ruolo super_admin per entrambi. Mai user_metadata come fonte di autorizzazione.
3. Sessione: Supabase Auth SSR con cookie protetti; ogni pagina e route amministrativa verifica user autenticato, ruolo e assurance level AAL2, prima di ogni chiamata con service role.
4. MFA: enroll TOTP per singolo utente; verify challenge; gestione fattori e recupero con procedura amministrativa verificata. Evitare bypass permanenti per enrollment.
5. API: censire tutte le route /api/admin/** e tutte le pagine /admin/**; sostituire i controlli legacy in modo atomico e testato. Proteggere azioni privilegiate e CSRF/origin.
6. Migrazione: preparare su branch isolato, testare in preview collegata a staging, verificare tutti gli endpoint; passaggio con rollback documentato, senza lasciare il vecchio cookie come accesso alternativo.
7. Audit: loggare ID amministratore, azione, timestamp e oggetto, senza registrare password, seed, codici o token.
8. Recupero: processo di reset MFA con verifica dell'identità, notifica all'altro Super Admin, revoca sessioni e registro eventi. Non mostrare codici di recupero in chat.

## Test obbligatori
- Giovanni: password + TOTP sul tablet Brave con Authenticator smartphone; accesso AAL2.
- Jessica: account e TOTP indipendenti sui propri dispositivi; pari privilegi.
- OTP di Giovanni non valido per Jessica; OTP errato/scaduto negato.
- Utente ordinario, AAL1, sessione scaduta, logout e accesso diretto API respinti.
- Revoca fattore/sessione di un admin non impatta l'altro.
- Verifica regressione gestione operatori, eventi, esperienze, pubblicazioni.
- Build, typecheck e test su staging PASS prima di qualunque promozione.

## Vincoli
Nessun intervento sulla produzione, nessuna creazione di credenziali condivise, nessuna modifica al database fino a revisione schema e autorizzazione operativa. Il sistema legacy rimane temporaneamente invariato in staging; non attivare il segreto TOTP globale come soluzione finale.
