# BIMARIS — Procedura di esclusione contenuti TEST/E2E dalla futura Production

Stato: procedura predisposta, **non eseguita**.

## Obiettivo
Impedire che contenuti creati per collaudo tecnico in Staging vengano esposti nella futura Production pubblica, senza alterare ora il dataset certificato di Staging.

## Principio di sicurezza
Staging non deve essere copiato integralmente in Production. La pubblicazione deve avvenire tramite un insieme esplicito di contenuti approvati per il rilascio. La presenza delle parole `TEST`, `E2E`, `test` o descrizioni di collaudo è un segnale di controllo, non l'unico criterio automatico di cancellazione.

## Procedura pre-release
1. Congelare temporaneamente le modifiche editoriali durante la preparazione del rilascio.
2. Eseguire un inventario dei contenuti candidati alla Production (esperienze, operatori, eventi, luoghi e altri contenuti pubblici collegati).
3. Classificare esplicitamente ogni record come `release-approved` oppure `test/staging-only`, usando ID/slug e verifica editoriale; non basarsi soltanto sul nome.
4. Generare l'elenco/allowlist degli ID approvati per Production.
5. Prima di qualsiasi import/migrazione dati, eseguire un dry-run che mostri quali record sarebbero inclusi ed esclusi.
6. Eseguire backup/esportazione del dataset di destinazione prima dell'operazione effettiva.
7. Importare/pubblicare esclusivamente i record presenti nell'allowlist approvata. Non effettuare una copia indiscriminata del database Staging.
8. Eseguire controlli post-import sulle superfici pubbliche: Home/discovery, Esperienze, Mappe, schede operatore e ogni altra pagina che legge contenuti pubblicati.
9. Verificare che nessun titolo, slug o descrizione pubblica contenga indicatori di collaudo (`TEST`, `E2E`, `collaudo`, `fittizia`) salvo eccezioni espressamente approvate.
10. Verificare che i riferimenti tra record rimasti siano integri e che nessun contenuto Production punti a record esclusi.
11. Solo dopo esito PASS, autorizzare l'esposizione pubblica.

## Controlli minimi di uscita
- zero contenuti `test/staging-only` nelle query pubbliche Production;
- zero collegamenti pubblici verso record esclusi;
- mappe e discovery alimentate soltanto da contenuti approvati;
- regole di visibilità/pubblicazione ancora rispettate;
- rollback possibile tramite backup precedente al rilascio.

## Nota
Questa procedura non autorizza cancellazioni, migrazioni o modifiche al database Production. L'esecuzione richiede una specifica autorizzazione di release e la verifica finale del dataset immediatamente prima del go-live.