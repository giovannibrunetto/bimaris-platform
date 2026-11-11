-- DS-OP-IDENTITY-01 / PROPOSAL ONLY — DO NOT APPLY WITHOUT SECURITY REVIEW
-- Additive staging migration; existing operator memberships and experiences FK unchanged.
BEGIN;
CREATE TABLE IF NOT EXISTS public.business_accounts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  display_name text NOT NULL CHECK (length(trim(display_name)) > 0),
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE TABLE IF NOT EXISTS public.business_account_memberships (
  account_id uuid NOT NULL REFERENCES public.business_accounts(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role text NOT NULL CHECK (role IN ('owner','manager','viewer')),
  created_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (account_id,user_id)
);
ALTER TABLE public.business_accounts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.business_account_memberships ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.business_accounts FROM anon,authenticated;
REVOKE ALL ON public.business_account_memberships FROM anon,authenticated;
-- No client-facing policies yet: fail closed until explicit authorization design.
ALTER TABLE public.operators ADD COLUMN IF NOT EXISTS business_account_id uuid
  REFERENCES public.business_accounts(id) ON DELETE RESTRICT;
CREATE INDEX IF NOT EXISTS operators_business_account_id_idx
  ON public.operators(business_account_id);
-- No automatic backfill or account merge; existing records remain valid.
COMMIT;
