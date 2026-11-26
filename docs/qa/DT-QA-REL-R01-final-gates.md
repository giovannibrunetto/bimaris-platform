# DT-REL-R01 — Stato dei gate al 26 novembre 2026

## Evidenza accettata
- PR #58, commit `68effe07e4cbe707b2aad8d0394693b4e641801d`.
- Run 45771747476, job 139745769873: SUCCESS, 58/58 impronte, 4/4 oggetti sintetici, RLS 58/58, integrità referenziale, isolamento e servizio immagini, 39 secondi locali.
- GO limitato al recupero sintetico. Nessuna certificazione RTO/RPO operativo.

## Revisione del workflow storico
Repository privato bimaris-rel-r01, application-restore.yml, blob `2daed84d86fa8d1a641b850a89090ac25900bfdb`. La verifica storica usa PostgreSQL isolato, identificativi Auth simulati e un elenco di ripristino che esclude trigger, policy e RLS. Non verifica Storage e applicazione insieme. Non costituisce evidenza di recupero integrato effettivo.

## Gate ancora aperti
- Revisione autorizzata del piano di recupero effettivo con protezioni attive.
- Backup completo autorizzato e verifica della completezza; esclusione questionari e credenziali Auth reali secondo perimetro approvato.
- Collaudo isolato dei dati effettivi nel perimetro autorizzato, integrità e protezioni applicative.
- Verifica conservazione cifrata, RPO/RTO e approvazione finale.

Nessuna autorizzazione aggiuntiva, modifica dei privilegi, accesso ai dati effettivi, modifica Staging/Production o merge deriva da questa relazione. Stato complessivo PARTIAL PASS.
