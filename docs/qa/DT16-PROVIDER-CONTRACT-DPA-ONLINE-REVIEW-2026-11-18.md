# BIMARIS — Revisione online contrattuale fornitori Vercel/Supabase
Data: 18 novembre 2026
Stato: DOCUMENTAZIONE PRELIMINARE / NO-GO — non costituisce consulenza legale né prova dell'accettazione contrattuale.
Nessuna modifica a Production, staging, privacy page, Vercel, raccolta o SSO.

## Riscontri verificati tramite integrazioni account, sola lettura
1. Supabase: organizzazione `bimaris.com's Org`, ID `tqmahdhtypaqmtnuuhvz`, piano **Free**. Database BIMARIS Production `vhvccwvcqdhiovpopsze` in `eu-west-1`, `ACTIVE_HEALTHY`.
2. Vercel: progetto isolato `bimaris-questionario-isolato` nel team `giovannibrunetto84-1508's projects` (ID `team_bcqKyfvQ3K1f0Jlh3DQptqsz`). SSO attivo su tutti i deployment; `live=false`; `latestDeployment.target=null`.
3. Vercel: nessun **log drain** configurato per il progetto isolato nell'ambito della verifica effettuata. Questo **non prova l'assenza** di log conservati da Vercel né la durata degli stessi.
4. Nome di un team/organizzazione **non dimostra** l'identità del soggetto contrattualmente intestatario e non equivale a nomina del responsabile del trattamento.

## Fonti contrattuali esterne — pubbliche, non account-specifiche
- Supabase DPA: https://supabase.com/legal/customer-resources/data-processing-addendum
- Supabase Terms: https://supabase.com/terms
- Supabase subprocessor list: https://supabase.com/legal/customer-resources/subprocessor-list
- Supabase Data Residency and Transfers FAQ: https://supabase.com/legal/privacy-resources/data-residency-and-transfers-faq
- Vercel DPA: https://vercel.com/legal/dpa
- Vercel Terms: https://vercel.com/legal/terms
- Vercel subprocessors / Trust Center: https://vercel.com/legal/sub-processors e https://security.vercel.com

### Evidenze pubbliche
- Il DPA Supabase disciplina il rapporto Customer-Supabase e rimanda a un elenco aggiornabile di subfornitori; il testo prevede conservazione primaria dei dati nella regione indicata, fatte salve eccezioni e altri trattamenti consentiti. Prevede clausole contrattuali standard (SCC) per trasferimenti rilevanti.
- La FAQ Supabase sui trasferimenti menziona Stati Uniti e Singapore e SCC. Non presumere che **tutti** i trattamenti restino in Irlanda.
- Il DPA Vercel descrive, per clienti Pro/Enterprise, Vercel come responsabile del trattamento dei Customer Data, e contempla trattamento negli Stati Uniti e in altre località dei subfornitori, con meccanismi contrattuali per trasferimenti.
- L'elenco dei subfornitori Vercel rinvia al relativo Trust Center e potrebbe richiedere accesso o ulteriore consultazione; l'elenco dettagliato applicabile all'account non è stato inventariato.
- La documentazione commerciale Supabase indica limiti differenti di accesso ai log a seconda del piano, ma **l'accesso ai log non coincide con la retention contrattuale di ogni categoria di log e copia tecnica**. Non dichiarare una durata universale senza conferma.

## Bloccanti non risolti e verifiche necessarie
**P0-1 — intestazione/account**: identificare l'effettiva controparte contrattuale nei due servizi e documentare se agisca per conto della titolare Jessica Lucchesi. Se diverso, valutare formalizzazione delle istruzioni/ruoli con consulente.
**P0-2 — DPA applicabili**: acquisire versioni attualmente applicabili e prova di incorporazione/accettazione per entrambi gli account; eventuali addendum specifici e termini di piano. Pubblicazione di testo legale sul sito fornitore non è da sola prova di specifica accettazione.
**P0-3 — subfornitori/trasferimenti**: salvare elenco aggiornato, luoghi/categorie di trattamento, SCC/altre garanzie e condurre valutazione del caso concreto, inclusi IP e dati di rete in hosting.
**P0-4 — log**: verificare retention reale Vercel/Supabase di request log, IP, firewall/security logs, report errori e accessi amministrativi per i servizi/piani effettivi; distinguere logs a disposizione cliente da retention interna fornitore.
**P0-5 — base giuridica**: acquisire il dossier sul bilanciamento dell'interesse legittimo ed evidenza di approvazione espressa dalla titolare.
**P0-6 — privacy live**: completare e approvare il documento `DT16-PRIVACY-QUESTIONARIO-LIVE-DRAFT-2026-11-18.md` solo dopo i riscontri sopra, evitando affermazioni non verificate.

## Criteri di conclusione
Ogni P0 richiede riferimento a documento/account, data di verifica, esito PASS/FAIL e approvazione del titolare. La connessione a fornitori e le sorgenti disponibili oggi consentono verifica parziale; non consentono da sole di attestare accettazione DPA o validità legale definitiva.
Finché i P0 e il backup/restore Production non sono superati: PR #58 DRAFT, nessun merge, nessun DDL Production, nessuna modifica SSO, nessuna raccolta reale.
