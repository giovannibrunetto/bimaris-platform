# BIMARIS — Istruzioni della titolare al referente tecnico (bozza, da approvare)
Data: 18 novembre 2026
**STATO: NON APPROVATO / NON SOTTOSCRITTO. Nessun conferimento di delega è attestato da questo file.**

## Perché serve
La documentazione del progetto identifica Jessica Lucchesi come titolare del trattamento del questionario cittadini. L'account Vercel Pro collegato risulta amministrato da un unico OWNER, Giovanni Brunetto. L'organizzazione Supabase BIMARIS è Free, ma l'integrazione in sola lettura non consente di accertarne il contraente effettivo. La separazione tra titolare e amministratore tecnico va formalizzata, senza supporre che quest'ultimo sia un fornitore esterno o un autonomo responsabile ex art. 28 GDPR.

## Bozza di istruzioni da sottoporre personalmente a Jessica
«In qualità di titolare del trattamento per il questionario cittadini BIMARIS, autorizzo Giovanni Brunetto a svolgere attività tecniche di amministrazione e manutenzione degli account e delle infrastrutture Vercel e Supabase utilizzati per il progetto, limitatamente alle necessità di configurazione, sicurezza, diagnostica, backup, ripristino e assistenza strettamente connesse al questionario, nel rispetto delle mie istruzioni e degli accessi effettivamente autorizzati.

Le operazioni su dati personali devono essere limitate al minimo necessario, registrate ove tecnicamente possibile, protette da credenziali individuali e MFA; la divulgazione delle credenziali, la pubblicazione del sito, l'abilitazione della raccolta reale, l'invio email e l'intervento su Production richiedono le autorizzazioni distinte già previste dalla governance BIMARIS. Eventuali incidenti devono essermi comunicati senza ingiustificato ritardo. Le istruzioni possono essere revocate o modificate per iscritto».

**Questa è una proposta redazionale, non una delega già rilasciata.** Prima dell'uso: verificare ruoli effettivi, accessi individuali, eventuale disciplina art. 29 GDPR e coordinamento con DPA/account, ricorrendo a consulenza professionale se necessaria.

## Attestazione da raccogliere fuori dal repository pubblico
- Documento/esatta versione del testo approvato
- Data, modalità e identità della titolare che lo approva, attestabili con prova conservata in archivio riservato
- Ambito operativo, identità e accettazione del referente tecnico, termine e modalità di revoca
- Identificazione precisa delle controparte contrattuali Vercel e Supabase e della modalità di applicazione dei rispettivi DPA
- Riferimento alla valutazione del legittimo interesse e alle misure per trasferimenti/log e subfornitori

**Non caricare firme, documenti d'identità, ricevute nominative, credenziali, log personali o prove contrattuali riservate in questo repository.** Nel registro QA salvare soltanto esito e riferimento interno all'evidenza approvata.


## Procedura di approvazione distinta

**Da sottoporre direttamente alla titolare.** Il referente tecnico non può auto-attestare la volontà di Jessica solo per avere ricevuto il mandato a proseguire i lavori.

Dopo aver letto l'intero testo, Jessica può confermare in un canale riconducibile a lei:

> Approvo espressamente le istruzioni tecniche BIMARIS del 18 novembre 2026 a favore di Giovanni Brunetto, limitatamente alla gestione tecnica di Vercel e Supabase per il questionario cittadini, come descritte nel documento. Comprendo che questo assenso non autorizza la pubblicazione del sito, l'attivazione della raccolta reale, il trattamento ulteriore dei dati né operazioni su Production soggette a GO separato.

L'attestazione effettiva (messaggio originale, email o documento sottoscritto) deve rimanere in archivio riservato con data e riferimento univoco. In GitHub registrare **solo** il riferimento interno non identificativo, la data dell'approvazione comunicata e l'esito della verifica, evitando copia della firma, email personale o altra prova riservata.

Se Jessica non ha approvato questo preciso mandato, lo stato resta **NON APPROVATO**. Il suo assenso già comunicato per l'informativa privacy NON si estende a questo documento.

## Requisiti invariati
La dichiarazione del referente del 18/11 («Jessica approva espressamente») riguarda la bozza informativa LIVE, non una delega tecnica. Backup cifrato DB e Storage, ripristino isolato, privacy operativa, DPA verificati e GO distinti per SQL/produzione restano HOLD. PR #58 unica candidata, DRAFT; nessun merge e nessuna apertura SSO.
