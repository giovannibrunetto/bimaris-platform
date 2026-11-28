# Archivio editoriale · Racconti di Messina

Perimetro della PR #58. Migrazione Staging `20261124113000_editorial_historical_stories.sql`.

## Dati e compatibilità

- I tre record iniziali riproducono il contenuto di `apps/web/data/ti-racconto-messina.ts`, incluse le transizioni e le chiavi di tutte le schede Cultura collegate.
- Gli URL esistenti terminano con `medioevo`, `cinquecento` e `1908-rinascita`. Il caricatore pubblico ordina i tre racconti come nella versione precedente. La copia esistente nel codice resta disponibile come ripiego per i soli racconti originari in caso di errore del database.
- I tre record originari sono protetti. Si possono aprire bozze e anteprime, ma la funzione di gestione respinge pubblicazione, ritiro e archiviazione di questi record. Per una modifica della versione pubblica serve una nuova autorizzazione.
- Ogni nuovo racconto conserva il proprio URL dopo la prima pubblicazione. I capitoli conservano l'ordine editoriale e collegano una scheda Cultura per slug. La pubblicazione controlla che le schede collegate siano pubblicate.
- Le bozze e il registro usano le strutture già presenti. Il ruolo pubblico legge solo i racconti pubblicati. Le mutazioni della funzione sono riservate al service role e l'endpoint richiede Super Admin con MFA e verifica dell'origine della richiesta.

## Ripristino

1. Ripristinare la versione precedente del codice sulla Preview. L'elenco e i dettagli originali tornano a leggere la copia già presente nel repository, con gli stessi URL.
2. Conservare la tabella dei racconti e le bozze per consentire un ripristino successivo. Questa è la procedura ordinaria e conserva i nuovi contenuti inseriti durante il collaudo.
3. Solo per rimuovere completamente la migrazione, esportare prima `historical_editorial_stories` e le righe `model = 'historical'` da `editorial_workspaces`, insieme alle relative righe di `editorial_activity`. In una transazione, rimuovere la funzione `manage_historical_editorial(text,uuid,uuid,uuid,integer,jsonb)` e la tabella `historical_editorial_stories`. La policy viene rimossa con la tabella. Le bozze e il registro possono restare in archivio. Verificare i tre URL originali al termine.
