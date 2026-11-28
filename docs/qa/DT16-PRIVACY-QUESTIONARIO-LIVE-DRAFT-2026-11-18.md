# BIMARIS — Informativa privacy questionario cittadini | BOZZA LIVE
**Data di redazione:** 18 novembre 2026  
**Stato:** DRAFT / REVIEW ONLY. Non approvata per la pubblicazione e non attiva.  
**Ambiente previsto:** progetto BIMARIS Production Supabase, pagina isolata del questionario su Vercel.  
**Non modificare** la pagina `/privacy-questionario`, `PRIVACY_VERSION`, i consensi, le configurazioni live o le protezioni SSO sulla base di questa bozza.

> **Nota di revisione:** il testo sottostante descrive il funzionamento *progettato* per il rilascio. Le dichiarazioni relative a titolarità, basi giuridiche, fornitori, trasferimenti e operatività devono essere convalidate dalla titolare prima dell'uso pubblico. Non trattare questo documento come certificazione di conformità GDPR.

---

## Informativa sul trattamento dei dati — «A MESSINA NON C'È NENTI!»

### 1. Chi tratta i dati e come contattarlo
Il titolare del trattamento indicato per il progetto **BIMARIS — Messina da vivere** è **Jessica Lucchesi**, persona fisica. Per informazioni sul trattamento, richieste relative ai tuoi dati e revoca del consenso all'annuncio del lancio puoi scrivere a **info@bimarisnet.it**.

### 2. Perché raccogliamo le risposte
Il questionario contiene cinque domande sulle modalità di ricerca di attività e opportunità a Messina, le difficoltà incontrate, gli interessi e le aspettative. Le risposte e la data di invio servono a comprendere meglio le esigenze dei cittadini e a orientare lo sviluppo di BIMARIS.

La quinta domanda, con risposta libera, è facoltativa: non inserire nomi, recapiti, dati particolari o informazioni riguardanti altre persone. Non chiediamo nome, cognome o telefono.

**Base giuridica proposta per le risposte:** legittimo interesse del titolare alla ricerca sulle esigenze territoriali (articolo 6, paragrafo 1, lettera f, del GDPR), **subordinatamente alla conferma della valutazione documentata di bilanciamento**. I risultati verranno utilizzati preferibilmente in forma aggregata. Puoi opporti al trattamento nei casi previsti dalla normativa.

### 3. Comunicazione facoltativa del lancio
Puoi scegliere separatamente di lasciare il tuo indirizzo email per ricevere **una sola comunicazione relativa al lancio di BIMARIS**. Questa scelta è libera: non è necessaria per rispondere al questionario.

La base giuridica è il **consenso** (articolo 6, paragrafo 1, lettera a, GDPR). Puoi revocarlo scrivendo a **info@bimarisnet.it**, senza pregiudicare la liceità di quanto già effettuato. L'email non sarà usata per newsletter, promozioni successive, comunicazioni di operatori terzi o caricamenti di pubblici pubblicitari su Meta.

Testo di consenso previsto nell'interfaccia, da mantenere coerente con il codice:  
> Sì, desidero ricevere esclusivamente la comunicazione del lancio via email e ho letto l’informativa privacy

### 4. Quali dati e quali misure di separazione
Il questionario non richiede un account Google e non acquisisce automaticamente un indirizzo email. Le risposte sono archiviate separatamente dai contatti facoltativi: l'archivio delle email non contiene le risposte né un identificativo comune che colleghi le due raccolte.

La separazione **non equivale a anonimato assoluto**: un testo libero o dati tecnici potrebbero consentire un'identificazione indiretta. L'accesso ai dati deve essere riservato al server e alle persone autorizzate dal titolare. Non sono previste profilazione né decisioni automatizzate.

Per proteggere il servizio dagli invii abusivi è previsto un contatore basato su un'impronta HMAC dell'indirizzo IP, senza conservare l'IP in chiaro negli archivi applicativi del questionario. Si tratta comunque di un dato pseudonimizzato, non anonimo. Il fornitore dell'hosting può trattare separatamente log tecnici di rete e sicurezza. La relativa durata e le modalità di accesso sono soggette a verifica finale.

