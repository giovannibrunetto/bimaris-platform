-- Saving corrections must not make a rejected experience look like a fresh draft.
-- Only the explicit resubmission transition to pending should change its review state.

create or replace function public.preserve_rejected_experience_state()
returns trigger
language plpgsql
set search_path = public
as $$
begin
  if old.review_status = 'rejected' and new.review_status = 'draft' then
    new.review_status := 'rejected';
  end if;
  return new;
end;
$$;

drop trigger if exists preserve_rejected_experience_state_before_update on public.experiences;
create trigger preserve_rejected_experience_state_before_update
before update on public.experiences
for each row
execute function public.preserve_rejected_experience_state();
