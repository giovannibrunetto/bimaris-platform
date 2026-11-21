# DS-MKT-USER-02/V5 — Coordinamento tecnico e preparazione al rilascio

17 novembre 2026. **HOLD merge, Production e raccolta reale.**

Questo documento condivide con la Direzione Tecnica le evidenze del questionario sullo stesso ramo `integration/bimaris-consolidated-20261115`, PR #57. Base di lavoro: `18fe4d091e10983876d02bbf28cadf5442ba58f0`. Nessuna modifica a domande, opzioni, CSS o informativa. Nessuna seconda informativa.

## A — Account e autorizzazioni

- Titolare del trattamento: Jessica Lucchesi. Approvazione comunicata dal promotore e registrata con provenienza esplicita, senza simulare una firma diretta.
- Account infrastrutturali gestiti da Giovanni: un solo Owner verificato su Vercel e Supabase. L'account personale rimane estraneo al contenuto pubblico del questionario; le credenziali non sono condivise nel codice.
- Vercel: MFA `enabled=true`, TOTP presente, team Pro. Supabase: metodo personale «BIMARIS Supabase» configurato dal proprietario e verificato alle 08:34:28 Europe/Rome. Imposizione organizzativa MFA non disponibile su Free, distinta dalla MFA personale attiva.
- Accesso ai dati via server; utenti ordinari e anonimi senza USAGE sullo schema privato o EXECUTE sulle RPC riservate. Il ruolo di servizio non può modificare il gate di attivazione o eseguire le funzioni amministrative di cancellazione.
- Resta da acquisire la documentazione delle istruzioni/delega di Jessica al gestore tecnico. La sola autorizzazione dell'agente al login non viene trattata come delega della titolare. Non è richiesta automaticamente una migrazione di proprietà degli account.

## B — Copie e recupero

- Progetto usato: `nzdeoimwikhoidtladnu`, BIMARIS Staging, Irlanda `eu-west-1`, Free. La pagina autenticata backup dichiara che il piano non include backup di progetto. Nessun backup gestito disponibile.
- Non sono stati creati export dei dati in questa attività. Ricerca mirata nel workspace: nessun CSV/XLSX/dump del questionario identificato tramite nome; ciò non prova l'assenza di copie con altri nomi o fuori dal workspace.
- Ricerca dei nomi oggetto Supabase Storage contenenti survey/questionario/backup/dump/export: zero corrispondenze. Non sono stati letti i contenuti degli oggetti estranei.
- Non è possibile attestare l'assenza di copie manuali su dispositivi personali o servizi esterni senza un inventario del gestore. Gli eventuali vecchi Google Sheets non sono usati dal nuovo percorso e non sono stati considerati automaticamente vuoti o cancellati.

Procedura di recupero senza nuove spese: bloccare raccolta e invii; ripristinare il codice da Git; controllare stato del database e scheduler; se il database è integro, rieseguire pulizia e controlli. In caso di perdita definitiva senza una copia autorizzata, i dati non sono recuperabili: ricominciare con archivio vuoto e nuovi consensi, senza ricostruire contatti da log. Non dichiarare RPO/RTO garantiti. Un backup dei dati richiede prima una decisione documentata su luogo, cifratura, accessi, scadenze e gestione delle revoche.

Se una copia autorizzata viene recuperata: ambiente isolato, nessun invio; pulizia delle scadenze; riconciliazione delle revoche successive alla copia. Se tale riconciliazione non è dimostrabile, **non riutilizzare i contatti della copia per inviare l'annuncio**. Conservare solo gli esiti numerici del controllo. Il rischio residuo di perdita completa senza backup deve essere deciso dalla titolare prima del lancio; non viene accettato per suo conto dall'agente.

## C — Log e servizi effettivi

- Vercel: elenco drain del progetto vuoto; elenco installazioni integrazioni in vista project vuoto. Configurazione esistente con variabili Maps e Resend per altre aree non significa utilizzo nel questionario. Nessun SDK di invio, mappe o tracking aggiunto dal questionario.
- Variabili di raccolta live `BIMARIS_SURVEY_COLLECTION_MODE`, `BIMARIS_SURVEY_LIVE_PROJECT_REF`, `BIMARIS_SURVEY_LIVE_SECRET` assenti nell'inventario Vercel consultato. Nessuna variabile modificata.
- Nessuna chiamata console o log dei payload nel codice del questionario. Errori server generici; RPC non restituiscono diagnostica con dati personali al browser.
- Supabase: ispezione aggregata della finestra 06:50–07:50 UTC rileva 6 edge, 8 pooler, 13 Postgres, 21 PostgREST, 4 Realtime e 2 Storage log. Questi sono eventi di progetto, non tutti attribuibili al questionario.
- Chiavi effettivamente presenti negli edge log: IP di connessione (`request.headers.cf_connecting_ip`), user agent, percorso, metodo, regione/città derivata e identificativi tecnici. Non si esportano valori. Le chiamate server verso Supabase possono riferirsi alla connessione del server, non automaticamente all'IP del cittadino. Nei log Postgres è presente anche la categoria query: evitare SQL con dati personali letterali durante l'operatività.
- Configurazione Postgres rilevata: `log_statement=ddl`, `log_min_error_statement=error`, parametri su errore limitati a zero. `log_parameter_max_length=-1` non equivale a logging ordinario di tutti i payload: va letto insieme alle classi di statement registrate. Non è una prova di assenza assoluta di dati in ogni log.
- Piano Free verificato e documentazione ufficiale: log API/database conservati 1 giorno; il limite non viene esteso automaticamente ai log interni di sicurezza, supporto o fatturazione. Vercel Pro: runtime log 1 giorno secondo documentazione già acquisita. Nessun attestato di cancellazione fisica di tutte le copie interne dei fornitori.
- Supabase DPA incorporato automaticamente nei termini, attestato nel pannello dell'organizzazione; Vercel DPA applicabile al piano Pro verificato. Le regioni `eu-west-1`/`dub1` non escludono flussi internazionali accessori. Restano da completare il fascicolo applicabile di subfornitori/trasferimenti e i limiti dei flussi accessori; nessun nuovo contratto accettato.

