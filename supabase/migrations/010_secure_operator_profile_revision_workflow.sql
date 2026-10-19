drop policy if exists "operator members propose revisions" on public.operator_revisions;
create policy "operator members propose revisions"
on public.operator_revisions for insert to authenticated
with check (
  status='pending'
  and proposed_by=auth.uid()
  and exists (
    select 1 from public.operator_memberships m
    where m.operator_id=operator_revisions.operator_id and m.user_id=auth.uid()
  )
);
create unique index if not exists operator_revisions_one_pending_per_operator_idx
on public.operator_revisions(operator_id) where status='pending';

create or replace function public.admin_apply_operator_revision(p_revision_id uuid, p_review_notes text default null)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  r public.operator_revisions%rowtype;
  d jsonb;
begin
  select * into r from public.operator_revisions where id=p_revision_id for update;
  if not found then raise exception 'Revision not found'; end if;
  if r.status <> 'pending' then raise exception 'Revision is not pending'; end if;
  d := r.proposed_data;
  update public.operators set
    name = case when d ? 'name' then nullif(trim(d->>'name'),'') else name end,
    category = case when d ? 'category' then nullif(trim(d->>'category'),'') else category end,
    address = case when d ? 'address' then nullif(trim(d->>'address'),'') else address end,
    phone = case when d ? 'phone' then nullif(trim(d->>'phone'),'') else phone end,
    whatsapp = case when d ? 'whatsapp' then nullif(trim(d->>'whatsapp'),'') else whatsapp end,
    email = case when d ? 'email' then nullif(trim(d->>'email'),'') else email end,
    website = case when d ? 'website' then nullif(trim(d->>'website'),'') else website end,
    instagram = case when d ? 'instagram' then nullif(trim(d->>'instagram'),'') else instagram end,
    updated_at = now()
  where id=r.operator_id;
  update public.operator_revisions set status='approved', review_notes=nullif(trim(p_review_notes),''), reviewed_at=now(), updated_at=now() where id=p_revision_id;
end;
$$;
revoke all on function public.admin_apply_operator_revision(uuid,text) from public;
revoke all on function public.admin_apply_operator_revision(uuid,text) from anon;
revoke all on function public.admin_apply_operator_revision(uuid,text) from authenticated;
grant execute on function public.admin_apply_operator_revision(uuid,text) to service_role;
