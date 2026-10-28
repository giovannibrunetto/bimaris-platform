-- Privacy hardening for pre-launch operator interest manifestations.
-- Retention policy: six months from the last pertinent interaction.

alter table public.operator_interest_manifestations
  add column if not exists last_interaction_at timestamptz;

update public.operator_interest_manifestations
set last_interaction_at = created_at
where last_interaction_at is null;

alter table public.operator_interest_manifestations
  alter column last_interaction_at set default now(),
  alter column last_interaction_at set not null;

create index if not exists operator_interest_retention_idx
  on public.operator_interest_manifestations(last_interaction_at);

create or replace function public.delete_expired_operator_interest_manifestations()
returns integer
language plpgsql
security definer
set search_path = ''
as $$
declare
  deleted_count integer;
begin
  delete from public.operator_interest_manifestations
  where last_interaction_at < now() - interval '6 months';
  get diagnostics deleted_count = row_count;
  return deleted_count;
end;
$$;

revoke all on function public.delete_expired_operator_interest_manifestations() from public, anon, authenticated;
grant execute on function public.delete_expired_operator_interest_manifestations() to service_role;
