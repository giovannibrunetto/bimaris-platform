# BIMARIS — DT16 | Triage degli avvisi di sicurezza Supabase
Data: 18 novembre 2026
Stato: REVIEW ONLY / nessuna modifica ai permessi, a Supabase Auth, alle configurazioni Vercel o al sito pubblico.

## Evidenze verificate
1. PR #58 al commit `b2e50f7f54825795d4619ee3f714c282e497a2fd`: GitHub Actions run `44266904668`, stato `completed`, conclusione **success**; PR tuttora **draft / open / not merged**.
2. Security Advisor Staging: 20 segnalazioni `rls_enabled_no_policy` (INFO), una `authenticated_security_definer_function_executable` (WARN), una `auth_leaked_password_protection` (WARN).
3. Security Advisor Production: 5 segnalazioni `rls_enabled_no_policy` (INFO), una `auth_leaked_password_protection` (WARN). Non risulta, in questo risultato, l'avviso relativo alla funzione presente solo su Staging.
4. Funzione Staging `public.my_business_accounts()`: SQL STABLE SECURITY DEFINER, proprietario `postgres`, `SET search_path=''`; eseguibile da `authenticated` e `service_role` ma non da `anon`. Restituisce `account_id`, `display_name` e `membership_role` tramite join tra `public.business_account_memberships` e `public.business_accounts`, filtrando `m.user_id=(SELECT auth.uid())`.
5. La query usa un filtro per utente, ma esegue con privilegi del proprietario: è necessario verificare che le tabelle e le relazioni non consentano di alterare le associazioni da parte di soggetti non autorizzati, e controllare la semantica con JWT validi e invalidi. Una revisione solo statica **non certifica** assenza di vulnerabilità.
6. L'assenza di policy RLS può essere una scelta restrittiva per tabelle interne: non inserire indiscriminatamente policy permissive per eliminare gli avvisi INFO.

## Azioni proposte
- **P1** Staging: ricostruire l'uso effettivo di `my_business_accounts()` nell'Area Operatore, verificare ownership, grant sulle tabelle, scrittura delle membership, casi multi-tenant e test con due utenze sintetiche distinte. Non revocare `EXECUTE` senza collaudo di regressione.
- **P1** Staging e Production: verificare fattibilità e impatti della protezione Supabase Auth contro password compromesse (HIBP) sul piano e sul login; predisporre successiva modifica in ambiente appropriato, con GO separato e test degli accessi. Non confonderla con la password del database PostgreSQL.
- **P2** Valutare caso per caso le tabelle RLS senza policy, distinguendo chiusura intenzionale e possibile blocco funzionale; nessuna policy allargata senza specifiche.
- **P0 pre-release survey**: chiudere i requisiti già bloccanti relativi a backup/restore, privacy e DPA, migrazione V8, gestione consensi, prova completa dell'invio e isolamento del progetto survey. Le avvertenze generali dell'Area Operatore non autorizzano il merge della PR.

## Riferimenti
- Linter Supabase per SECURITY DEFINER: https://supabase.com/docs/guides/database/database-linter?lint=0029_authenticated_security_definer_function_executable
- Protezione password: https://supabase.com/docs/guides/auth/password-security#password-strength-and-leaked-password-protection
- RLS senza policy: https://supabase.com/docs/guides/database/database-linter?lint=0008_rls_enabled_no_policy

**Decisione:** nessuna modifica alle autorizzazioni finché non esiste un collaudo di regressione. Sito principale BIMARIS con protezione SSO invariata, questionario non pubblico, raccolta reale disattivata.
