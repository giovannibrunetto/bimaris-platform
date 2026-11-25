# DT-QA-SEC-R01 — Proxy immagini

25 novembre 2026 — PR #58. Commit collaudato `dee19b1c0efe65c7a94aded4d777f75e09b862e1`.

Evidenza: https://github.com/giovannibrunetto/bimaris-platform/actions/runs/45622234547/job/139233119356

Workflow completed/success. 50 PASS: 10 preparatorie e 40 specifiche (20 per operatore). Rotta reale /api/experience-photo: lettura propria bozza/revisione 200 con MIME e SHA-256 corretti; accesso altrui e anonimo negato 404 corpo vuoto; oggetto orfano, selettore bucket errato e traversal negati; pubblicazione rende accessibile immagine ordinaria, non revisione; ritiro operatore o esperienza revoca accesso pubblico e conserva accesso proprietario. Header cache private/no-store, nosniff e same-origin verificati nelle risposte positive.

Cumulativo sei suite: 217 PASS inclusi setup (25+36+46+25+35+50). Limiti: transizioni simulate via database locale; revisioni e media inseriti come fixture da service role locale. Nessun collaudo dell'intero flusso di approvazione o degli accessi admin in questa suite. SEC-R01 PARTIAL PASS; resta ciclo autorizzativo revisioni. Nessun merge, nessuna modifica Staging o Production.
