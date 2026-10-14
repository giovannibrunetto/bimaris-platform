# BIMARIS — Messina da Vivere

Monorepo MVP per il progetto BIMARIS.

## Contenuto

- `apps/web`: sito Next.js, pagine pubbliche, candidatura operatori, area admin analytics.
- `apps/mobile`: app Expo/React Native collegabile allo stesso backend.
- `packages/core`: tipi e tassonomia condivisa.
- `supabase/migrations`: schema PostgreSQL, RLS e viste analytics.
- `supabase/seed.sql`: dati demo.

## Stack

- Next.js 16.4 / React 19
- Expo SDK 57 / React Native 0.86
- Supabase (PostgreSQL, Auth, Storage)
- Analytics first-party basati su eventi nel database BIMARIS

## Avvio rapido

1. Installa Node.js 22.13+ e pnpm 10.
2. Copia `.env.example` in `.env.local` e inserisci le credenziali Supabase.
3. Esegui la migration SQL in Supabase e poi `supabase/seed.sql`.
4. Installa le dipendenze:

```bash
pnpm install
```

5. Avvia il sito:

```bash
pnpm dev:web
```

6. Avvia l'app:

```bash
pnpm dev:mobile
```

## Privacy analytics

Il client invia eventi solo quando l'utente accetta la categoria `analytics` nel banner consenso. Gli eventi first-party non includono email, telefono o nome in chiaro. Per marketing/remarketing va aggiunto un consenso separato e una CMP conforme alla configurazione finale.

## Sicurezza prima della produzione

- Proteggere `/admin` con Supabase Auth e ruolo `admin`.
- Non esporre mai `SUPABASE_SERVICE_ROLE_KEY` al browser o all'app mobile.
- Applicare rate limiting all'endpoint analytics e ai form pubblici.
- Configurare captcha/anti-spam sul form candidatura.
- Eseguire `pnpm update`, `pnpm audit` e controllare gli advisory di Next.js/React prima del deploy.
- Separare ambienti development/staging/production.

## Funzioni già predisposte

Home, esperienze, territori, mappa concettuale, itinerari, eventi, candidatura operatori, tracking eventi, dashboard analytics, schema per preferiti e utenti, app mobile iniziale.

## Evoluzioni previste

Prenotazioni, pagamenti, operatori Premium, dashboard operatori, notifiche push, recommendation engine, A/B test, heatmap/session replay con strumenti conformi al consenso.

## GitHub / CI

Il repository include `.github/workflows/ci.yml`. Ad ogni push su `main` e ad ogni pull request vengono eseguiti lint, typecheck e build del sito.
