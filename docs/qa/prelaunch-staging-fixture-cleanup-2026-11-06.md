# BIMARIS — Bonifica dei dati fittizi di Staging (piano non esecutivo)
Data: 2026-11-06 | Stato: PREPARATO / NON AUTORIZZATO ALLA CANCELLAZIONE
Ambiente: Supabase Staging `nzdeoimwikhoidtladnu`. Produzione: NO-GO.

## Premesse e condizioni
- Tutti gli account, gli operatori, le candidature e le esperienze attualmente usati per il QA sono fittizi, come confermato dalla Direzione Strategica.
- Non eseguire DELETE, TRUNCATE, DROP o rimozione oggetti Storage fino a completamento dei test e autorizzazione esplicita della bonifica.
- Separare i contenuti culturali dai dati commerciali/QA. Non cancellare in blocco le tabelle condivise.
- Eseguire un inventario nuovo immediatamente prima di qualunque cancellazione: i numeri seguenti sono una fotografia del 6 novembre 2026 e possono cambiare.

## Inventario verificato con SELECT
| Tabella | Record |
| --- | ---: |
| operators | 4 (0 published) |
| experiences | 7 (0 published) |
| experience_revisions | 10 |
| experience_revision_media | 15 |
| experience_media | 7 |
| experience_operators | 3 |
| experience_availability | 14 |
| experience_activity_links | 7 |
| experience_discovery_profiles | 7 |
| experience_discovery_intents | 11 |
| operator_revisions | 1 |
| operator_interest_manifestations | 6 |
| events | 4 |
| event_import_batches | 3 |
| culture_entries | 16 |
| stories | 11 |
| villages | 10 |
| places | 22 |
| itinerary_stops | 0 |

Altri dati di test rilevati in precedenti controlli (riverificare): 3 candidature accettate; 4 membership; 2 profili B2B; 46 user_behavior_events; 8 user_interests; 1 user_saved_items; 1 newsletter_preferences; 5 auth.users. I contenitori Storage segnalati: `culture-media` (contenuti editoriali, preservare) e `experience-media` (media QA da inventariare per percorso).
Controllo sui luoghi: 0 record `places` contemporaneamente riferiti da `operators` e `culture_entries` al 6 novembre 2026. Questo NON autorizza l'eliminazione generale di `places`.

## Percorso di bonifica da approvare dopo il QA
1. **Congelare la raccolta dati QA:** bloccare nuovi test che creano record; identificare gli account Auth di prova e stabilire quali eventuali utenti/amministratori debbano essere preservati. Non dedurre l'identità da solo da un indirizzo.
2. **Eseguire backup/estrazione mirata** di tutte le righe QA, degli identificativi e dei riferimenti Storage prima della cancellazione, con modalità conforme alla privacy e non nel repository pubblico.
3. **Verificare riferimenti esterni** alle esperienze e agli operatori: analytics, interessi manifestati, eventi, saved items, profili, preferenze e altre tabelle senza FK dirette. Non assumere che CASCADE copra dati testuali o JSON.
4. **Ripulire i dipendenti delle revisioni** prima delle revisioni stesse: `experience_revision_media`, poi `experience_revisions`. Gestire in modo esplicito i media `experience_media` perché la FK a `experiences` è NO ACTION; verificare anche il riferimento `source_media_id` (SET NULL).
5. **Ripulire le relazioni residue**: `experience_operators`, `experience_activity_links`, `experience_availability`, `experience_discovery_profiles`, `experience_discovery_intents`, eventuali `food_product_experiences`, `itinerary_stops`, `favorites`; verificare singolarmente quali cascades siano applicabili.
6. **Eliminare le sole 7 esperienze QA**, con controllo di conteggi e assenza di righe orfane. Le tabelle catalogo come `categories`, `experience_activities` e `discovery_intents` devono essere preservate.
7. **Ripulire le dipendenze degli operatori**: candidature collegate, membership, revisioni, B2B, manifestazioni di interesse e riferimenti degli eventi; la FK `events.operator_id` è SET NULL, quindi eliminare/valutare preventivamente gli eventi QA invece di lasciarli orfani.
8. **Eliminare i soli 4 operatori QA**, con controllo di eventuali dati residui e delle relazioni `places`; non eliminare `places` né `territories` senza audit separato sull'uso editoriale.
9. **Bonifica Auth**: eliminazione dei soli utenti fittizi tramite API di amministrazione Supabase dopo aver verificato sessioni e dipendenze dei profili. Non eliminare utenti con identità non classificata.
10. **Storage:** solo dopo inventario puntuale, eliminare i file QA nel bucket corretto tramite API Storage; non cancellare il bucket né i file `culture-media`. Evitare operazioni SQL dirette su `storage.objects` che lascerebbero file fisici orfani.
11. **Verifiche post-bonifica**: 0 operatori/esperienze/test accounts/eventi QA; nessun riferimento orfano; schede Cultura/Storie/Borghi e immagini editoriali invariati; RLS e URL diretti ancora corretti; staging protetto, robots noindex.
12. **Registrare un report finale** con conteggi prima/dopo, eccezioni motivate, identità dei record eventualmente conservati e autorizzazione della Direzione Strategica.

## Blocchi attuali
- HTTP negative test delle API amministrative: Vercel SSO intercetta il POST con 302 prima dell'API; non certificato.
- TOTP admin non configurato: richiede sessione di configurazione sicura.
- Non eseguire bonifica definitiva prima della chiusura dei collaudi.

## Rischi specifici delle relazioni FK
- `experience_revision_media.revision_id` -> `experience_revisions.id`: NO ACTION.
- `experience_media.experience_id` -> `experiences.id`: NO ACTION.
- `experience_revisions.experience_id` -> `experiences.id`: NO ACTION.
- `experience_operators.experience_id` -> `experiences.id`: NO ACTION.
- `operator_applications.operator_id` -> `operators.id`: NO ACTION.
- `operator_memberships.operator_id` -> `operators.id`: NO ACTION.
- `operator_revisions.operator_id` -> `operators.id`: NO ACTION.
- `events.operator_id` -> `operators.id`: SET NULL, non elimina gli eventi.

**Documento di pianificazione: non contiene script di cancellazione e non abilita alcuna esecuzione automatica.**
