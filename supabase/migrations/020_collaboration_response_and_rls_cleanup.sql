-- Consolidate discovery-intent SELECT policies to avoid duplicate permissive checks.
drop policy if exists "operator owners can read own experience interests" on public.experience_discovery_intents;
drop policy if exists "public read experience discovery intents" on public.experience_discovery_intents;
drop policy if exists "read permitted experience discovery intents" on public.experience_discovery_intents;
create policy "read permitted experience discovery intents"
on public.experience_discovery_intents
for select
to anon, authenticated
using (
  exists (
    select 1 from public.experience_discovery_profiles p
    where p.experience_id=experience_discovery_intents.experience_id
      and p.discovery_active=true
  )
  or exists (
    select 1 from public.experiences e
    join public.operator_memberships m on m.operator_id=e.operator_id
    where e.id=experience_discovery_intents.experience_id
      and m.user_id=(select auth.uid())
      and m.role=any(array['owner'::text,'manager'::text])
  )
);

-- A partner may accept/reject a collaboration, but cannot rewrite its terms.
create or replace function public.guard_partner_collaboration_update()
returns trigger
language plpgsql
security invoker
set search_path=''
as $$
declare
  v_is_editor boolean;
  v_is_partner_manager boolean;
begin
  select exists (
    select 1 from public.experiences e
    join public.operator_memberships m on m.operator_id=e.operator_id
    where e.id=old.experience_id
      and m.user_id=(select auth.uid())
      and m.role=any(array['owner'::text,'manager'::text])
  ) into v_is_editor;

  if v_is_editor then return new; end if;

  select exists (
    select 1 from public.operator_memberships m
    where m.operator_id=old.operator_id
      and m.user_id=(select auth.uid())
      and m.role=any(array['owner'::text,'manager'::text])
  ) into v_is_partner_manager;

  if not v_is_partner_manager then
    raise exception 'Non autorizzato a modificare questa collaborazione';
  end if;
  if old.role <> 'participant' then
    raise exception 'Solo un operatore partner può rispondere alla collaborazione';
  end if;
  if new.experience_id is distinct from old.experience_id
     or new.operator_id is distinct from old.operator_id
     or new.role is distinct from old.role
     or new.activity_label is distinct from old.activity_label
     or new.invited_by_operator_id is distinct from old.invited_by_operator_id
     or new.created_at is distinct from old.created_at then
    raise exception 'Il partner può modificare soltanto lo stato di approvazione';
  end if;
  if new.approval_status not in ('accepted','rejected') then
    raise exception 'Risposta collaborazione non valida';
  end if;
  new.approved_at:=case when new.approval_status='accepted' then coalesce(new.approved_at,now()) else null end;
  new.updated_at:=now();
  return new;
end;
$$;
revoke all on function public.guard_partner_collaboration_update() from public,anon,authenticated;

drop trigger if exists guard_partner_collaboration_update on public.experience_operators;
create trigger guard_partner_collaboration_update
before update on public.experience_operators
for each row execute function public.guard_partner_collaboration_update();

drop policy if exists "partner managers respond to collaboration" on public.experience_operators;
create policy "partner managers respond to collaboration"
on public.experience_operators
for update
to authenticated
using (
  role='participant'
  and exists (
    select 1 from public.operator_memberships m
    where m.operator_id=experience_operators.operator_id
      and m.user_id=(select auth.uid())
      and m.role=any(array['owner'::text,'manager'::text])
  )
)
with check (
  role='participant'
  and exists (
    select 1 from public.operator_memberships m
    where m.operator_id=experience_operators.operator_id
      and m.user_id=(select auth.uid())
      and m.role=any(array['owner'::text,'manager'::text])
  )
);

create or replace function public.respond_to_experience_collaboration(p_experience_id uuid,p_operator_id uuid,p_decision text)
returns public.experience_operators
language plpgsql
security invoker
set search_path=''
as $$
declare v_row public.experience_operators;
begin
  if p_decision not in ('accepted','rejected') then raise exception 'Decisione non valida'; end if;
  update public.experience_operators
  set approval_status=p_decision,
      approved_at=case when p_decision='accepted' then now() else null end,
      updated_at=now()
  where experience_id=p_experience_id and operator_id=p_operator_id and role='participant'
  returning * into v_row;
  if not found then raise exception 'Collaborazione non trovata o non autorizzata'; end if;
  return v_row;
end;
$$;
revoke all on function public.respond_to_experience_collaboration(uuid,uuid,text) from public,anon;
grant execute on function public.respond_to_experience_collaboration(uuid,uuid,text) to authenticated;
