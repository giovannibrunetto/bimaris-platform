# DS-REL / DS-MFA / DS-OP-IDENTITY — Piano di riconciliazione selettiva
Data: 2026-11-11
Stato: ANALISI COMPARATIVA COMPLETATA; MERGE NON AUTORIZZATO

## Confronto GitHub
feature/admin-individual-mfa vs fix/ds-ux-admin-02-a1-a5: rami divergenti.
Nel confronto base=feature/admin-individual-mfa head=fix/ds-ux-admin-02-a1-a5: 43 commit ahead, 153 behind.
File comuni modificati: apps/web/app/admin/operatori/page.tsx; apps/web/app/admin/candidature/page.tsx; apps/web/app/admin/operatori/[id]/page.tsx; apps/web/app/admin/page.tsx.
apps/web/app/api/operator-applications/route.ts contiene evoluzioni sul ramo UX non presenti sul ramo MFA.

## Ordine proposto
1. Conservare feature/admin-individual-mfa come sorgente di getVerifiedSuperAdmin(), isAuthorizedAdmin(), protezione origin e relativi test.
2. Conservare da fix/ds-ux-admin-02-a1-a5 i cambi UX A1-A5 e il comportamento multi-candidatura, verificando regressione.
3. Integrare in un ramo temporaneo dedicato, mai direttamente su staging o main, con risoluzione manuale dei file condivisi.
4. Non modificare le rotte privilegiate per ripristinare isAdminAuthenticated() legacy.
5. Eseguire lint, typecheck, test unitari, test MFA individuale aal2 e revoca, test UX 360/390/430, candidature multiple e isolamento operatori.
6. Solo dopo QA e autorizzazione Direzione Strategica, valutare PR separata verso staging.
7. Mantenere DS-OP-IDENTITY-01 account-linking disattivato finché il gate MFA non è confermato.

## Divieti
Nessun merge; nessun deployment; nessuna modifica a Production; nessuna associazione automatica di account e operatori.
