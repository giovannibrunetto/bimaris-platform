# DS-CLEAN-04 — Accesso OAuth Preview consolidata

Data: 13 novembre 2026
Ambiente: BIMARIS Staging — Supabase `nzdeoimwikhoidtladnu`
Stato: codice candidato PR #54, DRAFT; configurazione Supabase non ancora accertata/aggiornata.

## Evidenza
- Da una Preview a URL immutabile `bimaris-platform-96elwdpco-giovannibrunetto84-1508.vercel.app`, il login Google ha portato il browser su `bimaris-platform-git-staging-giovannibrunetto84-1508.vercel.app/?code=...`.
- Screenshot Supabase Staging: Site URL sul dominio staging e 19 Redirect URLs, molti temporanei.
- L'app usa `redirectTo` composto dall'origine della pagina e da `/auth/callback?operator=1&next=...`.
- Supabase può usare il Site URL come fallback quando il redirect richiesto non è ammesso. La mancata ammissione dell'URL esatto è un'ipotesi altamente compatibile, da confermare sul pannello.

## Soluzione candidata nel codice
L'alias di branch confermato da Vercel per PR #54 è:
`https://bimaris-platform-git-integration-7435f3-giovannibrunetto84-1508.vercel.app`

Per Google OAuth e magic link dell'operatore, quando il visitatore apre la Preview immutabile, l'app lo trasferisce **prima** alla pagina di accesso sul dominio del branch, preservando `next`. Il flusso di autenticazione inizia soltanto dopo, sull'alias stabile. Sono inclusi test per evitare la regressione.

## Operazione Supabase necessaria, una sola volta per la PR #54
Verificare che in Authentication → URL Configuration → Redirect URLs dell'ambiente **Staging** sia presente:
`https://bimaris-platform-git-integration-7435f3-giovannibrunetto84-1508.vercel.app/auth/callback*`
oppure la variante esatta con path `/auth/callback` e query compatibili con le regole correnti. Per motivi di sicurezza preferire un match stretto, non wildcard generalizzati su tutti i deployment.

Non aggiungere singoli URL di deployment a ogni nuova build. Non cancellare gli URL esistenti senza inventario delle dipendenze. Nessuna modifica Production.

## Limiti
- La stabilità è legata al nome del branch corrente PR #54, non è ancora un dominio QA permanente per tutte le PR.
- Il redirect Supabase deve essere configurato e il flusso testato con sessione autenticata; la CI non può provarlo.
- Se il branch è rinominato o usato un altro branch, la configurazione va rivalutata. Per una soluzione definitiva multiprogetto si dovrà predisporre un unico dominio QA dedicato con deployment routing verificato.
- Verificare sicurezza dei flussi OTP e Google prima del GO di merge.
