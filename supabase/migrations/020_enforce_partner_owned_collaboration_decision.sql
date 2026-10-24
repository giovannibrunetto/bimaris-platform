-- Only the invited partner can accept or reject a collaboration.
-- The experience editor may edit collaboration metadata, but can only reset
-- the approval state to pending after a substantive change.
create or replace function public.guard_partner_collaboration_update()
returns trigger
language plpgsql
set search_path = ''
as $function$
declare
  v_uid uuid := (select auth.uid());
  v_is_editor boolean;
  v_is_partner_manager boolean;
begin
  select exists (
    select 1
    from public.experiences e
    join public.operator_memberships m on m.operator_id = e.operator_id
    where e.id = old.experience_id
      and m.user_id = v_uid
      and m.role = any (array['owner'::text,'manager'::text])
  ) into v_is_editor;

  if v_is_editor then
    if new.approval_status is distinct from old.approval_status then
      if new.approval_status <> 'pending' then
        raise exception 'Solo il partner può accettare o rifiutare la collaborazione';
      end if;
      new.approved_at := null;
    end if;
    return new;
  end if;

  select exists (
    select 1
    from public.operator_memberships m
    where m.operator_id = old.operator_id
      and m.user_id = v_uid
      and m.role = any (array['owner'::text,'manager'::text])
  ) into v_is_partner_manager;

  if not v_is_partner_manager then
    raise exception 'Collaborazione non autorizzata';
  end if;

  if old.approval_status <> 'pending' then
    raise exception 'La collaborazione ha già ricevuto una risposta';
  end if;

  if (to_jsonb(new) - array['approval_status','approved_at','updated_at'])
     is distinct from
     (to_jsonb(old) - array['approval_status','approved_at','updated_at']) then
    raise exception 'Il partner può modificare solo lo stato della collaborazione';
  end if;

  if new.approval_status not in ('accepted','rejected') then
    raise exception 'Decisione di collaborazione non valida';
  end if;

  new.approved_at := case when new.approval_status='accepted' then now() else null end;
  new.updated_at := now();
  return new;
end;
$function$;
