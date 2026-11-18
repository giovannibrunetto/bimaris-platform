-- BIMARIS — DT16 | CANDIDATO SQL: identità fiscale verificata / account aziendale unico
-- Data: 18 novembre 2026
-- REVIEW ONLY — NON ESEGUIRE SU STAGING O PRODUCTION.
-- Non è una migrazione Supabase attivata. Richiede revisione DS, SQL, privacy e test isolato.
-- Lo script inizia con un BLOCCO INTENZIONALE: non rimuoverlo senza GO separato.
-- Schema base verificato su Supabase Staging nzdeoimwikhoidtladnu.
--
-- Scopo: 1 identità fiscale (paese + tipo + identificatore normalizzato) => 1 business account.
-- Una singola business account può riferirsi a più operatori tramite operators.business_account_id.
-- Nessun operatore legacy viene collegato o modificato da questo script.
-- NON implementa automaticamente onboarding, verifica P.IVA o assegnazione membership.
BEGIN;
DO $blocked$
BEGIN
  RAISE EXCEPTION 'DT16 REVIEW ONLY: DDL non autorizzato. Rimuovere il blocco soltanto con GO scritto e collaudo isolato.';
END
$blocked$;

-- ***** DDL CANDIDATO DA SOTTOPORRE A REVIEW *****

-- Una riga per posizione commerciale verificata. Un input dichiarato ma NON verificato
-- va conservato nella candidatura amministrativa, NON in questa tabella.
CREATE TABLE public.business_account_tax_identities (
  account_id uuid PRIMARY KEY
    REFERENCES public.business_accounts(id) ON DELETE RESTRICT,
  country_code text NOT NULL
    CHECK (country_code ~ '^[A-Z]{2}$'),
  identifier_kind text NOT NULL
    CHECK (identifier_kind IN ('vat','other_verified')),
  identifier_normalized text NOT NULL
    CHECK (identifier_normalized ~ '^[A-Z0-9]{4,32}$'
      AND identifier_normalized = upper(identifier_normalized)),
  verification_method text NOT NULL
    CHECK (verification_method IN ('official_registry','manual_documented')),
  verified_at timestamptz NOT NULL,
  verified_by uuid NOT NULL REFERENCES auth.users(id) ON DELETE RESTRICT,
  created_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT business_account_tax_identity_unique
    UNIQUE (country_code,identifier_kind,identifier_normalized)
);

-- Le chiavi fiscali non vanno esposte in API pubbliche. RLS senza policy
-- impedisce l'accesso diretto dei ruoli non privilegiati.
ALTER TABLE public.business_account_tax_identities ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.business_account_tax_identities
  FROM PUBLIC,anon,authenticated,service_role;
-- Per le sole future verifiche server-side, lettura consentita al ruolo
-- privilegiato e soltanto dietro controllo dell'identità dell'operatore;
-- in fase di primo rilascio non concediamo alcuna scrittura al service_role.
GRANT SELECT ON public.business_account_tax_identities TO service_role;

COMMENT ON TABLE public.business_account_tax_identities IS
  'DT16: solo identità fiscali amministrativamente verificate; nessun collegamento automatico da candidatura, nessuna esposizione pubblica.';
COMMENT ON COLUMN public.business_account_tax_identities.identifier_normalized IS
  'Identificativo verificato normalizzato secondo regole nazionali approvate: la regex SQL controlla solo il formato, non valida la P.IVA.';

-- Pre- e post-check in ambiente ISOLATO dopo GO:
-- SELECT count(*) FROM public.business_account_tax_identities;
-- SELECT country_code,identifier_kind,identifier_normalized,count(*)
--   FROM public.business_account_tax_identities
--   GROUP BY 1,2,3 HAVING count(*)>1;
-- SELECT count(*) FILTER (WHERE business_account_id IS NULL)
--   FROM public.operators;
--
-- Scenario A: 2 imprese con identificativi verificati distinti -> 2 account.
-- Scenario B: stessa identità verificata su secondo account -> errore UNIQUE.
-- Scenario C: 2 operators con medesimo business_account_id -> consentiti.
-- Scenario D: utente non autenticato e utente authenticated -> nessuna lettura
--             delle identità fiscali tramite API, indipendentemente dalla RLS
--             sui profili operatori pubblici.
-- Scenario E: utente che si dichiara titolare di un identificativo già
--             verificato -> NESSUNA assegnazione di membership senza verifica.
-- Scenario F: rollback nel clone -> nessuna perdita di operatori preesistenti.
--
-- Operazioni applicative successive NON comprese:
-- 1. Funzione server-only verificata per convalidare la titolarità fiscale.
-- 2. Orchestrazione transazionale di creazione account + identità + membership
--    + collegamento degli operatori, con protezione dalle richieste concorrenti.
-- 3. Flusso idempotente di recupero per approvazione candidatura e OTP falliti.
-- 4. Riconciliazione delle P.IVA esistenti prima dell'applicazione di vincoli.
-- 5. Requisiti di accesso, piano abbonamento e gestione enti senza P.IVA.
-- 6. Documentazione diritto di accesso, minimizzazione e retention del dato fiscale.
--
-- ROLLBACK (solo ambiente isolato, previa verifica di dipendenze):
-- DROP TABLE public.business_account_tax_identities;
-- Nessuna tabella preesistente è modificata da questo candidato.
COMMIT;
