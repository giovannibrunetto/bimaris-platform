-- Keep database-level public visibility aligned with the web application.
drop policy if exists "public read operators" on public.operators;
drop policy if exists "public read selected published operators" on public.operators;
create policy "public read selected published operators"
on public.operators for select
to anon, authenticated
using (published = true and selection_status = 'selected');

drop policy if exists "public read experiences" on public.experiences;
drop policy if exists "public read approved experiences of selected operators" on public.experiences;
create policy "public read approved experiences of selected operators"
on public.experiences for select
to anon, authenticated
using (
  published = true
  and review_status = 'approved'
  and exists (
    select 1 from public.operators o
    where o.id = experiences.operator_id
      and o.published = true
      and o.selection_status = 'selected'
  )
);

-- Only operator owners/managers may propose profile changes.
drop policy if exists "operator members propose revisions" on public.operator_revisions;
drop policy if exists "operator managers propose revisions" on public.operator_revisions;
create policy "operator managers propose revisions"
on public.operator_revisions for insert
to authenticated
with check (
  status = 'pending'
  and proposed_by = (select auth.uid())
  and exists (
    select 1 from public.operator_memberships m
    where m.operator_id = operator_revisions.operator_id
      and m.user_id = (select auth.uid())
      and m.role in ('owner','manager')
  )
);

-- Trigger helpers are internal implementation details, not public RPC endpoints.
revoke execute on function public.archive_completed_experience_review() from public, anon, authenticated;
revoke execute on function public.preserve_rejected_experience_state() from public, anon, authenticated;

-- Behavioral RPCs require a signed-in user and are not exposed to anon.
revoke execute on function public.record_user_behavior(text,text,text,text,numeric) from public, anon;
revoke execute on function public.record_user_behavior(text,text,text,text,numeric,text,text,text,text,text) from public, anon;
grant execute on function public.record_user_behavior(text,text,text,text,numeric) to authenticated;
grant execute on function public.record_user_behavior(text,text,text,text,numeric,text,text,text,text,text) to authenticated;
