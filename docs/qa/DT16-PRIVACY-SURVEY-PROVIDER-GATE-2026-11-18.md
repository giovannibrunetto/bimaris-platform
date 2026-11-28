# BIMARIS — DT16 | Revisione informativa questionario e verifica fornitori
Data: 18 novembre 2026
Stato: REVIEW ONLY — NO GO raccolta reale, pubblicazione, merge o DDL Production.

## Perimetro e fonti esaminate
- Testo reale di `apps/web/app/privacy-questionario/page.tsx` sul ramo della PR #58.
- Domande e consenso: `apps/web/app/questionario-cittadini/questions.ts`.
- Validazione e versione: `apps/web/lib/survey/validation.ts`.
- Guard di invio: `apps/web/lib/survey/live.ts`.
- Testi ufficiali: Vercel DPA https://vercel.com/legal/dpa ; Supabase DPA https://supabase.com/legal/customer-resources/data-processing-addendum ; Supabase elenco subfornitori https://supabase.com/legal/customer-resources/subprocessor-list ; Garante GDPR https://www.garanteprivacy.it/home/principi-fondamentali-del-trattamento .

## Elementi già presenti, senza attestazione di conformità finale
1. Titolare indicata: Jessica Lucchesi, contatto info@bimarisnet.it.
2. Finalità distinte: ricerca sulle esigenze territoriali e una sola comunicazione del lancio su scelta facoltativa.
3. Base giuridica dichiarata: interesse legittimo per le risposte, consenso per il contatto; conservazioni indicate; richiesta di non includere dati identificativi nel testo aperto.
4. Archivi distinti per risposte e contatti, mitigazioni HMAC IP e spiegazione della possibile identificazione indiretta.
5. Percorso dei diritti e riferimenti a Vercel e Supabase; versione `2026-11-17-v2`.

## Bloccanti documentali / incongruenze da risolvere
- **P0 — DPA e account titolare**: verificare titolarità e soggetti contraenti effettivi degli account Vercel e Supabase, applicabilità/accettazione delle versioni contrattuali e conservare evidenze senza credenziali. La pubblicazione dei DPA non prova da sola il completamento degli adempimenti.
- **P0 — Subfornitori, trasferimenti, log**: registrare subfornitori effettivi e paesi, garanzie per eventuali trasferimenti, durata e accessibilità dei log, richieste di assistenza e trattamenti tecnici; distinguere la regione `eu-west-1` dalla localizzazione di tutti i dati e accessi.
- **P0 — Bilanciamento interesse legittimo**: reperire il dossier realmente approvato e verificare motivazione, necessità, aspettative degli interessati, rischi e possibilità di opposizione. Non assumere che la frase «approvata dalla titolare» nel codice sostituisca evidenza documentale.
- **P0 — Produzione vs collaudo**: il testo attuale descrive lo Staging, avverte di non inserire dati reali e dedica una sezione al cookie/test riservato. Prima di pubblicare, preparare una versione separata e verificata che descriva l'effettiva infrastruttura e i processi live; non riutilizzare la descrizione Staging come informativa Production.
- **P1 — Diritti e cancellazione**: provare, con dati sintetici e senza raccolta reale, la capacità di localizzare/revocare un contatto, rispettare la scadenza prevista e fornire riscontro tramite la casella indicata; distinguere il trattamento delle risposte non riconducibili a un interessato.
- **P1 — Testo consenso**: verificare corrispondenza esatta tra `launchConsent`, versione `launch-only-v1` e testo/flag che il server conserva; l'assenza di consenso non deve impedire il sondaggio.
- **P1 — Minimizzazione/retention**: verificare operatività, avvisi in caso di cron fallito, cancellazione di dati collaudo prima del lancio e conservazione separata dei backup cifrati.

## Evidenze tecniche osservate online (18 novembre 2026)
- PR #58 DRAFT e CI al commit `77c91fda287e6f41c1183c1ee0a3bdab00a935f1` SUCCESS, senza merge.
- Staging: `collection_control.enabled=false`, `staging_only=true`, `release_authorized_at IS NULL`. Un record `responses` e un record `launch_contacts` sono entrambi `rehearsal=true` (17 novembre 2026); non attestano raccolta pubblica. Il job retention del rilascio ha 25 run `succeeded` fino al controllo.
- Production: nessuno schema `survey_private`, nessun `pg_cron` installato; backup e test di ripristino ancora non eseguiti.
- Vercel: progetti principale e questionario isolato con SSO attivo su tutti i deployment. Raccolta isolata non autorizzata.
- Non sono stati letti indirizzi email o contenuti di risposte negli accertamenti di questa scheda.

## Criteri di uscita
1. Evidenza documentata di verifica/approvazione titolare per base giuridica, DPA, trasferimenti, log, conservazione e contatti.
2. Testo informativa LIVE aggiornato e approvato, con corrispondenza tra comportamento dell'app, DB Production e provider.
3. Backup cifrato Production e ripristino isolato PASS, inventario dei file Storage e delle configurazioni.
4. Collaudo del candidato SQL V8 e retention in ambiente isolato; GO separato per DDL.
5. Test di invio live con dati sintetici, verifica HTTP non autenticata delle sole rotte autorizzate; apertura del solo progetto questionario con GO distinto.
6. SSO del progetto principale BIMARIS sempre attivo durante la campagna.

Nessun requisito qui elencato costituisce autorizzazione a intervenire su Production.
