-- DS-QA-SEC-04/V2. Recovery only, NOT a forward migration.
-- Requires separate decision to reintroduce excessive privileges; Staging only.
-- Original ACL: postgres grantor, direct grants, no grant option, no inherited roles or column ACL.
BEGIN;
GRANT INSERT, UPDATE, DELETE, TRUNCATE, REFERENCES, TRIGGER, MAINTAIN ON TABLE public.culture_entries, public.culture_images, public.stories, public.story_images, public.villages, public.village_sources, public.story_editorial_context TO anon, authenticated;
COMMIT;
