create or replace function public.get_operator_action_metrics(p_operator_slugs text[], p_window_days integer default 30)
returns table(operator_slug text, total bigint, whatsapp bigint, phone bigint, directions bigint, website bigint, instagram bigint, booking bigint)
language sql
stable
security invoker
set search_path = ''
as $$
  with bounds as (
    select coalesce(max(a.created_at), '1970-01-01 00:00:00+00'::timestamptz) as anchor
    from public.analytics_events a
  ), filtered as (
    select
      a.properties->>'operator_id' as operator_slug,
      coalesce(
        nullif(a.properties->>'action_type', ''),
        case a.event_name
          when 'whatsapp_click' then 'whatsapp'
          when 'phone_click' then 'phone'
          when 'directions_click' then 'directions'
          when 'website_click' then 'website'
          when 'instagram_click' then 'instagram'
          when 'booking_click' then 'booking'
          else null
        end
      ) as action
    from public.analytics_events a
    cross join bounds b
    where a.created_at >= b.anchor - make_interval(days => greatest(1, least(coalesce(p_window_days, 30), 90)))
      and a.event_name = any(array['whatsapp_click','phone_click','directions_click','website_click','instagram_click','booking_click']::text[])
      and a.properties->>'operator_id' = any(coalesce(p_operator_slugs, array[]::text[]))
  )
  select
    f.operator_slug,
    count(*)::bigint as total,
    count(*) filter (where f.action = 'whatsapp')::bigint as whatsapp,
    count(*) filter (where f.action = 'phone')::bigint as phone,
    count(*) filter (where f.action = 'directions')::bigint as directions,
    count(*) filter (where f.action = 'website')::bigint as website,
    count(*) filter (where f.action = 'instagram')::bigint as instagram,
    count(*) filter (where f.action = 'booking')::bigint as booking
  from filtered f
  where f.operator_slug is not null
  group by f.operator_slug;
$$;

revoke execute on function public.get_operator_action_metrics(text[], integer) from public, anon, authenticated;
grant execute on function public.get_operator_action_metrics(text[], integer) to service_role;
