# BIMARIS — DT16 | Audit isolamento account aziendali e membership
Data: 18 novembre 2026
Stato: REVIEW ONLY — nessuna modifica a DB, policy, branch principali o deployment. Test multi-tenant con due sessioni ancora richiesto.

## Ambito
Verifica cataloghi PostgreSQL su Supabase **Staging** `nzdeoimwikhoidtladnu` e definizioni di funzioni collegate a `business_accounts` e `business_account_memberships`, senza acquisire identità o dati personali.
Production non toccata.

## Evidenze verificate
1. Le tabelle `public.business_accounts` e `public.business_account_memberships` hanno RLS **attiva**; `FORCE RLS` non attivo, proprietario `postgres`. Non sono presenti policy su queste due tabelle: nel contesto corrente funzionano da barriera per accessi diretti non privilegiati.
2. Per `authenticated` risultano **false** le verifiche `has_table_privilege` su SELECT, INSERT, UPDATE, DELETE delle membership, nonché SELECT e UPDATE degli account. Anche il catalogo dei grant espliciti non evidenzia privilegi `anon` o `authenticated`; i privilegi pieni rilevati sono attribuiti a `service_role`.
3. `public.my_business_accounts()` è `SECURITY DEFINER`, owner `postgres`, richiamabile da `authenticated` e `service_role`, non da `anon`. Effettua la join account/membership e il filtro `m.user_id=(SELECT auth.uid())` prima di restituire `account_id`, `display_name`, `membership_role`.
4. `public.link_operator_to_business_account(p_operator_id,p_account_id,p_owner_user_id)` è `SECURITY DEFINER` e richiamabile da `service_role`, **non** da `anon` o `authenticated`. Il codice verifica `auth.role()='service_role'`, l'esistenza di entrambe le membership `owner` (account aziendale e operatore) per lo stesso `p_owner_user_id`; aggiorna solo operatori non collegati ad altro account.
5. Vincoli `business_account_memberships`: PK `(account_id,user_id)`, FK verso `business_accounts(id)` e `auth.users(id)` con ON DELETE CASCADE, CHECK `role IN ('owner','manager','viewer')`.
6. Entrambe le tabelle risultano **vuote al controllo**: zero account aziendali e zero membership. Non vi sono coppie di account test da confrontare.
7. Il Security Advisor avverte della richiamabilità della funzione `SECURITY DEFINER` da `authenticated`. L'uso di `auth.uid()` è una mitigazione rilevante, **non una prova dinamica** di isolamento multi-tenant o di assenza di escalation.
8. La funzione `link_operator_to_business_account` utilizza `auth.role()`, API dichiarata deprecata nella documentazione recente Supabase. Non alterarla automaticamente: richiede studio della semantica con token `service_role` e regressione del flusso operatore.

## Valutazione
- **PASS statico limitato**: i ruoli anonimo/autenticato non possono leggere o modificare direttamente le membership secondo i grant controllati; `my_business_accounts()` filtra per identità; il collegamento privilegiato controlla le doppie ownership.
- **HOLD / NON CERTIFICATO**: isolamento A/B end-to-end, integrità del flusso che *crea* le membership, esposizione indiretta tramite altre RPC, cross-tenant tramite percorsi server-side e comportamento in presenza di membership reali.
- L'assenza di policy RLS è compatibile con tabelle intenzionalmente non accessibili direttamente; non creare policy permissive per risolvere il solo avviso del linter.

## Collaudi successivi consentiti soltanto in ambiente di prova autorizzato
1. Creare due account aziendali e due identità **sintetiche distinte** in ambiente isolato con pulizia documentata; non creare utenti reali.
2. Verificare che utente A veda con `my_business_accounts()` solo membership A e utente B solo B; sessione anonima deve ottenere deny; token alterato/non valido deny.
3. Tentare letture e modifiche dirette tra account mediante privilegi di client e documentare il rifiuto.
4. Verificare che `link_operator_to_business_account` rifiuti chiamanti non privilegiati, ownership incrociata A/B e collegamenti ripetuti.
5. Controllare le API server-side che invocano la funzione privilegiata e la procedura di onboarding che popola le membership, con ricostruzione della catena di autorizzazione.
6. Solo dopo collaudo: decisione separata se mantenere `SECURITY DEFINER` con controllo esplicito o migrare ad altro modello, senza regressioni sull'Area Operatore.

## Gate
**Non autorizzati:** DDL, inserimento/cancellazione utenti, modifiche di grant, merge PR #58, apertura sito o raccolta reale.
**Resta obbligatorio:** SSO sul progetto BIMARIS principale e distinzione Staging/Production. L'audit degli account aziendali non equivale al GO privacy/questionario.
