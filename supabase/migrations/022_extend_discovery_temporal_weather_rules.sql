alter table public.experience_discovery_profiles
  add column if not exists weather_dependency text not null default 'none',
  add column if not exists weather_constraints text[] not null default '{}'::text[],
  add column if not exists booking_cutoff_time time without time zone,
  add column if not exists booking_cutoff_day_offset smallint not null default 0;

alter table public.experience_discovery_profiles
  drop constraint if exists experience_discovery_weather_dependency_check,
  add constraint experience_discovery_weather_dependency_check
    check (weather_dependency = any (array['none'::text,'partial'::text,'required'::text])),
  drop constraint if exists experience_discovery_weather_constraints_check,
  add constraint experience_discovery_weather_constraints_check
    check (weather_constraints <@ array['rain'::text,'strong_wind'::text,'extreme_heat'::text,'rough_sea'::text]),
  drop constraint if exists experience_discovery_cutoff_offset_check,
  add constraint experience_discovery_cutoff_offset_check
    check (booking_cutoff_day_offset >= 0 and booking_cutoff_day_offset <= 30);

comment on column public.experience_discovery_profiles.weather_dependency is 'How strongly the experience depends on weather: none, partial, required.';
comment on column public.experience_discovery_profiles.weather_constraints is 'Weather conditions that can make the experience unsuitable.';
comment on column public.experience_discovery_profiles.booking_cutoff_time is 'Local clock cutoff for booking when a fixed daily cutoff applies.';
comment on column public.experience_discovery_profiles.booking_cutoff_day_offset is 'Days before the experience date at which booking_cutoff_time applies; 0 means same day.';