### 5. Per quanto tempo conserviamo i dati
Secondo la politica **proposta per la raccolta reale e da convalidare sul funzionamento definitivo**:
- Le risposte individuali sono conservate per non oltre **12 mesi** dalla raccolta, con riesame della necessità dopo **90 giorni**, e cancellate prima se non più necessarie. Potranno restare statistiche effettivamente anonime, prive di testi o dettagli identificanti.
- L'indirizzo email e la prova del consenso sono cancellati entro **30 giorni dall'annuncio del lancio** e comunque non oltre **12 mesi** dalla raccolta, secondo la scadenza anteriore.
- In caso di revoca, il contatto viene escluso dall'invio appena la richiesta è ricevuta e verificata e cancellato senza ingiustificato ritardo.
- La prova del consenso include il testo accettato, la data e l'ora, la versione del consenso e dell'informativa. Non è prevista una conservazione personale permanente della prova dopo l'eliminazione del contatto.
- I contatori tecnici antiabuso sono soggetti a cancellazione periodica; l'effettiva durata, i log dei fornitori, le copie di backup e gli eventuali tempi di ripristino richiedono conferma documentale prima della pubblicazione.

### 6. Infrastruttura e fornitori
La pagina del questionario è progettata per essere ospitata da **Vercel**, in un progetto isolato dal sito BIMARIS principale. L'archiviazione delle risposte e delle email è prevista su **Supabase Production**, con database nella regione **eu-west-1 (Irlanda)**. Google Forms e Google Sheets non sono utilizzati per l'invio dei dati del questionario.

La localizzazione del database nello Spazio Economico Europeo **non esclude** trattamenti tecnici o accessi da paesi terzi da parte dei fornitori e dei rispettivi subfornitori. Prima dell'attivazione devono essere verificati gli accordi sul trattamento dei dati (DPA) applicabili agli specifici account, l'elenco dei subfornitori, le misure di sicurezza, l'accesso ai log e le garanzie per eventuali trasferimenti internazionali. Le risposte e gli indirizzi non saranno resi pubblici.

Riferimenti documentali dei fornitori da verificare:
- [Vercel — DPA](https://vercel.com/legal/dpa)
- [Supabase — DPA](https://supabase.com/legal/customer-resources/data-processing-addendum)
- [Supabase — subfornitori](https://supabase.com/legal/customer-resources/subprocessor-list)

### 7. Quali diritti puoi esercitare
Nei casi previsti dal GDPR puoi richiedere accesso, rettifica, cancellazione, limitazione del trattamento e portabilità; puoi opporti al trattamento basato sul legittimo interesse e revocare il consenso per l'email di lancio. Scrivi a **info@bimarisnet.it**. Puoi inoltre proporre reclamo al [Garante per la protezione dei dati personali](https://www.garanteprivacy.it/).

Per le risposte che non contengano elementi sufficienti a identificarle, la possibilità di individuare una specifica risposta potrà essere limitata: questa circostanza deve essere spiegata concretamente nella gestione delle richieste.

---

## Check di pubblicazione: obbligatorio prima della sostituzione della pagina attuale

- [ ] Titolare verifica e approva espressamente testo, versione e data del documento LIVE.
- [ ] Documentazione di bilanciamento dell'interesse legittimo reperita, esaminata e approvata.
- [ ] Titolarità degli account, DPA, subfornitori, log e trasferimenti Vercel/Supabase verificati con evidenze.
- [ ] Rispondenza tecnica di archivi, consenso, IP/HMAC, retention e gestione delle richieste confermata su ambiente appropriato.
- [ ] Testo della privacy e stringhe `PRIVACY_VERSION` / consenso rese coerenti nello stesso rilascio **solo dopo autorizzazione**.
- [ ] Eventuale raccolta di collaudo eliminata secondo procedura autorizzata e documentata.
- [ ] Backup cifrato Production, verifica copertura file Storage e test di ripristino isolato superati.
- [ ] Collaudo SQL V8, job retention e percorso di invio effettuato senza dati personali reali.
- [ ] Autorizzazione separata alla migrazione Production, quindi autorizzazione separata all'apertura del **solo questionario**.
- [ ] SSO del progetto BIMARIS principale mantenuto in ogni caso.

**Nota tecnica:** la versione attualmente implementata è `2026-11-17-v2`; questa bozza non introduce una nuova versione nel codice. La pagina attuale rimane quella di collaudo. Nessuna condizione qui descritta costituisce un GO automatico.
