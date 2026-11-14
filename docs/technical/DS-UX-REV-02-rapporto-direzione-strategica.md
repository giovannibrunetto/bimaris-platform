# DS-UX-REV-02 — Rapporto di esecuzione tecnica

**Data:** 13 novembre 2026  
**PR:** #54 DRAFT, branch `integration/ds-clean-01-candidate-20261113`  
**Stato:** CORRETTIVO REVISIONI IMPLEMENTATO — CI PASS — COLLAUDO AUTENTICATO DA CHIUDERE — HOLD MERGE/PRODUCTION

## 1. Correttivo P0 «Proponi modifica»

La schermata mostrata dall'utente riportava «Hai già una modifica in revisione per questa esperienza» in corrispondenza del caso QA 037. La verifica Staging ha confermato una revisione `pending` per QA 037; non si tratta di una bozza riapribile. Altre esperienze approvate conservano revisioni `draft`, mentre `applied` è uno stato storico.

**Implementato nella PR:**
- Lettura degli stati attivi per `operator_id`: `draft`, `pending`, `rejected`, `approved` (stato legacy).
- Rendering per esperienza: `pending` → «Modifica in valutazione» (nessuna seconda proposta); `approved` → «Modifica già approvata»; `draft`/`rejected` → «Riprendi modifica»; senza proposta attiva → «Proponi modifica».
- I pulsanti attendono il completamento della lettura degli stati (fail-closed se la query fallisce).
- Il comando ripete una lettura autorizzata e circoscritta a `experience_id` + `operator_id` prima di aprire o creare: non si fida della sola indicazione grafica.
- Le revisioni `applied` restano storiche e non bloccano una proposta nuova.
- Errore visibile quando l'apertura non riesce; etichetta di attesa soltanto sulla card selezionata.
- Caricamento della galleria della revisione fallisce esplicitamente se la query o la firma di una fotografia privata non riescono, evitando liste di immagini incomplete.
- Nessuna cancellazione/alterazione dei record Staging.

**Vincolo DB verificato in sola lettura:** indice parziale univoco `experience_revisions_one_active_per_experience` su `experience_id`, per gli stati `draft,pending,rejected,approved`. L'indice impedisce duplicazioni concorrenti attive.

## 2. Collaborazioni

L'endpoint esistente di invito/revoca è limitato ai casi `draft` o `rejected` dell'esperienza e non può modificare accordi di esperienze approvate. La PR conserva i partner esistenti e il percorso amministrativo rifiuta le proposte di sostituzione non supportate, evitando applicazioni implicite.

**P0 ancora aperto:** per completare proposta di sostituzione, consenso partner verificabile, audit, revoca, e applicazione atomica serve una modifica schema/transaction RPC distinta. La Direzione Strategica ha escluso nuove migrazioni e privilegi nell'attuale GO: non sono state create tabelle né alterati permessi. Il disegno tecnico preparatorio è in `docs/technical/DS-UX-REV-02-partner-consent-gate.md`. Richiesto GO separato prima dell'implementazione end-to-end.

## 3. Collaudi ed evidenze

- Ultimo commit di sviluppo correttivo: `6e697164d82b50fcebc1ca7506211068a9d2fd9d`.
- GitHub `validate`: PASS.
- GitHub `isolated-taxonomy`: PASS, incluso il test sulla definizione RPC Staging con fixtures usa-e-getta e rollback.
- Vercel Preview: READY, alias `bimaris-platform-git-integration-7435f3-giovannibrunetto84-1508.vercel.app`.
- Supabase Staging: la migrazione già autorizzata `ds_ux_rev_01_staging_taxonomy_atomic_pilot` rimane installata, nessuna migrazione ulteriore.
- Verifica di stato e vincoli su database reale: sola lettura.
- Non dichiarati PASS: apertura con utente autenticato, ripresa bozza reale, consenso partner, approvazione admin e QA responsive delle aree operative.

## 4. Residui e condizioni di integrazione

**P0:** prova browser autenticata dell'apertura `draft/rejected`, della card `pending`, di interessi/attività/foto e del flusso di approvazione admin su dati QA autorizzati.

**P0:** sostituzione partner e consenso, bloccati per mancanza dell'autorizzazione a un nuovo percorso persistente e transazionale.

**P1:** QA responsive alle risoluzioni previste (360/390/430/768/1280/1440) dopo i correttivi.

**HOLD:** merge PR #54, nuove migrazioni, Production, MAI, costi.

**Proposta alla Direzione Strategica:** acquisire la chiusura del difetto UX di selezione dello stato delle revisioni **a livello codice e CI**, autorizzare il collaudo autenticato finale e decidere separatamente l'estensione schema necessaria alle collaborazioni. Nessun GO al rilascio fino ai collaudi mancanti.
