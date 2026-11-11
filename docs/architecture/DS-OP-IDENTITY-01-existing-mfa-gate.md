# DS-OP-IDENTITY-01 — Integrazione con gate MFA esistente
Data: 2026-11-11
Stato: VERIFICA DOCUMENTALE; NO-GO ENDPOINT

## Evidenza Staging
public.is_active_super_admin(p_user_id uuid) verifica security.admin_members: role=super_admin, active=true, revoked_at IS NULL.
public.is_active_super_admin_session(p_user_id uuid,p_session_id uuid) è SECURITY DEFINER, search_path='', verifica auth.sessions con s.id=p_session_id, s.user_id=p_user_id, s.aal='aal2', sessione non scaduta, membro super_admin attivo non revocato.

## Integrazione raccomandata
- Riutilizzare il gate esistente solo dopo avere verificato che user_id e session_id siano estratti da una sessione Supabase Auth validata lato server.
- Non fidarsi di UUID passati dal client per l'autorizzazione.
- Non aggiungere la funzione di collegamento business account alla route legacy.
- RPC di collegamento rimane limitata a service_role.
- L'account membership non conferisce automaticamente accesso alle esperienze di tutti gli operatori.
- Eseguire audit dei privilegi EXECUTE della funzione MFA e delle chiamate server prima dell'attivazione.

## QA richiesto
JWT reale aal2; sessione aal1; sessione scaduta; revoca admin; sessione altrui; utente non admin; owner cross-account; doppia associazione; race conditions; audit.
