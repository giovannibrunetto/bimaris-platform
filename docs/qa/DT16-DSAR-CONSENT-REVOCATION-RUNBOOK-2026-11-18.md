# BIMARIS — DT16 | Procedura amministrativa di revoca e cancellazione contatti
Data: 18 novembre 2026
**Stato: BOZZA DI PROCEDURA / REVIEW ONLY.** Nessuna operazione sui dati reali, nessun DDL Production e nessuna autorizzazione a pubblicare.

## Decisione architetturale provvisoria
Per il primo rilascio utilizzare **gestione manuale tramite incaricato autorizzato**, con accesso riservato al database e registrazione minima dell'esito; non creare endpoint pubblici di cancellazione e non introdurre il pannello nel progetto Vercel del questionario.

Motivo: `apps/web/lib/admin-mfa-guard.ts` è intenzionalmente vincolato a Supabase Staging, e `apps/web/proxy.ts` vieta le rotte amministrative nel progetto Vercel isolato. Non rimuovere il vincolo Staging o l'obbligo AAL2 per creare un collegamento rapido alla Production.

## Elementi tecnici rilevati
- Staging contiene `survey_private.erase_launch_contact(p_email text)`, funzione `SECURITY INVOKER` che elimina il contatto e registra un conteggio della cancellazione. EXECUTE non concesso a `anon`, `authenticated` e `service_role`.
- Il candidato SQL Production V8, ancora **REVIEW ONLY**, prevede la medesima funzione. Su Production lo schema survey non è stato installato.
- L'archivio contatti è separato da quello delle risposte; non è previsto un ID comune. La cancellazione del contatto non garantisce la localizzazione di una risposta anonima.
- Il successo dei job periodici in Staging non sostituisce un collaudo end-to-end del diritto alla cancellazione.

## Procedura proposta da approvare
1. **Ricezione**: la titolare riceve la richiesta a `info@bimarisnet.it`. Assegna identificativo pratica, data, tipo richiesta e scadenza, senza copiare contenuti personali in GitHub, CI, issue pubbliche o chat.
2. **Classificazione**: distingue revoca del consenso per una singola email di lancio, cancellazione dei contatti, opposizione alle risposte del sondaggio o altra richiesta GDPR. Le risposte senza elementi identificativi potrebbero non essere individuabili.
3. **Verifica proporzionata**: risponde al richiedente attraverso il canale indicato; in presenza di ragionevoli dubbi verifica il controllo della casella senza richiedere documenti d'identità per routine. Non conferma a soggetti estranei che una mail sia registrata.
4. **Esclusione dagli invii**: blocca il futuro annuncio alla casella nel processo operativo. **Gap**: la procedura di invio unico non è ancora collaudata e va progettata per non reinserire o contattare caselle revocate.
5. **Selezione ambiente**: l'incaricato accede con identità individuale e MFA al progetto Supabase corretto. Doppia verifica del progetto prima di operare; mai utilizzare il database principale da un PC condiviso o una console non autorizzata.
6. **Eliminazione**: solo dopo backup e approvazione della migrazione, usa una procedura amministrativa protetta e testata che invochi la funzione di cancellazione in Production con il dato minimo strettamente necessario. Non incollare email o password nei log/strumenti di sviluppo. Nessun GRANT generalizzato a ruoli web o funzione SECURITY DEFINER pubblica.
7. **Verifica**: conferma l'assenza del contatto con accesso riservato e annota soltanto numero pratica, data, operatore, operazione e esito; evita di salvare email nella traccia tecnica.
8. **Backup**: documenta il periodo di permanenza temporanea nei backup cifrati, l'accesso ristretto e le misure per evitare che un restore reintroduca contatti cancellati o faccia partire invii.
9. **Risposta**: comunica l'esito al richiedente attraverso il canale appropriato, rispettando i termini applicabili al GDPR. La procedura deve essere validata dalla titolare e, se necessario, da un professionista privacy.

## Collaudi obbligatori (solo dati sintetici)
- Una richiesta sintetica riferita a una casella di test in ambiente autorizzato: presente -> cancellata -> non più presente.
- Richiesta ripetuta: comportamento idempotente, nessuna eccezione inattesa o reinserimento.
- Contatto inesistente: risposta non rivelatrice e audit appropriato.
- Ruolo pubblico / sessione non autorizzata: accesso negato.
- Continuità: blocco invii di lancio, trattamento di revoche sopraggiunte durante preparazione invio, assenza di doppie comunicazioni.
- Ristabilimento da backup: verifica che la cancellazione non venga vanificata da un recupero.

## Blocchi e decisioni
**BLOCKED:** implementazione/attivazione amministrativa Production, cancellazione di dati reali, modifica dell'area Super Admin o dell'isolamento Vercel.
**Consentito:** documentazione, simulazioni senza dati reali e revisione statica del codice.
**Release gate:** titolare approva il processo, accessi individuali, audit e retention; test sintetici completati; backup Production con ripristino isolato PASS; GO esplicito DDL e separato GO pubblicazione.

SSO sul sito BIMARIS principale deve restare sempre attivo durante la campagna.
