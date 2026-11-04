-- Protect the final owner of each operator against concurrent updates/deletions.
-- The operator row lock serializes owner removals for the same operator.
-- This function is a trigger, not a user-callable privileged RPC.
create or replace function public.protect_last_operator_owner()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if old.role = 'owner'
    and (
      tg_op = 'DELETE'
      or (tg_op = 'UPDATE' and (
        new.role is distinct from 'owner'
        or new.operator_id is distinct from old.operator_id
        or new.user_id is distinct from old.user_id
      ))
    )
  then
    perform 1
    from public.operators
    where id = old.operator_id
    for update;

    if not exists (
      select 1
      from public.operator_memberships m
      where m.operator_id = old.operator_id
        and m.role = 'owner'
        and m.user_id <> old.user_id
    ) then
      raise exception 'Cannot remove the last owner of an operator'
        using errcode = '23514';
    end if;
  end if;

  if tg_op = 'DELETE' then
    return old;
  end if;
  return new;
end;
$$;

drop trigger if exists protect_last_operator_owner on public.operator_memberships;
create trigger protect_last_operator_owner
before update or delete on public.operator_memberships
for each row execute function public.protect_last_operator_owner();

-- Trigger functions do not need direct API EXECUTE grants.
revoke execute on function public.protect_last_operator_owner() from public, anon, authenticated;
