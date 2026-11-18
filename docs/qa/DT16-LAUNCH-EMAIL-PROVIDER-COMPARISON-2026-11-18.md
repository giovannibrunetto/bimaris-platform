# BIMARIS — DT16 | Comparazione servizio di invio dell'annuncio unico
Data verifica: 18 novembre 2026
Stato: REVIEW ONLY — decisione della Direzione Strategica acquisita: casella BIMARIS esistente su Aruba, nessun nuovo provider email per ora. Nessun account aggiuntivo aperto, nessun token API, nessun invio di messaggi.

## Scopo
Inviare una sola comunicazione relativa al lancio di BIMARIS ai contatti che avranno esplicitamente aderito all'iniziativa nel questionario cittadini. Non è autorizzata l'introduzione di newsletter, promozioni ricorrenti o caricamenti di pubblici pubblicitari.

## Comparazione da fonti ufficiali (18 novembre 2026)
| Provider | Capacità piano gratuito | Altri aspetti | Fonti |
|---|---|---|---|
| Brevo Free | 300 email/giorno, senza riporto della quota giornaliera inutilizzata | API/SMTP; dichiarata archiviazione primaria in Francia e Germania; presenza di branding del fornitore nel piano gratuito; tracking email/relativi log da verificare e configurare secondo la politica privacy | https://help.brevo.com/hc/en-us/articles/208580669-FAQs-What-are-the-limits-of-the-Free-plan ; https://www.brevo.com/products/transactional-email/ ; https://help.brevo.com/hc/en-us/articles/360001005510-Data-storage-location ; https://help.brevo.com/hc/en-us/articles/209429285-Will-my-contacts-know-that-I-m-using-Brevo ; https://help.brevo.com/hc/en-us/articles/11643306229906-Can-I-anonymize-the-tracking-of-opens-and-clicks-for-my-emails |
| Resend Free | 100 email/giorno, piano gratuito con quota mensile secondo listino vigente | API compatibile con Next.js; DPA con SCC, subfornitori e possibili trasferimenti extra SEE da valutare; routing EU da non confondere con residenza di ogni dato | https://resend.com/pricing ; https://resend.com/legal/dpa ; https://resend.com/legal/subprocessors ; https://resend.com/security/gdpr |
| Aruba SMTP | Casella già prevista per contatti BIMARIS | Non presumere che SMTP ordinario sia un servizio campagne; policy Aruba vieta email di contenuto analogo a oltre 150 destinatari attraverso i server SMTP, con ulteriori vincoli contro invii massivi | https://hosting.aruba.it/documents/tc-files/it/7_policyutilizzoserviziaruba.pdf ; https://guide.aruba.it/hosting-e-domini/email/configurazione-posta/parametri-configurazione-posta |

## Decisione della Direzione Strategica — 18 novembre 2026
**Mantenere esclusivamente la casella ufficiale già esistente `info@bimarisnet.it` su Aruba, senza attivare Brevo, Resend o altri provider.** L'eventuale adozione di un servizio dedicato sarà rivalutata soltanto se i volumi e i requisiti tecnici lo renderanno necessario, dopo consenso esplicito e verifica economico-contrattuale.

La casella Aruba resta canale di corrispondenza e richieste privacy; **non è autorizzato alcun invio massivo o automatizzato da Aruba**. Il meccanismo di invio unico resta esclusivamente un progetto tecnico non implementato. Il confronto con gli altri servizi rimane storico e non è una raccomandazione di attivazione. Nessun costo aggiuntivo approvato.

## Verifiche rinviate al momento dell'eventuale invio
1. Misurare il numero di adesioni effettive, senza procedere ad alcuna spedizione.
2. Valutare limiti di utilizzo SMTP Aruba, requisiti di consenso, revoca, idempotenza e tutela dei dati.
3. Se necessario, sottoporre alla Direzione Strategica una proposta separata per un eventuale provider dedicato, includendo DPA, costi, limiti e valutazione privacy.
4. Non importare contatti in strumenti esterni né inviare email reali fino a una successiva autorizzazione esplicita.

## Regole di sicurezza
- Nessun token SMTP/API in GitHub, documenti, log o chat.
- Nessun invio manuale dalla casella Aruba a una lista di contatti senza processo di consenso/revoca.
- Non esporre l'area amministratore BIMARIS Production, non rimuovere SSO dal sito principale.
- La PR #58 resta in bozza; nessuna modifica a database, Vercel, DNS o Production con questa scheda.

Decisione aggiornata: **ARUBA — casella esistente confermata. NESSUN NUOVO PROVIDER. HOLD invii.**
