# BIMARIS — DT16 | Disegno profilo aziendale unico per Partita IVA
Data: 18 novembre 2026
Stato: REVIEW ONLY / proposta tecnica — nessuna modifica DDL/DML, auth, API, Vercel, branch principali, Production o raccolta reale.

## Decisione commerciale da preservare
**Un'unica identità/profilo operatore e una sola posizione commerciale per la stessa P.IVA**, con attività, proposte ed esperienze aggregate sotto tale posizione. Non dedurre che ogni scheda editoriale `operators` debba obbligatoriamente rappresentare una distinta impresa o un distinto abbonamento. Il modello di fatturazione definitivo e le eccezioni devono essere ratificati dalla Direzione Strategica.

## Riscontri verificati da Supabase Staging
- `public.operators` contiene `vat_number` nullable e `business_account_id` nullable, con FK `business_account_id -> public.business_accounts(id)` e `ON DELETE RESTRICT`. È presente un indice **non univoco** su `business_account_id`.
- `public.business_accounts`: `id`, `display_name`, `created_at`; non contiene attualmente `vat_number` né una chiave fiscale univoca.
- `public.business_account_memberships`: PK `(account_id,user_id)`, relazione verso `auth.users`, ruolo `owner|manager|viewer`. La PK impedisce due membership dello stesso utente sullo stesso account, **non** due account distinti per la stessa P.IVA.
- `public.operator_memberships`: PK `(operator_id,user_id)`. La sua appartenenza è distinta dall'account aziendale.
- `public.operator_applications` ha `vat_number` nullable e `operator_id` nullable dopo accettazione. Il flusso RPC `accept_operator_application` genera l'operatore, senza creare account aziendale.
- Non è emerso alcun indice univoco per partita IVA sulle tabelle controllate.
- Conteggi Staging al controllo: 4 operatori, 0 operatori con P.IVA valorizzata, 0 operatori collegati a business account, 0 account e 0 membership aziendali. Nessun dato identificativo letto.

## Modello logico proposto
`business_accounts` diventa la radice **commerciale**, collegata a un'identità fiscale verificata e normalizzata. Ogni account può essere associato a più operatori/schede editoriali quando la struttura del prodotto lo richieda; i diritti di accesso derivano dalle appartenenze aziendali, con separazione delle singole attività. Il prezzo/piano deve essere collegato alla posizione commerciale, non moltiplicato automaticamente dal numero di schede o esperienze.

```text
Partita IVA verificata (identità fiscale per soggetto e giurisdizione)
    └─ Business account unico (titolare posizione commerciale)
        ├─ Member owner / manager / viewer (con verifica autorizzazione)
        ├─ Operatore / attività A
        │   └─ Esperienze e appuntamenti
        └─ Eventuali ulteriori attività/schede della stessa impresa
            └─ Esperienze e appuntamenti
```

## Decisioni ancora necessarie prima dello schema
1. **Identità fiscale:** specificare giurisdizione, validazione e normalizzazione delle P.IVA, evitando collisioni tra paesi e formati differenti. Non assumere che tutte le attività abbiano P.IVA o che il dato sia sempre disponibile alla candidatura.
2. **Assenza P.IVA:** prevedere stato `verification_pending` / gestione manuale e vietare la creazione automatica di un account commerciale definitivo senza un identificatore affidabile. Definire casi di enti senza P.IVA con identità alternativa verificabile.
3. **Doppioni:** su candidata P.IVA già associata, aprire revisione amministrativa; mai assegnare automaticamente un account esistente sulla sola dichiarazione della P.IVA, per rischio presa di controllo.
4. **Ruoli:** account owner assegnato solo dopo verifica titolarità. Aggiunta di manager/viewer tramite processo approvato, senza accesso a business account di terzi.
5. **Abbonamenti:** una posizione contrattuale e un piano per account verificato, salvo eccezione esplicitamente approvata; nessun invio di fatture o attivazione pagamento con la presente proposta.
6. **Migrazione:** gli operatori correnti senza P.IVA/collegamento devono restare funzionanti, senza backfill fittizio. Verificare prima di ogni DDL la compatibilità con onboarding, revisioni e Area Operatore.

## Sequenza futura di implementazione (non autorizzata)
1. Concordare modello e documentare decisione strategica.
2. Predisporre migrazione reversibile: identità fiscale normalizzata, UNIQUE scoped alla giurisdizione e ai soli dati verificati, tracciamento di verifica e legame con `business_accounts`, senza esporre P.IVA nei client non autorizzati.
3. Creazione/associazione atomica di account e membership verificata: utilizzare transazioni e protezione anti-race, senza mai fidarsi di `user_id` o `account_id` forniti direttamente da un client senza verifica identità e ownership server-side.
4. Raccordare in modo idempotente `operator_applications` -> `operators` -> `business_accounts`, compresi rifiuti e retry inviti falliti.
5. Collaudo multi-tenant A/B: stessa P.IVA dichiarata da soggetto non autorizzato deve essere sospesa, mai collegata; attività multipla stessa impresa senza nuovo abbonamento; differenti P.IVA separate; tentativi concorrenti senza account duplicati.
6. Riesame sicurezza Supabase RLS e RPC, regressione accessi, QA in Staging, backup/restore e GO distinti per Production.

## Casi di accettazione minimi
- Stessa P.IVA verificata -> una sola identità fiscale/posizione commerciale; aggiunta attività autorizzata non crea un nuovo abbonamento.
- Seconda candidatura con stessa P.IVA ma identità non verificata -> in valutazione, senza accesso a dati dell'account esistente.
- Due utenti di imprese differenti -> divieto di lettura/scrittura incrociata.
- Invito o email falliti dopo l'approvazione -> stato recuperabile senza duplicare operatore e account.
- P.IVA assente o invalida -> nessuna unificazione automatica o attribuzione arbitraria.
- Legacy operators non collegati -> nessuna perdita di schede/dati durante migrazione e rollback.

**Gate:** HOLD su tutte le modifiche a schema e permessi; PR #58 resta DRAFT, nessun merge o deployment. Il progetto principale BIMARIS resta protetto da SSO; il questionario reale rimane disattivato.
