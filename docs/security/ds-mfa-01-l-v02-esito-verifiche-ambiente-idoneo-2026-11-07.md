# BIMARIS — DS-MFA-01/L-V02 — Esito verifiche in ambiente idoneo

**Data:** 7 novembre 2026  
**Repository:** `giovannibrunetto/bimaris-platform`  
**Branch:** `feature/admin-individual-mfa`  
**Commit esaminato:** `57874b63d7f5074cb66d57409c16e8ebb1737c97`  
**Stato:** BLOCKED — I-1 NON ACCETTATA — Production NO-GO

## 1. Ricognizione della pipeline GitHub Actions

**File letto tramite connettore GitHub:** `.github/workflows/ci.yml` sul branch indicato.

Configurazione effettiva:
- `on.push.branches: [main, staging]`;
- `on.pull_request` senza filtro di branch;
- **nessun `workflow_dispatch`**;
- runner `ubuntu-latest`, checkout v4, pnpm/action-setup v4, setup-node v4 con Node 22;
- `pnpm install --no-frozen-lockfile`;
- `pnpm --filter @bimaris/web lint`;
- `pnpm --filter @bimaris/web typecheck`;
- `pnpm --filter @bimaris/mobile typecheck`;
- `pnpm test:auth`;
- `pnpm --filter @bimaris/web build`.

La pipeline non include `node --experimental-strip-types --test apps/web/tests/admin-policy.test.mjs`: anche un'esecuzione riuscita non coprirebbe gli otto test nuovi. La build attiva `apps/web/package.json` `prebuild: node scripts/mfa-staging-smoke.mjs`; prima di un'esecuzione occorre verificare i suoi effetti, le variabili e la destinazione. La pipeline non contiene step di deploy espliciti, ma push/PR possono attivare integrazioni Vercel esterne al workflow: non è stata verificata la loro assenza. Pertanto non è stato creato alcun push/PR per forzare CI.

**Query eseguita:** `fetch_commit_workflow_runs` sul commit `57874b63...`: **zero workflow runs restituiti**. Limite dell'interfaccia: elenca soltanto run associate a pull request; il risultato non prova che nessuna run di altra natura sia mai esistita.

## 2. Ambiente locale

Comandi effettivamente eseguiti:
```bash
node -v
# v22.16.0
command -v pnpm
# nessun percorso restituito
git ls-remote https://github.com/giovannibrunetto/bimaris-platform.git HEAD
# fatal: unable to access ... Could not resolve host: github.com
```

Nessun checkout del repository individuato nella directory di lavoro accessibile. Non sono stati installati pacchetti o introdotti servizi. L'ambiente non può eseguire i comandi richiesti sul commit reale.

## 3. Matrice esiti

| Verifica | Comando richiesto / metodo | Esito | Evidenza / limite |
|---|---|---|---|
| Pipeline preesistente | lettura `.github/workflows/ci.yml` | PASS ricognizione | trigger e step verificati |
| Otto test policy | `node --experimental-strip-types --test apps/web/tests/admin-policy.test.mjs` | **BLOCKED** | assenti da CI; checkout locale indisponibile |
| Typecheck web | `pnpm --filter @bimaris/web typecheck` | **BLOCKED** | presente in CI ma nessuna run utilizzabile sul commit |
| Suite autenticazione | `pnpm test:auth` | **BLOCKED** | presente in CI ma nessuna run utilizzabile sul commit |
| Build web Staging | `pnpm --filter @bimaris/web build` | **BLOCKED** | presente in CI; trigger non idoneo senza azione ulteriore e rischio di deploy esterno da verificare |
| Isolamento policy | lettura file I-1 e `admin-access.ts` (evidenze V01) | **PASS statico limitato** | nuova policy opt-in; nessuna integrazione dichiarata nelle route, non una ricerca esaustiva dell'intero repository |
| Compatibilità legacy e MFA | confronto statico adapter esistente (V01) | **PASS statico limitato** | nessuna regressione runtime dimostrata; MFA non ancora universalmente obbligatoria |
| Regressione applicativa | test suite e runtime | **BLOCKED** | nessuna esecuzione sul commit |

**Nessun FAIL dimostrato. Nessun PASS attribuito a test non eseguiti.**

## 4. Alternative valutate

**A — GitHub Actions esistente:** non utilizzabile per copertura completa senza modifica del workflow o esecuzione separata degli otto test; `workflow_dispatch` assente; trigger push/PR non avviati per rispetto del vincolo no nuovi deployment e assenza di valutazione degli effetti collaterali Vercel. **BLOCKED**.

**B — ambiente locale corrente:** Node 22 presente, pnpm e checkout assenti, accesso git HTTPS bloccato da DNS. **BLOCKED**.

**C — GitHub connector:** consente lettura codice, stato commit e run; non offre una funzione di esecuzione arbitraria di comandi nel repository. **NON IDONEO** a certificare la suite.

**D — ambiente sviluppo preconfigurato esterno:** non è stato identificato un runner già configurato e accessibile. **NON VERIFICATO**; non inventare disponibilità.

## 5. Raccomandazione

**I-1 resta IMPLEMENTATA — ACCETTAZIONE SOSPESA.** Non autorizzare I-2 né Production.

Percorso preferito: individuare un ambiente di sviluppo già configurato con checkout e pnpm (ad esempio macchina personale autorizzata) ed eseguire esattamente i quattro comandi sul commit fissato, registrando `git rev-parse HEAD`, versioni Node/pnpm, exit code e log. Prima di eseguire la build, verificare `scripts/mfa-staging-smoke.mjs` e variabili Staging, senza modificare segreti. In alternativa, una successiva delibera specifica può autorizzare un meccanismo CI idoneo **senza deploy**, ma V02 non autorizza modifiche workflow o nuovi deployment.

In caso di FAIL: fermarsi, diagnosi e proposta di correzione, senza modifiche automatiche. Nessuna modifica a codice, DB, RPC, configurazioni o Production è stata effettuata durante V02.
