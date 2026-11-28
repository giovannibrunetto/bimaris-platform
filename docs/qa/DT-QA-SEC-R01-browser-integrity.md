# DT-QA-SEC-R01 — Browser e integrità

25 novembre 2026 — PR #58, commit verificato `d3d42b3e35cbda9ab8e86d04ab660d60cd5a1b2a`.

Evidenza: https://github.com/giovannibrunetto/bimaris-platform/actions/runs/45621471213/job/139230474410

Workflow completed/success. 35 PASS: 10 preparatorie e 25 browser/integrità. Due sessioni Chromium distinte con identità sintetiche, viewport 390x844. Accesso proprio, diniego workspace altrui, notifiche proprie seminate e assenza notifiche altrui, diniego endpoint foreign GET e read-all, targeted foreign write con risposta 200 ma nessuna modifica, tentativi profilo/collaborazione con risposta redirect manuale. Snapshot invariati per operators, experiences, operator_memberships, operator_revisions, experience_operators e operator_notifications. HTTP anonimo iniziale 200 senza header Location, assenza dei due marker esperienza privata verificata con assert aggiuntiva; navigazione effettiva verso /accedi/operatore con next esatto dopo attesa esplicita. Nessun dato reale.

Cumulativo delle cinque suite: 167 PASS inclusi setup (25+36+46+25+35). Limiti: le richieste di mutazione browser sono fetch, non interazioni sui pulsanti; le sessioni sono inizializzate con cookie da Auth reale, non login UI. Snapshot limitati alle righe sintetiche selezionate nelle sei tabelle. Redirect anonimo verificato nel browser, non un 3xx HTTP immediato. Restano proxy immagini e ciclo autorizzativo revisioni. SEC-R01 PARTIAL PASS. Nessun merge, nessuna modifica Staging o Production.
