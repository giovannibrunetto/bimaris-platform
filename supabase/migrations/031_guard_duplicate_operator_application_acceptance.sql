create or replace function public.accept_operator_application(
  p_application_id uuid,
  p_slug text,
  p_why_selected text default null::text,
  p_publish boolean default false
)
returns uuid
language plpgsql
security definer
set search_path to 'public'
as $function$
declare
  application_row public.operator_applications%rowtype;
  created_place_id uuid;
  created_operator_id uuid;
  clean_slug text;
begin
  select * into application_row
  from public.operator_applications
  where id = p_application_id
  for update;

  if not found then
    raise exception 'operator application not found';
  end if;

  if application_row.status = 'rejected' then
    raise exception 'rejected application cannot be accepted';
  end if;

  if application_row.status = 'accepted' or application_row.operator_id is not null then
    raise exception 'accepted application cannot be accepted again';
  end if;

  clean_slug := lower(regexp_replace(trim(p_slug), '[^a-zA-Z0-9]+', '-', 'g'));
  clean_slug := trim(both '-' from clean_slug);

  if clean_slug = '' then
    raise exception 'invalid operator slug';
  end if;

  insert into public.places (slug, name, kind, address, google_maps_query, latitude, longitude)
  values (
    'operatore-' || clean_slug,
    application_row.business_name,
    'operator',
    coalesce(application_row.address, application_row.location),
    concat_ws(' ', application_row.business_name, application_row.location),
    application_row.latitude,
    application_row.longitude
  )
  on conflict (slug) do update
    set name = excluded.name,
        kind = 'operator',
        address = excluded.address,
        google_maps_query = excluded.google_maps_query,
        latitude = excluded.latitude,
        longitude = excluded.longitude,
        updated_at = now()
  returning id into created_place_id;

  insert into public.operators (
    slug, name, description, category, address, latitude, longitude,
    phone, whatsapp, email, website, instagram,
    selection_status, why_selected, published, place_id
  ) values (
    clean_slug,
    application_row.business_name,
    application_row.description,
    application_row.category,
    coalesce(application_row.address, application_row.location),
    application_row.latitude,
    application_row.longitude,
    application_row.phone,
    application_row.whatsapp,
    application_row.email,
    application_row.website,
    application_row.instagram,
    'selected',
    p_why_selected,
    p_publish,
    created_place_id
  )
  returning id into created_operator_id;

  update public.operator_applications
  set status = 'accepted',
      reviewed_at = now(),
      review_notes = p_why_selected,
      operator_id = created_operator_id
  where id = p_application_id;

  return created_operator_id;
end;
$function$;
