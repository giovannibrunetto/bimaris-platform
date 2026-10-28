# BIMARIS — procedura privacy pre-lancio / manifestazioni d'interesse

Stato: **bozza tecnico-operativa soggetta a verifica giuridica prima della Production**.

## Ambito e finalità
La tabella `public.operator_interest_manifestations` è utilizzata esclusivamente per ricevere e gestire le manifestazioni d'interesse degli operatori nella fase di pre-lancio. I dati non devono essere riutilizzati automaticamente per newsletter, marketing o campagne promozionali.

## Dati minimizzati
Il modulo pubblico deve raccogliere soltanto: nome attività, categoria, comune/località, nome referente, email e interesse B2C/B2B/entrambi. L'endpoint server scarta eventuali campi aggiuntivi inviati da client alterati: indirizzo completo, coordinate, Google Place ID, telefono e sito/social non vengono persistiti.

## Presa visione
La checkbox del modulo documenta la presa visione dell'informativa. Non deve essere descritta né riutilizzata come consenso marketing. La base giuridica del trattamento resta da validare giuridicamente prima della pubblicazione definitiva.

## Accesso
La tabella ha RLS attiva e nessuna policy per `anon` o `authenticated`; non sono concessi privilegi tabellari a tali ruoli. Le operazioni sui dati avvengono solo lato server tramite `service_role`. La chiave `service_role` non deve mai essere esposta al browser o condivisa con utenti finali.

## Richieste degli interessati
Recapito operativo: `info@bimarisnet.it`.

Per ogni richiesta di accesso, rettifica o cancellazione:
1. registrare data di ricezione e natura della richiesta senza copiare dati non necessari;
2. identificare la manifestazione mediante email e, se necessario, nome attività;
3. verificare ragionevolmente l'identità del richiedente prima di comunicare o modificare dati;
4. eseguire la richiesta attraverso un amministratore tecnico autorizzato, mai esponendo accesso diretto al database;
5. aggiornare `last_interaction_at` quando avviene un'interazione pertinente che giustifica la prosecuzione della conservazione;
6. annotare internamente data ed esito dell'operazione senza conservare copie superflue dei dati cancellati.

## Conservazione
Il termine operativo è sei mesi dall'ultima interazione pertinente, rappresentata da `last_interaction_at`. La funzione `public.delete_expired_operator_interest_manifestations()` elimina le righe oltre tale termine. La funzione è eseguibile esclusivamente dal `service_role` e non da `public`, `anon` o `authenticated`.

Prima dell'avvio pubblico deve essere definita la cadenza operativa con cui un amministratore autorizzato esegue e verifica la cancellazione. L'automazione della cancellazione non è necessaria per il test in staging.

## Fornitori tecnici
- **Supabase**: database e servizi backend. Lo Staging BIMARIS è configurato in `eu-west-1`. Il DPA e l'elenco dei sub-responsabili devono essere conservati/validati nell'assetto privacy definitivo. Supabase dichiara che i dati core sono ospitati nella regione scelta, pur prevedendo limitati trattamenti fuori regione e meccanismi per trasferimenti internazionali.
- **Vercel**: hosting/esecuzione dell'applicazione. Il relativo DPA prevede il ruolo di processor per i Customer Data sui piani coperti, sub-responsabili e meccanismi per trasferimenti internazionali; l'assetto contrattuale effettivamente applicabile all'account BIMARIS deve essere verificato prima della Production.
- **Google Maps Platform**: non è più necessario al modulo minimizzato di manifestazione d'interesse. Il modulo non deve caricare Google Places per raccogliere la località. Google Maps resta un fornitore separato per altre funzioni BIMARIS e va valutato nel quadro privacy generale della piattaforma.

## Titolare e gestione
Titolare proposto per la fase pre-lancio: **Jessica Lucchesi**, persona fisica. Questa indicazione resta soggetta a verifica giuridica.

L'attuale autenticazione amministrativa BIMARIS è tecnica e condivisa (password amministrativa, con TOTP se configurato) e non identifica nominativamente Jessica. Pertanto la capacità personale di Jessica di gestire le richieste non può essere certificata finché non viene verificato un accesso amministrativo effettivamente a lei disponibile e coerente con le regole di sicurezza. Fino ad allora le operazioni privacy devono essere eseguite da un amministratore tecnico autorizzato su richiesta del titolare proposto.

## Blocco Production
Nessuna di queste predisposizioni costituisce autorizzazione alla raccolta pubblica. Prima della Production sono richiesti almeno: verifica giuridica del titolare, scelta/documentazione della base giuridica, validazione dell'informativa, verifica degli accordi con i fornitori e conferma del processo operativo di gestione dei diritti e della retention.