## D — Percorso tecnico pronto ma disattivato

- Nuove tabelle private `responses` e `launch_contacts`, distinte dai precedenti archivi `_test`. Nessun identificativo della risposta, risposta o digest viene inserito nell'archivio email.
- Percorso di prova e percorso futuro condividono la RPC `submit_citizen_survey`. In staging è permessa soltanto la modalità rehearsal: testo vuoto o `COLLAUDO:`, indirizzi `@example.invalid`. La vecchia RPC di prova resta presente per compatibilità storica e non è cancellata.
- Gate applicativo: solo Vercel Production, attivazione esplicita, riferimento progetto conforme diverso dallo staging, URL coincidente e segreto dedicato. Preview non può abilitarlo.
- Gate database: `enabled=false`, `staging_only=true`, autorizzazione di rilascio assente. Per aprire serve approvazione della titolare registrata sulla stessa versione, autorizzazione al rilascio e modifica esplicita amministrativa. Il ruolo servizio non può aprirlo.
- Conservazione: risposte reali 12 mesi con data di riesame a 90 giorni; contatti al primo termine tra raccolta+12 mesi e annuncio+30 giorni; collaudi 7 giorni. Riesame a 90 giorni segnala una verifica della necessità, non finge una decisione automatica umana.
- Job `bimaris-citizen-survey-release-retention`, ogni ora al minuto 19 UTC. Transazione, lock, timeout, nuovo tentativo, errore sanificato, registri solo numerici/orari per 30 giorni. L'altro job di prova rimane al minuto 17.
- Revoca: funzione privata amministrativa `survey_private.erase_launch_contact(text)`, dopo verifica della richiesta via `info@bimarisnet.it`; cancellazione contatto e prova, ripetibile, senza correlare o cancellare le risposte.

## Evidenze dei collaudi

- 62/62 test applicativi PASS (37 esistenti + 25 nuovi). Il ramo live degli handler è testato con dipendenze simulate; non sono usati indirizzi reali.
- 37/37 verifiche SQL PASS nel database di staging, transazione annullata: blocco, permessi, idempotenza, separazione, versione consenso, persistenza, modalità live simulata con dati fittizi, scadenze, throttling, revoca, errore/rollback/riprova.
- Persistenza effettiva con ruolo `service_role`: una risposta e un contatto fittizi scritti e scaduti per test. Job automatico il **17/11/2026 alle 08:52:00 Europe/Rome**: 1 risposta e 1 contatto eliminati, senza nuovi invii. Archivi pronti tornati vuoti; programmazione temporanea al minuto ripristinata a `19 * * * *`.
- TypeScript, ESLint mirato e build webpack PASS. Nessun nuovo WARN degli advisor relativo agli oggetti aggiunti; restano gli avvisi preesistenti fuori perimetro.
- Non si dichiarano in questo documento prove di ripristino fisico del database né un deployment Production.

## Unica informativa e coordinamento

L'unico testo operativo è `apps/web/app/privacy-questionario/page.tsx`, versione `2026-11-17-v2`. Non modificato in V5. Validatore, RPC e nuovi consensi usano lo stesso identificativo. Il registro privato contiene approvazione di Jessica riferita da Giovanni, registrata il 17/11 alle 08:02:53 Europe/Rome; nessuna firma diretta inventata. Le prove storiche v1 restano tali.

La Direzione Tecnica può verificare schema, migrazioni e test nella stessa PR. Questo documento non attesta che la Direzione Tecnica abbia già eseguito il proprio riesame. Ogni aggiornamento sostanziale dell'informativa dovrà modificare l'unico testo e allineare versione/approvazione prima del rilascio; non creare informative parallele.

## Esito e condizioni per il rilascio

A: **BLOCKED per la documentazione del rapporto gestore/titolare**, verifiche tecniche accessi PASS. B: **BLOCKED per inventario esterno e decisione recupero**, controlli nel perimetro accessibile PASS. C: **PASS nel perimetro tecnico osservato, BLOCKED per chiusura documentale dei flussi accessori**. D: **PASS sui collaudi elencati, raccolta disattivata**; verifica finale Preview e riesame della Direzione Tecnica separati.

**NO-GO alla pubblicazione.** Non sono autorizzati merge, Production, dati reali o spese. La preparazione tecnica non sostituisce la scelta del database di destinazione e la sua configurazione/verifica, che dovranno essere formalizzate al rilascio. Nessuna operazione sul progetto Production è stata eseguita.

Fonti ufficiali: [Supabase pricing](https://supabase.com/pricing), [logs](https://supabase.com/docs/guides/observability/logs), [Cron](https://supabase.com/docs/guides/cron), [DPA](https://supabase.com/legal/customer-resources/data-processing-addendum), [residenza e trasferimenti](https://supabase.com/legal/privacy-resources/data-residency-and-transfers-faq), [Vercel DPA](https://vercel.com/legal/dpa), [runtime logs](https://vercel.com/docs/logs/runtime). Le fonti generali sono distinte dalle osservazioni sugli account sopra descritte.
