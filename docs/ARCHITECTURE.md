# Architettura BIMARIS

BIMARIS è organizzato come monorepo con un sito web Next.js, un'app Expo/React Native, un package core condiviso e Supabase come backend.

## Componenti

- `apps/web`: esperienza web, pagine pubbliche, API analytics e dashboard amministrativa.
- `apps/mobile`: app iOS/Android basata su Expo Router.
- `packages/core`: tipi e tassonomie condivise.
- `supabase`: schema PostgreSQL e dati demo.

## Dati principali

- territories
- categories
- operators
- experiences
- itineraries
- events
- profiles
- favorites
- operator_applications
- analytics_events

## Analytics

Gli eventi vengono inviati dal client all'endpoint server `/api/analytics/track`, che li valida e li persiste. La dashboard usa viste aggregate PostgreSQL.

## Evoluzione

La struttura è predisposta per autenticazione, ruoli admin/operator, premium, booking, pagamenti, recommendation engine e app mobile completa.
