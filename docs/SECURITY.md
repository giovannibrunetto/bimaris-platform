# Security checklist

Prima di pubblicare BIMARIS in produzione:

1. Proteggere tutte le route `/admin` con autenticazione e controllo ruolo server-side.
2. Mantenere `SUPABASE_SERVICE_ROLE_KEY` esclusivamente sul server.
3. Aggiungere rate limiting agli endpoint pubblici, in particolare analytics e candidatura operatori.
4. Validare tutti i payload con schema validation.
5. Aggiungere CAPTCHA/anti-spam ai form pubblici.
6. Configurare CORS e Content Security Policy.
7. Separare development, staging e production.
8. Eseguire regolarmente audit dipendenze e aggiornamenti di sicurezza.
9. Configurare backup e retention del database.
10. Applicare la privacy by design: minimizzazione, consenso granulare e retention limitata dei dati analytics.

## DS-PRIVACY-QUESTIONARIO-01/V6 — gate specifici questionario cittadini (17-11-2026)

**Stato:** NO-GO raccolta reale. Questa checklist non autorizza modifiche Production o merge.
La CI e il test end-to-end in Staging sono PASS, ma non sostituiscono il rilascio.

1. **Production:** il progetto Supabase `vhvccwvcqdhiovpopsze` ("BIMARIS") risulta inattivo; non riattivarlo senza GO Production. Verificare separatamente la presenza delle migrazioni privacy e delle funzioni RPC in quel progetto. Non copiare gli invii sintetici da Staging.
2. **Doppio blocco di raccolta:** la route live richiede `VERCEL_ENV=production`, il progetto Supabase separato, l'impostazione `BIMARIS_SURVEY_COLLECTION_MODE=live`, i segreti server-side e un ritorno positivo da `citizen_survey_collection_open`. Il controllo DB richiede `enabled=true`, `staging_only=false`, approvazioni e versione privacy coerenti. Non aprire questi gate finché non sono soddisfatte tutte le condizioni.
3. **Backup nel piano Free:** lo script facoltativo `scripts/backup-survey-encrypted.sh` usa `pg_dump` e GPG per creare un dump cifrato dello schema `survey_private`, senza archiviare in chiaro il dump sul disco. **Non è attivo, non è schedulato e non costituisce un backup completo della piattaforma**: oggetti `public`, Auth, Storage, job pg_cron, variabili Vercel e configurazioni vanno protetti tramite procedure dedicate. Credenziali in un `PGSERVICE`/passfile protetto, mai nel repository. Conservare una copia esterna protetta e limitarne gli accessi; le copie contenenti dati cancellati devono scadere entro una finestra definita e documentata.
4. **Test di ripristino obbligatorio:** esportare un database di prova contenente solo record sintetici, cifrarlo, verificarne la decifratura, ripristinarlo in un'istanza PostgreSQL separata e vuota e confrontare righe, schema, vincoli, permessi e checksum. Annotare data, risultato, tempo misurato e procedure di cancellazione delle copie di prova. Non tentare mai un ripristino sul progetto Production o Staging durante il collaudo.
5. **RPO/RTO proposti, non certificati:** RPO 24 ore e RTO 48 ore, soggetti ad approvazione della Direzione Strategica e a una prova completa. Su Free il progetto può essere sospeso per inattività; predisporre un monitoraggio operativo non invasivo.
6. **Privacy e contratti:** documentare applicabilità dei DPA per gli account effettivi, elenco subfornitori, flussi fuori dallo SEE, log, backup e gestione delle revoche; sottoporre la precisazione `rehearsal=true` dell'informativa esistente alla titolare. Mantenere la versione approvata `2026-11-17-v2` finché non venga deliberata una modifica sostanziale.
7. **Contatti fittizi:** escludere sempre `rehearsal=true` dai risultati e da ogni futura lista di comunicazioni, oltre a rispettare consenso, revoche e scadenza. Nessuna funzione di invio email è attiva per il questionario.
8. **Rilascio:** richiede evidenze PASS del backup e ripristino, privacy/conformità, database Production, CI, sicurezza e un nuovo GO scritto. PR #57 rimane DRAFT fino all'autorizzazione.

**Evidenza del 17-11-2026:** la copia cifrata e il ripristino PostgreSQL end-to-end non sono stati certificati; nessun backup automatico è stato attivato. Non utilizzare questa procedura come attestazione di conformità o di recuperabilità già dimostrata.
