# DT-QA-REL-R01 — Verifica indipendente copia Storage privata

25 novembre 2026 — PR #58. Copia ZIP recuperata integralmente da Google Drive mediante connettore autorizzato, metadati non condivisa. Calcolo SHA-256 indipendente sui byte scaricati e sul GPG interno, senza decrittazione o credenziali.

ZIP 7.718.630 byte: `3a38c779efb9c3df0972f98dd665cf25f4921731c89a80a35c752747e8c122de`.
GPG 7.718.428 byte: `b7ba9dc4b4def7099904ad317a391c6f3eac8c4f7553bb0fd7ef1aee5697416b`.
Entrambi corrispondono alle impronte attese; controllo CRC di tutte le voci ZIP senza errori. PASS integrità copia trasferita. Non è verifica indipendente della decrittazione o restore Storage API. Nessuna modifica a Drive, Staging o Production; nessun riattivazione ruoli backup. REL-R01 rimane aperto: acquisizione completa DB, ripristino coordinato e verifica accessi/bytes in target isolato.
