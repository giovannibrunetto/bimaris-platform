# DT-QA-SEC-R01 — Ciclo autorizzativo revisioni

25 novembre 2026 — PR #58. Commit collaudato `2741ad2dc0a7c684adc260d063fca384520c2096`.

Evidenza: https://github.com/giovannibrunetto/bimaris-platform/actions/runs/45624337194/job/139240442032

Workflow completed/success. 56 PASS: 10 preparatorie e 46 specifiche, 23 per operatore. Creazione bozza con inizializzazione dal live, modifica propria, associazione copertina, isolamento lettura/inserimento/modifica cross-tenant, blocco autoapprovazione, invio pending e immutabilità successiva. RPC privilegiata negata a owner, altro operatore e anonimo. Rotta admin locale 303 verso /admin/login per tutti e tre; richiesta cross-site 403 invalid_site. Esperienza live invariata prima dell'applicazione; RPC service_role locale applica revisione, conserva pubblicazione, owner e stato approved, registra reviewed_at e applied_at; doppia applicazione negata e nessuna variazione conseguente.

Cumulativo sette suite: 273 PASS inclusi setup (25+36+46+25+35+50+56). Non si contano esecuzioni fallite precedenti. Limiti: il gate admin vieta ambiente locale, quindi diniego HTTP non isola la verifica del ruolo o AAL2 da quella ambientale; approvazione positiva via RPC service_role non equivale ad approvazione HTTP con Super Admin MFA. Nessuna modifica o bypass della protezione. Copertina esistente riassociata, non promozione end-to-end di nuovo file privato. Non collaudate richiesta correzioni e reinvio in questa suite. SEC-R01: PASS per perimetro isolato verificato; chiusura integrale HOLD, residuo percorso amministrativo positivo con MFA in ambiente esplicitamente autorizzato. Nessun merge, nessuna modifica Staging o Production.
