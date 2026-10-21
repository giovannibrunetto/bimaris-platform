-- Persistent, atomic abuse controls for server-side public forms and admin login.
create table if not exists public.api_rate_limits (
  scope text not null,
  actor_hash text not null,
  window_start timestamptz not null,
  attempts integer not null default 0,
  primary key (scope, actor_hash)
);
alter table public.api_rate_limits enable row level security;
revoke all on public.api_rate_limits from public, anon, authenticated;
create or replace function public.consume_api_rate_limit(
  p_scope text, p_actor_hash text, p_max_attempts integer, p_window_seconds integer
) returns boolean
language plpgsql security invoker set search_path = public
as $$
declare v_attempts integer;
begin
  if p_scope not in ('admin_login','contact','operator_application')
    or length(p_actor_hash) <> 64
    or p_max_attempts < 1 or p_max_attempts > 100
    or p_window_seconds < 60 or p_window_seconds > 86400 then
    raise exception 'invalid rate limit parameters';
  end if;
  insert into public.api_rate_limits(scope, actor_hash, window_start, attempts)
  values(p_scope, p_actor_hash, now(), 1)
  on conflict (scope, actor_hash) do update
  set window_start = case
      when public.api_rate_limits.window_start <= now() - (p_window_seconds * interval '1 second')
      then now() else public.api_rate_limits.window_start end,
      attempts = case
      when public.api_rate_limits.window_start <= now() - (p_window_seconds * interval '1 second')
      then 1 else public.api_rate_limits.attempts + 1 end
  returning attempts into v_attempts;
  return v_attempts <= p_max_attempts;
end;
$$;
revoke all on function public.consume_api_rate_limit(text,text,integer,integer) from public, anon, authenticated;
grant execute on function public.consume_api_rate_limit(text,text,integer,integer) to service_role;
grant select, insert, update on public.api_rate_limits to service_role;
