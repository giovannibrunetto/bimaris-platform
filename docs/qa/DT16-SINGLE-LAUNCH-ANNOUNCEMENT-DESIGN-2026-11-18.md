# BIMARIS — DT16 | Progetto per un solo annuncio del lancio
Data: 18 novembre 2026
Stato: REVIEW ONLY / NON ATTIVO — nessuna spedizione, nessun DDL, nessuna modifica alla privacy o alla protezione Vercel.

## Evidenze online (Staging e PR #58)
- Staging: `survey_private.launch_contacts` ha `email` univoca, `consent_at`, `consent_text`, `consent_version`, `privacy_version`, `purpose`, `launch_announced_at` e `rehearsal`.
- Un solo contatto Staging, marcato `rehearsal=true`; nessun contatto ha il campo `launch_announced_at` valorizzato. Nessun indirizzo è stato letto.
- Il candidato Production V8 usa `ON CONFLICT(email) DO NOTHING`. Previene la duplicazione del record contatto, **non** un doppio invio esterno.
- Nessuna funzione di invio email del questionario rilevata nelle routine PostgreSQL ispezionate. Provider di spedizione non ancora scelto né contrattualmente validato.
- I contatti test non devono mai essere inclusi nell'annuncio.

## Requisito
Una sola comunicazione relativa al lancio BIMARIS, esclusivamente agli indirizzi con consenso valido per `single_launch_announcement`, non revocato, senza newsletter o successive promozioni. Testo applicativo attuale del consenso `launch-only-v1` da mantenere coerente in ogni punto del flusso.

## Architettura proposta, non implementata
1. Creare *solo dopo GO* una campagna logica di annuncio, inizialmente `disabled`, con attivazione manuale esclusiva della titolare e controllo degli accessi amministrativi con MFA.
2. Mantenere un registro privato delle spedizioni con chiave univoca (campagna, destinatario) e stati almeno `pending`, `reserved`, `sent`, `unknown`, `suppressed`, `failed`.
3. Prenotare atomicamente il destinatario prima dell'invio per evitare concorrenza. Verificare che il contatto esista e abbia `rehearsal=false`, consenso/finalità/versione validi, non sia scaduto, non sia già contattato e non sia revocato/soppresso.
4. Riconvalidare la revoca **immediatamente prima** della chiamata al provider, coordinando prenotazione, cancellazione e invio. La semplice query non elimina completamente la race condition: richiede una politica per gli invii già in volo.
5. In caso di conferma inequivocabile del provider, registrare `sent` e `launch_announced_at`; in caso di timeout o esito ignoto, `unknown` e nessun retry automatico finché non vi sia riconciliazione affidabile.
6. Preferire, quando realmente disponibile, un'idempotency key supportato dal provider. Nessun sistema distribuito può garantire a priori una consegna esattamente una volta senza cooperazione del provider.
7. Impedire una successiva reintroduzione di contatti revocati tramite esportazioni/backup o importazioni. Valutare una soppressione minimizzata con HMAC dedicato e retention limitata: è dato pseudonimo, non anonimo; necessita base giuridica e approvazione.
8. Dopo la campagna cancellare contatti e prove del consenso nei termini approvati, coordinando la cancellazione con retention automatica e backup. Limitare log e audit a metadati essenziali senza indirizzi visibili.
9. Le operazioni di amministrazione vanno tenute **fuori** dal progetto Vercel pubblico del questionario. Non riutilizzare in Production il Super Admin attualmente vincolato allo Staging.

## Bloccanti
- **P0** Definire/approvare il provider email, DPA, subfornitori, retention log, limiti di invio e credenziali server-side.
- **P0** Procedura reale per revoche e cancellazioni; simulare revoca durante la prenotazione e prima dell'invio.
- **P0** Registro idempotente, gestione timeout/esito incerto e prevenzione di duplicati; test di concorrenza con soli dati sintetici.
- **P0** Backup Production ripristinabile e verifica che un restore non reintroduca destinatari cancellati.
- **P1** Collaudare segnalazioni errori, report di invio, recupero manuale e invio unico anche dopo riavvio del processo.
- **P1** Approvazione finale del testo di una sola comunicazione e del canale di contatto.

## Collaudo sintetico richiesto
- Contatto senza consenso: 0 invii.
- Contatto di prova `rehearsal=true`: 0 invii.
- Contatto revocato o scaduto: 0 invii.
- Due processi concorrenti: massimo una prenotazione.
- Conferma provider: un solo stato `sent`.
- Timeout provider: stato `unknown`, nessun invio automatico ripetuto.
- Revoca mentre l'invio è in coda: blocco se non ancora trasmesso.
- Ripristino backup: nessuna reintroduzione operativa di contatti revocati.
- Ripetizione campagna e riavvio: nessuna seconda spedizione.

**Decisione:** soltanto progettazione. PR #58 rimane DRAFT; schema Production, raccolta reale, invio email, merge e apertura pubblica restano in HOLD. SSO del sito principale BIMARIS sempre attivo.
