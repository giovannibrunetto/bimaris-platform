# DS-UX-REV-02 — Collaborazioni durante una revisione approvata

Stato: progetto esecutivo di sicurezza, nessuna modifica schema applicata. Collegato alla PR #54 (DRAFT).

## Vincoli accertati

- La tabella pubblica `experience_operators` conserva partecipanti e consenso (`approval_status`). Non va alterata da una proposta dell'operatore sull'esperienza approvata.
- L'endpoint `/api/operator/collaborations/invite` opera soltanto su esperienze non pubblicate in stato `draft` / `rejected`; non deve essere riutilizzato sulle esperienze approvate.
- La revisione esistente registra contenuti, media e tassonomia; l'attuale RPC amministrativa non applica variazioni dei partner.
- La PR #54 rifiuta `collaboration_change`, `partner_operator_id`, `partner_activity_label`, `partner_consent_id` in approvazione fino alla distribuzione e al collaudo del flusso dedicato.

## Flusso previsto

1. L'operatore responsabile presenta sulla revisione una proposta distinta: **invariata**, **rimozione**, **cambio attività dello stesso partner**, **sostituzione del partner**.
2. La proposta viene memorizzata in un record separato, vincolato a `revision_id`, in stato `draft`; la riga approvata di `experience_operators` non viene toccata.
3. Per cambio attività o sostituzione è richiesto un nuovo consenso esplicito del partner proposto. La nuova partecipazione resta `pending` fino a conferma firmata dall'identità autenticata e autorizzata del partner.
4. La proposta può essere inviata all'amministratore solo con consenso `accepted` in caso di nuovo partner o attività diversa; per rimozione si applica il percorso di notifica e verifica delle eventuali responsabilità contrattuali prima dell'approvazione.
5. L'amministratore vede **prima/dopo**, identità del partner, ruolo, attività e stato del consenso, senza pulsanti che implichino adesione automatica.
6. L'approvazione applica **in una sola transazione** contenuti, media, tassonomia e collaborazione, verificando che la versione pubblica e i consensi non siano cambiati rispetto allo snapshot. In caso di conflitto si annulla l'intera approvazione.
7. Rifiuto/annullamento preservano le associazioni originali; la precedente collaborazione rimane visibile fino alla fine dell'approvazione.

## Sicurezza e RLS richieste prima dello sviluppo

- `revision_id` deve appartenere a una revisione dell'esperienza del richiedente, con ruolo owner/manager verificato server-side.
- Consenso del partner verificato sulla sua membership authenticated, non via dati invocati dal browser, email o JWT user_metadata.
- Unique constraint sulla proposta per revisione, FK a revision/partner, stati espliciti con timestamp e autore.
- Nessun aggiornamento diretto delle righe approvate tramite API di invito; CSRF/origin validation su tutte le azioni server.
- La conferma del partner va invalidata se cambiano attività, identità, termini essenziali o contenuto rilevante.
- Autorizzazione dell'admin individuale e MFA obbligatorio confermati sullo stesso percorso di approvazione esistente.
- Test: cambio stesso partner, sostituzione, consenso mancante, rifiuto, revoca, cambio contemporaneo, multi-tenant, admin senza MFA, approvazione parziale impossibile.

## Criterio di GO

Solo dopo migrazione controllata in **Supabase Staging**, collaudo RLS/consensi, test end-to-end delle transizioni, CI PASS e autorizzazione distinta al merge. Production rimane HOLD.
