# BIMARIS — Account aziendale e attività operative (DS-OP-IDENTITY-01)
Data: 2026-11-11
Stato: PROPOSTA TECNICA — NON APPLICATA AL DATABASE
Ambito: Staging, PR #39; nessun merge Production.

## Esito ricognizione
- public.operators: profilo operatore attuale, UUID e codice BIM-OP, partita IVA, dati pubblici.
- public.experiences.operator_id: FK verso operators.id (ON DELETE SET NULL).
- public.operator_memberships: chiave (operator_id,user_id), ruoli owner/manager/editor/viewer.
- public.operator_applications.operator_id: collegamento alla scheda approvata.
- Non esiste attualmente un livello autonomo per l'account aziendale.

## Modello target
1. legal_entities: id UUID, country, vat_number nullable, fiscal_identity_verified_at nullable; dati fiscali privati. Non imporre unicità globale su VAT nullable senza gestire paesi e identificativi diversi.
2. business_accounts: id UUID, legal_entity_id nullable, codice stabile BIM-ACC, stato amministrativo. Un account aziendale può raggruppare più attività operative.
3. business_account_memberships: (account_id,user_id) PK, role e invito/accettazione; autorizzazione verificata server-side, non per email.
4. operators: conservare id UUID e operator_code BIM-OP; aggiungere business_account_id nullable FK. Ogni record rappresenta una attività operativa/scheda pubblica distinta.
5. experiences: mantenere operator_id invariato. Le esperienze appartengono a una attività, non direttamente all'account fiscale.
6. operator_applications: mantenere storicità e operator_id; associare in seguito account_id con workflow di claim verificato.

## Regole di identità
- Email: recapito e possibile login, non chiave univoca aziendale.
- Partita IVA: attributo del soggetto fiscale, non chiave univoca di una attività/sede.
- BIM-ACC: identificativo stabile dell'account aziendale; BIM-OP: identificativo stabile dell'attività.
- Candidatura ripetuta per la stessa attività: revisione/blocco motivato; nuove esperienze: solo Area Operatore.
- Attività distinte possono condividere email, referente e partita IVA.
- Evitare accorpamenti automatici di profili preesistenti basati soltanto su email o partita IVA.

## Migrazione proposta (non eseguita)
A. Inventario e audit di RLS, funzioni SECURITY DEFINER, route Area Operatore, import/editoriale e analytics.
B. Creare tabelle private/adeguatamente protette e FK nullable; non alterare le FK experiences/operator_memberships.
C. Backfill: un account aziendale provvisorio per ciascun operatore; nessun merge automatico.
D. Collegare operatori allo stesso account solo dopo verifica amministrativa del controllo del soggetto.
E. Introdurre account memberships, autorizzazioni server-side e collaudi di isolamento cross-account.
F. Adattare wizard, inviti, candidature, dashboard e aggregazione analytics; mantenere schede pubbliche distinte.
G. QA regressione: operatori singoli, multi-attività, stesso referente, stessa VAT, VAT assente, operatori fittizi, accesso negato ad account terzi.
H. Valutare vincoli NOT NULL e rimozione ridondanze solo dopo stabilizzazione e autorizzazione separata.

## Rischi e gate
- RLS/privilegi: non derivare autorizzazioni dall'email o da dati client.
- SECURITY DEFINER: verificare EXECUTE, search_path e autorizzazione del chiamante.
- Collisioni/duplicati: controlli atomici e strategia per dati legacy; evitare vincoli email unici.
- Production: NO-GO fino a QA e decisione esplicita.
