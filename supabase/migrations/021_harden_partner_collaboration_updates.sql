create or replace function public.guard_partner_collaboration_update()
returns trigger
language plpgsql
set search_path = ''
as $$
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

  if (to_jsonb(new) - array['approval_status','approved_at','updated_at'])
     is distinct from
     (to_jsonb(old) - array['approval_status','approved_at','updated_at']) then
    raise exception 'Il partner può modificare solo lo stato della collaborazione';
  end if;

  if new.approval_status not in ('accepted','rejected') then
    raise exception 'Decisione di collaborazione non valida';
  end if;

  return new;
end;
$$;

drop trigger if exists guard_partner_collaboration_update on public.experience_operators;
create trigger guard_partner_collaboration_update
before update on public.experience_operators
for each row execute function public.guard_partner_collaboration_update();
