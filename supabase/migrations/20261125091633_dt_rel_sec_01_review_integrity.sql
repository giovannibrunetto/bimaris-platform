-- DT-REL-SEC-01: protect review metadata and source identity; validate applied gallery.
CREATE OR REPLACE FUNCTION public.guard_experience_review_metadata()
RETURNS trigger LANGUAGE plpgsql SECURITY INVOKER SET search_path TO '' AS $fn$
BEGIN
  IF current_user NOT IN ('anon','authenticated') THEN RETURN NEW; END IF;
  IF TG_OP = 'INSERT' THEN
    IF NEW.review_notes IS NOT NULL OR NEW.reviewed_at IS NOT NULL
       OR NEW.review_sections IS DISTINCT FROM '{}'::jsonb
       OR NEW.review_snapshot IS DISTINCT FROM '{}'::jsonb
    THEN RAISE EXCEPTION USING ERRCODE='42501', MESSAGE='review-metadata-protected'; END IF;
  ELSE
    IF NEW.review_notes IS DISTINCT FROM OLD.review_notes
       OR NEW.reviewed_at IS DISTINCT FROM OLD.reviewed_at
       OR NEW.review_sections IS DISTINCT FROM OLD.review_sections
       OR NEW.review_snapshot IS DISTINCT FROM OLD.review_snapshot
    THEN RAISE EXCEPTION USING ERRCODE='42501', MESSAGE='review-metadata-protected'; END IF;
    IF NEW.id IS DISTINCT FROM OLD.id OR NEW.operator_id IS DISTINCT FROM OLD.operator_id
    THEN RAISE EXCEPTION USING ERRCODE='42501', MESSAGE='experience-identity-protected'; END IF;
  END IF;
  RETURN NEW;
END;
$fn$;

CREATE OR REPLACE FUNCTION public.guard_experience_revision_metadata()
RETURNS trigger LANGUAGE plpgsql SECURITY INVOKER SET search_path TO '' AS $fn$
BEGIN
  IF TG_OP = 'UPDATE' THEN
    IF NEW.id IS DISTINCT FROM OLD.id OR NEW.experience_id IS DISTINCT FROM OLD.experience_id
       OR NEW.operator_id IS DISTINCT FROM OLD.operator_id
    THEN RAISE EXCEPTION USING ERRCODE='42501', MESSAGE='revision-identity-protected'; END IF;
  END IF;
  IF current_user NOT IN ('anon','authenticated') THEN RETURN NEW; END IF;
  IF TG_OP = 'INSERT' THEN
    IF NEW.review_notes IS NOT NULL OR NEW.reviewed_at IS NOT NULL OR NEW.applied_at IS NOT NULL
       OR NEW.review_sections IS DISTINCT FROM '{}'::jsonb
    THEN RAISE EXCEPTION USING ERRCODE='42501', MESSAGE='review-metadata-protected'; END IF;
  ELSE
    IF NEW.review_notes IS DISTINCT FROM OLD.review_notes
       OR NEW.reviewed_at IS DISTINCT FROM OLD.reviewed_at
       OR NEW.applied_at IS DISTINCT FROM OLD.applied_at
       OR NEW.review_sections IS DISTINCT FROM OLD.review_sections
    THEN RAISE EXCEPTION USING ERRCODE='42501', MESSAGE='review-metadata-protected'; END IF;
  END IF;
  RETURN NEW;
END;
$fn$;

CREATE OR REPLACE FUNCTION public.guard_applied_experience_gallery()
RETURNS trigger LANGUAGE plpgsql SECURITY INVOKER SET search_path TO '' AS $fn$
DECLARE v_count bigint; v_covers bigint;
BEGIN
  IF NEW.status <> 'applied' THEN RETURN NEW; END IF;
  IF TG_OP = 'UPDATE' THEN
    IF OLD.status = 'applied' THEN RETURN NEW; END IF;
  END IF;
  SELECT count(*), count(*) FILTER (WHERE is_cover)
    INTO v_count,v_covers FROM public.experience_media WHERE experience_id=NEW.experience_id;
  IF v_count < 1 OR v_covers <> 1 THEN
    RAISE EXCEPTION USING ERRCODE='P0001', MESSAGE='invalid-applied-experience-gallery';
  END IF;
  RETURN NEW;
END;
$fn$;

REVOKE EXECUTE ON FUNCTION public.guard_experience_review_metadata(), public.guard_experience_revision_metadata(), public.guard_applied_experience_gallery() FROM PUBLIC, anon, authenticated;

CREATE TRIGGER dt_rel_guard_experience_metadata BEFORE INSERT OR UPDATE ON public.experiences
FOR EACH ROW EXECUTE FUNCTION public.guard_experience_review_metadata();
CREATE TRIGGER dt_rel_guard_revision_metadata BEFORE INSERT OR UPDATE ON public.experience_revisions
FOR EACH ROW EXECUTE FUNCTION public.guard_experience_revision_metadata();
CREATE TRIGGER dt_rel_guard_applied_gallery BEFORE INSERT OR UPDATE OF status ON public.experience_revisions
FOR EACH ROW EXECUTE FUNCTION public.guard_applied_experience_gallery();
