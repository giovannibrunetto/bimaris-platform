# DS-CLEAN-02 — Registro di riconciliazione pre-lancio
Data: 2026-11-13
Stato: candidato tecnico PR #54 (DRAFT, NO MERGE)

## Base e provenienza
- Base del candidato: fix/ux-op-geo-autocomplete-20261113, discendente della catena PR #47 → #50 → #51 → #52, con modifica successiva alla geolocalizzazione.
- Modifiche operatore: PR #36 e PR #53 trasferite come contenuto dei file nel candidato; il trasferimento non modifica né chiude le PR originarie.
- Protezione CSRF: PR #49, incluse route, guardia e test; il file profile-revisions è stato riconciliato manualmente per mantenere sia la protezione CSRF sia le verifiche sulle revisioni profilo.
- Configurazione: test:auth esistenti mantenuti e ampliati con test CSRF; test:media aggiunti; workflow CI aggiornato.

## Matrice provvisoria delle PR preesistenti
| Origine | Stato nel candidato | Nota |
|---|---|---|
| #47 MFA/OAuth | Ereditata | Base amministrativa discendente, necessaria verifica runtime e privilegi |
| #50 Revisione amministrativa | Ereditata | Necessari test funzionali |
| #51 Approvazione revisioni | Ereditata | Necessari test funzionali |
| #52 Origine Storage | Ereditata | Migrazione da verificare con DB, non applicare automaticamente |
| #36 Area Operatore/B2B | Trasferita | Verificare la versione finale UX con autenticazione |
| #53 Fotografie | Trasferita | Eseguire collaudo autenticato 1/3/6 fotografie |
| #49 CSRF | Trasferita e riconciliata | Eseguire suite negativa e controllo origin |
| #39 e #42 UX amministrativa A1–A5 | Da riconciliare funzionalmente | Rami divergenti, non sovrascrivere i file più recenti |
| #40 / #44 / #45 OAuth | Da verificare come antecedenti della #47 | Verificare i contratti callback, non ripristinare vecchi flussi |
| #7 / #9 / #33 login storico | Da verificare come antecedenti | Non applicare redirect obsoleti senza prova di regressione |
| #41 Matching discovery | HOLD | Non integrata per precedente indicazione esplicita "bozza, non integrare" |

## Blocco prima dell'integrazione in staging
1. CI PASS per il candidato corrente e controllo che tutti i test siano effettivamente eseguiti.
2. Test autenticati su un solo URL Preview per login operatore e amministratore MFA.
3. Test foto 1, 3, 6, nuova esperienza e revisione, copertina, fallimento upload e retry.
4. Verifica del flusso di approvazione e degli URL Storage corrispondenti all'ambiente.
5. Confronto funzionale delle correzioni A1–A5, dei vecchi redirect e delle modifiche ancora HOLD.
6. Nessun merge, chiusura PR, cancellazione branch, migrazione DB o deployment Production fino a decisione esplicita.

## Regola di consolidamento
Gli stati “ereditata” e “trasferita” attestano la presenza di contenuto nel ramo, NON l’esito di un collaudo browser/autenticato né l’assenza di regressioni.

## Verifica puntuale DS-CLEAN-03 (2026-11-13)
- CI della PR #54, commit 3e1b34cc: SUCCESS. L'esecuzione successiva deve essere ricontrollata dopo l'aggiunta dei test OAuth storici.
- PR #42: il codice delle pagine candidature (lista e dettaglio), eventi, dettaglio operatore, componente AdminItineraryCreate e CSS admin-dashboard è equivalente alla versione del candidato, una volta normalizzato il solo cambio da autenticazione legacy a isAuthorizedAdmin. La lista operatori differisce sul link alle revisioni (nel candidato punta alla pagina di confronto aggiornata); admin-a9.css include anche gli stili MFA aggiuntivi. Non sovrascrivere.
- PR #39: alcune correzioni UX coincidono; altre modifiche sono divergenti rispetto alla successiva PR #42 e alla versione corrente (dashboard, filtri candidature, navigazione). Presente inoltre nella PR #39 il campo facoltativo Partita IVA nella candidatura e un diverso contratto di accettazione POST; questa funzionalità NON è ripristinata automaticamente perché richiede controllo sullo schema dati, sulle validazioni e su precedenti decisioni di prodotto. Residuo da verificare.
- PR #7/#9: la callback legacy instradava automaticamente in base alla membership; la callback attuale utilizza contesti espliciti operator=1/admin=1, safeAuthPath e il controllo MFA. Non ripristinare la vecchia callback.
- PR #33: il redirect invito operatore storico è sostituito dal callback attuale che associa l'intento operatore; l'endpoint corrente include CSRF, controllo di transizione e verifica associazione candidato-operatore. Non ripristinare il vecchio endpoint.
- PR #45: suite storica admin-oauth-callback-staging.test.mjs recuperata e aggiunta a test:auth del candidato, per conservare verifica esplicita della callback OAuth condivisa.
- Stato finale: riconciliazione documentale avanzata, nessun GO al merge fino a CI corrente PASS, confronto residuo Partita IVA e test autenticati. La PR #41 rimane HOLD.
