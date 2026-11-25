# DT-QA-MIG-R04 — Relazione di collaudo
Data: 2026-11-25. Riferimento DS-PRELAUNCH-QA-05.
Stato: PASS replay diagnostico e confronto strutturale selezionato; HOLD riconciliazione registro, merge e Production.

## Evidenze
- PR #58; commit collaudato 0e4923e6b90c5bb2091134366b34fdb9acfc534c.
- Run 45609253202, job 139188175898, conclusion success. https://github.com/giovannibrunetto/bimaris-platform/actions/runs/45609253202
- PostgreSQL 17, Supabase CLI 2.122.1, runner temporaneo, credenziali remote non utilizzate.
- 149 migrazioni storiche (68+81) e 10 file integrativi PR58; 159 applicate in avvio e 159 in reset, senza seed.
- Dopo reset, applicazione transazionale della riconciliazione diagnostica observed-staging-reconciliation.sql.
- Confronto normalizzato MD5 del catalogo: 2264/2264 corrispondenti, zero missing/extra/different.
- Tabelle 58; colonne 589; vincoli 198; funzioni 39; privilegi di esecuzione 117; privilegi tabelle 1003; indici 139; politiche 95; sequenze 4; trigger 20; viste 2.
- Esclusioni esplicite: 8 funzioni pubbliche questionari e 24 verifiche privilegi; schema survey_private; migrazioni survey e ruoli temporanei backup. Nessuna copia dati applicativi, utenti Auth o file Storage.

## Limiti
Il replay usa una sequenza diagnostica separata dai file operativi. La corrispondenza non certifica la ricostruibilità dalla sola directory supabase/migrations, il comportamento runtime, tutti gli oggetti dei cataloghi, i privilegi a livello colonna/schema/sequenza, i bucket, il ripristino dei dati o la sicurezza complessiva. Normalizzazione spazi e MD5 sono strumenti diagnostici, non prova di equivalenza semantica assoluta. La riconciliazione finale è stata eseguita una volta dopo il reset, non in entrambe le ricostruzioni.
## Proposta di riconciliazione formale
1. Conservare immutati file operativi, registro remoto e prove diagnostiche.
2. Redigere matrice per ogni versione/nome/hash: corrispondente, equivalente con differenze testuali, superata da versione successiva, mancante, esclusa o da verificare. Non assumere che una definizione finale coincidente dimostri l'esecuzione storica della migrazione.
3. Analizzare separatamente 10 file integrativi e differenze B2B/visibilità/MFA recuperate; individuare eventuali file operativi non inclusi e verificare dipendenze.
4. Proporre baseline canonica per installazioni nuove e strategia di adozione per ambienti esistenti, senza riapplicazione indiscriminata.
5. Collaudare entrambe le strategie in ambiente isolato prima di richiedere approvazione specifica per qualsiasi modifica del registro Staging. Nessuna registrazione fittizia di migrazioni non dimostrate.
6. Mantenere REL-R01 distinto: backup protetto, ripristino effettivo e coerenza DB/Storage. Mantenere SEC-R01 test Auth/API distinti.
## Decisione
GO documentazione e progettazione riconciliazione; nessuna autorizzazione implicita a riparare il registro remoto. HOLD merge PR58, NO-GO Production. Nessuna modifica a Staging o Production durante questo collaudo.
