# DT-QA-SEC-R01 — Application HTTP

25 novembre 2026 — PR #58. Commit collaudato `88b0ebe780b19b152381c30bd2698ee1f1f14cba`.

Evidenza: https://github.com/giovannibrunetto/bimaris-platform/actions/runs/45617977357/job/139218250669

Workflow completed/success; 25 righe PASS: 10 preparatorie, 15 applicative. Per entrambe le identità sintetiche: GET notifiche proprie 200 con array, GET notifiche altrui 403, POST read-all altrui 403, POST revisione profilo e risposta collaborazione altrui 303 con indicatore forbidden, GET workspace proprio 200 con nome sintetico, GET workspace altrui 200 senza nome dell'esperienza sintetica altrui. GET notifiche anonimo 401.

Cumulativo delle quattro suite: 132 PASS inclusi setup (25 + 36 + 46 + 25). Limiti: HTML server-side, non browser; il controllo negativo workspace verifica assenza di uno specifico nome esperienza, non ogni possibile dato riservato. Notifiche proprie: forma della risposta, non contenuti positivi seminati. Mutazioni: risposta di diniego, non snapshot DB prima/dopo in questa suite. Restano UI browser, ulteriori rotte, immagini tramite proxy e ciclo revisioni. SEC-R01 PARTIAL PASS. Nessun merge, nessuna modifica a Staging o Production.
