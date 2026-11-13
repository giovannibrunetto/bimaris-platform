# DS-UX-REV-01 — Collaudo logico Staging in sola lettura

**Data:** 13 novembre 2026  
**Perimetro:** PR #54, revisione interessi e attività  
**Stato:** collaudo logico PASS; migrazione/rollout in HOLD

## Evidenze indipendenti

- GitHub CI `validate` sul commit `ac5375c6c5c3e16fff255953def0d9840d3cae07`: **PASS**.
- Staging contiene `experience_revisions`, `experience_discovery_intents` e `experience_activity_links`, tutte con RLS attiva.
- La funzione `admin_apply_experience_revision` a tre argomenti è presente; i nuovi `bimaris_apply_revision_taxonomy`, `bimaris_revision_taxonomy_ready` e relativo trigger **non sono installati**.
- Non è stato eseguito SQL DDL o DML: soltanto `SELECT` di verifica e simulazioni tramite CTE.

## Matrice dei quattro casi SQL

| Caso | Baseline coerente | Proposta differente | Esito atteso | Esito osservato |
| --- | --- | --- | --- | --- |
| Dati invariati | true | false | No-op | PASS |
| Variazione dei soli interessi | true | true | Candidato applicabile | PASS |
| Variazione delle sole attività | true | true | Candidato applicabile | PASS |
| Modifica concorrente dei dati originali | false | true | Conflitto; non applicare | PASS |

Le simulazioni hanno verificato **solo la logica di confronto**, non il trigger, l'RPC, i privilegi runtime o il rollback transazionale. Non attribuire loro valore di test end-to-end.

## Controlli di sicurezza verificati

- La funzione di readiness proposta ora richiede l'esistenza del trigger corretto in stato abilitato, invece di restituire `true` incondizionato.
- Il candidato estende il controllo dei no-op per riconoscere variazioni di interessi e attività.
- La proposta è isolata nella colonna JSONB della revisione fino all'approvazione.
- Le variazioni dei partner non possono essere applicate implicitamente mediante il vecchio endpoint di approvazione; occorre un flusso distinto di consenso.
- La condizione di attivazione della UI rimane `NEXT_PUBLIC_BIMARIS_REVISION_TAXONOMY_V2=true`; al momento si deve mantenere disattivata.

## Condizioni necessarie prima dell'applicazione in Staging

1. **Test PostgreSQL isolato reale** del candidato SQL e della funzione amministrativa con dati sintetici e ripristino garantito, inclusi errori a metà inserimento, FK invalide e rollback completo di contenuti, media e tassonomia.
2. **Verifica dell'ordine dei trigger** e della validazione delle revisioni contenenti soltanto modifiche alla tassonomia.
3. **Test di autorizzazione**: service role ammesso, ruoli anon e authenticated non autorizzati all'applicazione diretta della revisione, proprietario/manager confinato al proprio operatore.
4. **Test conflitti e concorrenza**, snapshot non aggiornato silenziosamente alla riapertura della bozza, doppia approvazione e ripetizione della richiesta.
5. **Test semantica dati**: interessi massimo 3, attività valide, chiavi duplicate/assenti, mantenimento delle associazioni degli operatori partner, nessuna pubblicazione automatica.
6. **Piano di ripristino e punto di controllo** su Staging; migrazione eseguita solo con autorizzazione esplicita della Direzione Strategica.
7. **Collaudo browser autenticato** su Preview stabile e console di revisione amministrativa dopo il deployment controllato; solo successivamente valutare merge.

## Decisione

**GO** per preparazione e test isolati, **NO-GO** per installazione su Staging, flag di attivazione, merge e Production. La CI PASS non sostituisce l'evidenza del comportamento transazionale dell'RPC.
