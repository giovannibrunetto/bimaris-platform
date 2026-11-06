# DS-MFA-01/C — Registro esecuzione B1–B4 (6 novembre 2026)

Stato: implementazione tecnica parziale sul branch `feature/admin-individual-mfa`. Nessun deployment, nessun account personale, nessun cambiamento a Production.

## B1 — ESEGUITO E VERIFICATO SU STAGING
- Migration: `supabase/migrations/20261106_ds_mfa_01_b1_private_admin_roles.sql`
- Supabase target verificato: `nzdeoimwikhoidtladnu` (BIMARIS Staging), distinto da Production `vhvccwvcqdhiovpopsze`.
- Creazione `security.admin_members`, RLS abilitata, nessuna membership inserita.
- RPC `public.is_active_super_admin(uuid)`: solo `service_role` EXECUTE; `anon` e `authenticated` negati.
- Verifica SQL post-migrazione: tabella presente, 0 admin, ruoli pubblici senza USAGE sullo schema e senza EXECUTE sulla RPC.
- Rollback SQL presente in testa alla migration; eseguibile solo previa verifica delle dipendenze e senza account/membership.
- Nota: la funzione invoker deve essere verificata anche mediante chiamata RPC effettiva con chiave di servizio in un ambiente di test, non soltanto tramite metadati SQL.

## B2 — IN CORSO
- `apps/web/lib/admin-mfa-guard.ts` usa RPC con client service-role e verifica `auth.getUser()`, AAL2, ruolo attivo.
- Mancano verifica sessione revocata (JWT ancora valido), prove runtime, integrazione completa e audit log.
- Non considerare il guard operativo.

## B3 — NON ESEGUITO
- 12 API admin e 17 pagine admin censite, ancora protette dal legacy.
- Implementare un adapter transitorio documentato e poi rimuovere il legacy solo su successivo mandato B8.
- Conservare distinzione approvazione/pubblicazione.

## B4 — PARZIALE, NON ATTIVATO
- `apps/web/lib/api-rate-limit.ts` legge prima `BIMARIS_RATE_LIMIT_HMAC_SECRET`, poi temporaneamente `BIMARIS_ADMIN_PASSWORD`.
- La variabile dedicata non è stata configurata, né generata; fallback legacy ancora presente.
- Prima dell'attivazione: verificare scope Preview/staging, rotazione e impatto sulla finestra rate-limit, test contatti/candidature/login, fail-closed senza segreto e senza DB.
- Rimuovere fallback solo dopo prova effettiva con chiave dedicata. Non disattivare password admin senza mandato B8.

## Criteri di arresto
- Nessuna modifica a produzione.
- Nessun deployment senza verifica target e rollback.
- Nessun account personale o MFA TOTP.
- Nessuna dichiarazione PASS per test non eseguiti.
- Se il runtime non riesce a consultare il ruolo in schema privato, fermarsi e correggere prima di integrare le superfici.

## Prossimi passi autorizzati
1. Validare l'accesso RPC a Staging tramite test controllato senza account personali.
2. Progettare revoca sessioni server-side verificabile.
3. Integrare B2/B3 senza interrompere l'accesso legacy in attesa di B8.
4. Configurare segreto rate-limit solo in Preview/Staging, poi testare e rimuovere il fallback.
5. Consegnare rapporto intermedio con commit e prove reali.
