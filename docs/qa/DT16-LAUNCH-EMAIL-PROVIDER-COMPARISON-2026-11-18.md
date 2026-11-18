# BIMARIS — DT16 | Comparazione servizio di invio dell'annuncio unico
Data verifica: 18 novembre 2026
Stato: REVIEW ONLY — scelta preliminare, nessun account aperto, nessun dominio verificato, nessun token API, nessun invio di messaggi.

## Scopo
Inviare una sola comunicazione relativa al lancio di BIMARIS ai contatti che avranno esplicitamente aderito all'iniziativa nel questionario cittadini. Non è autorizzata l'introduzione di newsletter, promozioni ricorrenti o caricamenti di pubblici pubblicitari.

## Comparazione da fonti ufficiali (18 novembre 2026)
| Provider | Capacità piano gratuito | Altri aspetti | Fonti |
|---|---|---|---|
| Brevo Free | 300 email/giorno, senza riporto della quota giornaliera inutilizzata | API/SMTP; dichiarata archiviazione primaria in Francia e Germania; presenza di branding del fornitore nel piano gratuito; tracking email/relativi log da verificare e configurare secondo la politica privacy | https://help.brevo.com/hc/en-us/articles/208580669-FAQs-What-are-the-limits-of-the-Free-plan ; https://www.brevo.com/products/transactional-email/ ; https://help.brevo.com/hc/en-us/articles/360001005510-Data-storage-location ; https://help.brevo.com/hc/en-us/articles/209429285-Will-my-contacts-know-that-I-m-using-Brevo ; https://help.brevo.com/hc/en-us/articles/11643306229906-Can-I-anonymize-the-tracking-of-opens-and-clicks-for-my-emails |
| Resend Free | 100 email/giorno, piano gratuito con quota mensile secondo listino vigente | API compatibile con Next.js; DPA con SCC, subfornitori e possibili trasferimenti extra SEE da valutare; routing EU da non confondere con residenza di ogni dato | https://resend.com/pricing ; https://resend.com/legal/dpa ; https://resend.com/legal/subprocessors ; https://resend.com/security/gdpr |
| Aruba SMTP | Casella già prevista per contatti BIMARIS | Non presumere che SMTP ordinario sia un servizio campagne; policy Aruba vieta email di contenuto analogo a oltre 150 destinatari attraverso i server SMTP, con ulteriori vincoli contro invii massivi | https://hosting.aruba.it/documents/tc-files/it/7_policyutilizzoserviziaruba.pdf ; https://guide.aruba.it/hosting-e-domini/email/configurazione-posta/parametri-configurazione-posta |

## Raccomandazione preparatoria
**Brevo Free come candidato preferenziale**, soltanto per un progetto pilota a basso volume e in base ai limiti effettivamente concessi all'account. Stima costo marginale del piano gratuito: €0/mese entro quota e condizioni; non includere costi di upgrade, eventuali componenti aggiuntivi o branding removal senza preventivo. Non è un ordine o un'autorizzazione ad aprire servizi a nome del titolare.

Per il caso d'uso BIMARIS è opportuno privilegiare API server-side, dominio mittente verificato tramite SPF/DKIM/DMARC, separazione dell'archivio consensi dai contatti del fornitore, assenza di marketing automation aggiuntiva e riduzione dei dati condivisi al minimo. La casella info@bimarisnet.it può restare il canale per i diritti e le risposte.

## P0 prima di qualsiasi setup effettivo
1. Titolare identifica il soggetto che stipula il contratto, verifica DPA Brevo specifico e documenta subfornitori, trasferimenti, retention di messaggi e log e gestione richieste di cancellazione.
2. Verificare la possibilità pratica di disattivare, non soltanto anonimizzare, il tracking delle aperture e dei clic nel piano scelto; se impossibile, valutare implicazioni privacy e un provider alternativo.
3. Confermare il volume massimo di adesioni, il limite effettivo del piano, eventuali code del fornitore, branding gratuito e requisiti di verifica dominio.
4. Definire registrazione transazionale di prenotazione degli invii, idempotenza, stato `unknown` dopo timeout e gestione revoche, secondo `DT16-SINGLE-LAUNCH-ANNOUNCEMENT-DESIGN-2026-11-18.md`.
5. Testare con soli destinatari sintetici e indirizzi di collaudo di cui si ha il controllo (mai inviare su domini fittizi .invalid); non utilizzare ancora contatti raccolti dal sondaggio.
6. Solo dopo backup/restore Production verificato, privacy approvata e GO separato, configurare l'invio.

## Regole di sicurezza
- Nessun token SMTP/API in GitHub, documenti, log o chat.
- Nessun invio manuale dalla casella Aruba a una lista di contatti senza processo di consenso/revoca.
- Non esporre l'area amministratore BIMARIS Production, non rimuovere SSO dal sito principale.
- La PR #58 resta in bozza; nessuna modifica a database, Vercel, DNS o Production con questa scheda.

Decisione: **BREVO — shortlist preferenziale / HOLD attivazione**.
