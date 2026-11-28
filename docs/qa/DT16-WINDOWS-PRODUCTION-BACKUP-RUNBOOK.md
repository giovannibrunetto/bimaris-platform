# BIMARIS DT16 — Esecuzione del backup cifrato su Windows

**Stato: procedura pronta, backup Production NON eseguito.**

## Requisiti da predisporre sul PC autorizzato
- Python 3, PostgreSQL client **17.x compatibile con il server 17.11** (`pg_dump`, `pg_restore`) e GnuPG (`gpg`).
- Cartella di backup locale protetta, su unità cifrata, **esterna al repository BIMARIS**.
- Chiave pubblica GPG del destinatario autorizzato: verificare personalmente l'impronta digitale di 40/64 caratteri. Non caricare la chiave privata in GitHub, in chat o su Vercel.
- Collegamento PostgreSQL autorizzato letto da `PGSERVICE` (file libpq `pg_service.conf`) e password protetta tramite `PGPASSFILE`; configurare la connessione attraverso la schermata **Connect** del progetto Supabase Production `vhvccwvcqdhiovpopsze`, evitando connessioni di Staging.

**Non incollare mai password, URI con password, file pgpass, chiavi private o contenuto del dump nelle conversazioni.**

## Verifiche preliminari (PowerShell Windows)
```powershell
py --version
pg_dump --version
pg_restore --version
gpg --version
```
La versione del client `pg_dump` deve poter esportare il server PostgreSQL 17.11. Verificare la connessione in sola lettura con un client approvato; la semplice presenza di `PGSERVICE` non prova la connessione al progetto corretto.

## Esecuzione (solo dopo approvazione del trattamento e della destinazione)
Da una finestra PowerShell aperta sul PC autorizzato, impostare **solo riferimenti a file già protetti e il fingerprint pubblico**:
```powershell
$env:PGSERVICE = "bimaris_production_backup"
$env:PGPASSFILE = "$env:APPDATA\postgresql\pgpass.conf"
$env:BIMARIS_BACKUP_DIR = "D:\BackupRiservati\BIMARIS"
$env:BIMARIS_GPG_RECIPIENT = "<impronta-pubblica-verificata>"
$env:BIMARIS_BACKUP_CONFIRMATION = "BACKUP_ONLY_NO_RESTORE"
py scripts/backup-production-windows.py
```
Sostituire i valori di esempio con quelli autorizzati. Non inviare in chat i file di configurazione delle connessioni. Lo script usa una pipeline binaria `pg_dump -> gpg`; non crea copie non cifrate su disco. Se `pg_dump`, `gpg` o l'ispezione `pg_restore --list` falliscono, elimina il file temporaneo e segnala BLOCKED. Questa verifica non equivale al ripristino effettivo.

## Gate obbligatorio successivo
1. Archivio cifrato creato: verificare dimensione, accessi e destinazione fuori repository.
2. Verificare l'inventario degli oggetti presenti nell'archivio, inclusi schemi `public`, `auth`, `storage`, sequenze, funzioni, ACL e tabelle. Un dump PostgreSQL dipende dai privilegi dell'utente: **non garantisce** da solo l'esportazione di tutti gli oggetti Supabase.
3. Completare l'inventario esterno per ruoli/globali, configurazioni del progetto, Storage file bodies, eventuali integrazioni.
4. Verificare un **ripristino completo in un database diverso da Production**, con evidenza dei conteggi e zero errori bloccanti.
5. Solo dopo il PASS indipendente e l'autorizzazione della Direzione Strategica preparare/applicare una migrazione Production dedicata con raccolta comunque disabilitata.

**Mai eseguire un ripristino sul database Production per testare il backup.**

## Evidenza
- Test sintetico Linux eseguito con successo su `scripts/backup-production-windows.py` con PostgreSQL simulato e una chiave GPG temporanea; cifratura, ispezione, eliminazione del file incompleto PASS.
- Il test è anche incluso nella CI sul ramo di lavoro.
- Questa documentazione non costituisce attestazione di backup o restore Production.
