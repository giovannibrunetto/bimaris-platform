# DT-QA-SEC-R01 — Storage HTTP

Data: 25 novembre 2026. PR #58, commit testato `317ba8b476cd12f1c9930d215f32848fdae91e9d`.

Evidenza: https://github.com/giovannibrunetto/bimaris-platform/actions/runs/45616496904/job/139213136791

Workflow SEC-R01 isolated Storage HTTP: completed / success. Log verificati: 46 righe PASS, messaggio conclusivo SEC-R01 STORAGE HTTP PASS; synthetic files; UI not covered.

14 preparatorie (10 Auth e fixture DB, 4 seed Storage), 32 controlli (8 per ciascuno dei 4 oggetti): lettura propria, diniego lettura cross-operatore e anonima, diniego sovrascrittura e inserimento cross-operatore, risposta cancellazione cross-operatore, integrità SHA-256 originale, assenza inserimento abusivo. La cancellazione può restituire successo senza rimuovere righe: l'integrità successiva prova la sopravvivenza dell'oggetto. Due identità sintetiche, bucket experience-media ed experience-revision-media, servizio Supabase locale temporaneo. Revisioni seed via service role senza corrispondente revisione applicativa; non certificato l'intero ciclo autorizzato di upload delle revisioni. Codici HTTP di diniego ammessi dal test non provano singolarmente la causa del diniego; integrità e assenza verificate separatamente.

Cumulativo con risultati precedenti riportati nel trasferimento: 25 + 36 + 46 = 107 PASS (inclusi setup). SEC-R01 PARTIAL PASS: UI e rotte applicative ancora aperte. Nessun merge, modifica remota DB o Production.
