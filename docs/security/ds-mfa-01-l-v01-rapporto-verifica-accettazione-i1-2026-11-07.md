# BIMARIS — DS-MFA-01/L-V01 — Rapporto definitivo di verifica e accettazione I-1

**Data:** 7 novembre 2026  
**Stato:** VERIFICHE PARZIALI; ACCETTAZIONE I-1 SOSPESA  
**Repository/branch:** `giovannibrunetto/bimaris-platform` / `feature/admin-individual-mfa`  
**Commit oggetto:** `507bd5d4108a4b33b208e74169a2e952a6ae9256`  
**Production:** NO-GO

## 1. Evidenze effettivamente raccolte

Lettura GitHub del branch per:
- `apps/web/lib/admin-policy-core.ts`, blob SHA `a9418e2a2ec1983248c4bd71965f9470129a9295`;
- `apps/web/lib/admin-policy.ts`, blob SHA `f0ad6cd825942e8e38fbfb4c3bf0d68fd8120c4b`;
- `apps/web/tests/admin-policy.test.mjs`, blob SHA `ffc95fc46b9c2eac8de5b2a38b2382d8c027d059`;
- `apps/web/lib/admin-access.ts`, blob SHA `cc191f7825762c02a33c54d87d46507f2b9f7777`.

Verifica dello stato commit GitHub: Vercel `success`, target `https://vercel.com/giovannibrunetto84-1508/bimaris-platform/GjRpbnGTTexKrVQTyvC7TgAtux3V`. Questo è uno stato esterno aggregato; non è una prova diretta dei quattro comandi richiesti.

## 2. Matrice PASS/FAIL/NON ESEGUITO

| Verifica | Comando o metodo | Ambiente | Risultato | Evidenza / limite |
|---|---|---|---|---|
| Presenza file policy/test | Lettura GitHub dei file sul branch | GitHub connector | **PASS** | SHA blob sopra |
| Assenza di integrazione nell'adapter preesistente | Lettura `admin-access.ts` | GitHub connector | **PASS statico** | Continua a importare soltanto `admin-auth` e `admin-mfa-guard`, non `admin-policy` |
| Nuova policy opt-in | Lettura `admin-policy.ts` | GitHub connector | **PASS statico** | Nessun cambiamento delle route/page esistenti da questi nuovi file |
| 8 test policy | `node --experimental-strip-types --test apps/web/tests/admin-policy.test.mjs` | Checkout repository non disponibile | **NON ESEGUITO** | Test definiti ma nessun output TAP |
| Typecheck web | `pnpm --filter @bimaris/web typecheck` | Checkout e pnpm assenti | **NON ESEGUITO** | Nessun log tsc |
| Test autenticazione esistenti | `pnpm test:auth` | Checkout e pnpm assenti | **NON ESEGUITO** | Nessun log test |
| Build web | `pnpm --filter @bimaris/web build` | Checkout e pnpm assenti | **NON ESEGUITO** | Stato Vercel success non prova esecuzione del comando |
| Regressione runtime admin | Browser/sessione non disponibili in ambiente corrente | Nessuna esecuzione | **NON ESEGUITO** | Compatibilità statica, non certificazione runtime |

## 3. Impedimento ambientale

L'ambiente di esecuzione disponibile espone Node `v22.16.0`, ma `pnpm` non è installato e non contiene un checkout del repository. Tentativo di accesso GitHub via `git ls-remote https://github.com/giovannibrunetto/bimaris-platform.git HEAD` non riuscito: `Could not resolve host: github.com`. Il connector GitHub consente lettura file e commit, ma non esecuzione arbitraria di comandi CI. Non sono stati introdotti nuovi servizi, dipendenze o costi.

## 4. Compatibilità e rischi residui

La nuova policy è isolata: nessuna route/page usa il nuovo modulo, il guard legacy-first esistente è invariato. Questo sostiene l'assenza di regressioni **per struttura del codice**, ma non certifica compilazione, test o comportamento runtime. Il ramo individuale rimane quello precedentemente collaudato in H, senza nuovo test in V01. Rischi: incompatibilità TypeScript non ancora escluse, possibile problema runtime del test runner TS, mancata regressione completa. Nessun difetto esecutivo dimostrato.

## 5. Modalità alternativa compatibile

Usare una checkout del branch su una macchina di sviluppo già autorizzata, con Node/pnpm previsti dal repository, oppure una pipeline CI **già esistente e autorizzata**, senza crearne una nuova e senza deployment aggiuntivi. Eseguire nell'ordine:
```bash
git checkout feature/admin-individual-mfa
git rev-parse HEAD
node --experimental-strip-types --test apps/web/tests/admin-policy.test.mjs
pnpm --filter @bimaris/web typecheck
pnpm test:auth
pnpm --filter @bimaris/web build
```
Registrare commit, versioni Node/pnpm, exit code, log completi, eventuali errori e guardia prebuild Staging. Nessun tentativo di correzione automatica in caso di FAIL: inviare diagnosi e richiesta di autorizzazione.

## 6. Accettazione e rollback

**Raccomandazione: NON ACCETTARE ANCORA I-1.** Il codice è depositato e la compatibilità statica è positiva, ma i criteri automatici non sono stati soddisfatti con prove di esecuzione. Nessun FAIL rilevato, ma i NON ESEGUITO non possono diventare PASS.

Rollback, se deliberato: revert dei commit I-1 `41fec8a1`, `47f3a1dc`, `03713066`, `b4eac86f`, `507bd5d4` (in ordine inverso e con verifica di eventuali dipendenze); nessun DB/RPC/secret modificato. Fasi I-2–I-7 non autorizzate; Production NO-GO.
