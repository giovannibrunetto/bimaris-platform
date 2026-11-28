# DS-MAI-VISIBILITY-01 — Separazione della scoperta territoriale dalla Rete BIMARIS

**Data:** 23 novembre 2026  
**Stato:** decisione strategica approvata; vincolo per la futura integrazione MAI; nessuna acquisizione reale autorizzata.

## 1. Principio
MAI è un motore di acquisizione informativa, non una fonte di offerte riconducibili agli operatori aderenti. Gli eventi esterni rilevati da MAI devono rimanere distinguibili dalle esperienze create e gestite dagli operatori BIMARIS, incluse quelle nate da collaborazioni.

## 2. Visibilità per origine

| Superficie | Operatori BIMARIS pubblicati | Esperienze BIMARIS pubblicate (anche collaborative) | Eventi esterni MAI |
| --- | --- | --- | --- |
| Rete BIMARIS (`/rete-bimaris`) | Sì | Sì | **No** |
| Ricerca centrale «Cosa vuoi fare oggi?» | Secondo pertinenza | Sì, secondo pertinenza | **Sì, solo se verificati e pubblicati** |
| Catalogo dedicato agli operatori (`/operatori`) | Sì | Collegamenti dell'operatore | **No** |
| Vetrina/catalogo esperienze operatori | Collegamenti delle esperienze | Sì | **No** |

**Nota di implementazione:** l'attuale `/esperienze` contiene anche una sezione appuntamenti storicamente esistente. Prima di collegarvi MAI bisogna evitare che gli eventi di origine MAI vi entrino per effetto di una query generica. La migrazione/segmentazione del catalogo è un gate dell'integrazione MAI; questa decisione non autorizza a cancellare o nascondere oggi gli appuntamenti già pubblicati.

## 3. Requisiti al momento dell'integrazione

1. Salvare in DB la provenienza dell'evento (origine `MAI`/esterna, identificativo fonte e URL, timestamp dell'ultima verifica) in modo robusto, senza sovrapporre gli eventi alle tabelle di offerte e collaborazioni degli operatori.
2. MAI popola soltanto la coda di revisione. Nessun evento MAI appare nella ricerca prima della verifica amministrativa e della pubblicazione esplicita.
3. La ricerca principale unifica i risultati per pertinenza, data e luogo, mantenendo un marcatore di provenienza riconoscibile. La rilevanza dell'utente prevale sull'appartenenza alla rete; a parità di pertinenza è possibile valorizzare l'offerta di rete.
4. Qualunque query che alimenti `/rete-bimaris` e il catalogo delle **esperienze degli operatori** deve escludere espressamente gli eventi con provenienza MAI.
5. La presenza di un evento esterno non crea un profilo operatore, un'esperienza BIMARIS, una collaborazione, un diritto di prenotazione o un'informazione promozionale.
6. Limitare l'acquisizione ai campi informativi già autorizzati da DS-MAI-03/V2; non importare foto, locandine, descrizioni promozionali o testi integrali di terzi.
7. Gestire versioni, duplicati, annullamenti, date scadute e collegamento alla fonte originale prima della pubblicazione.
8. Verificare le policy RLS e i permessi di pubblicazione in Staging; nessun accesso pubblicabile a dati in revisione.

## 4. Test di accettazione necessari
- La pagina Rete BIMARIS non esegue query sugli appuntamenti esterni e contiene solo schede di operatori ed esperienze autorizzate.
- Un evento MAI non verificato o non pubblicato non appare nella ricerca.
- Un evento MAI verificato/pubblicato appare nella ricerca, ma **mai** nella Rete BIMARIS né nella vetrina esperienze operatore.
- Un'esperienza collaborativa pubblicata è visibile nella Rete BIMARIS e nella ricerca, senza duplicati.
- Revisioni, scadenze, annullamenti e duplicati sono gestiti correttamente.

## 5. Governance
Questa è una **specifica di visibilità**, non il GO per integrazione operativa di MAI, acquisizione reale, modifica degli schemi Production, merge o pubblicazione. La baseline MAI deterministica e il collector offline restano isolati finché l'integrazione non supererà i gate tecnici e amministrativi.
