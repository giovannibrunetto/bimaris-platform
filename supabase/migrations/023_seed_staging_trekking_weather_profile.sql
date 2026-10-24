-- Staging fixture: gives the published trekking demo realistic weather sensitivity.
-- Do not apply this data-only fixture to production without reviewing the target experience.
update public.experience_discovery_profiles p
set weather_dependency = 'required',
    weather_constraints = array['rain','strong_wind','extreme_heat']::text[]
from public.experiences e
where e.id = p.experience_id
  and e.name = 'Trekking sui Peloritani'
  and e.published = true;
