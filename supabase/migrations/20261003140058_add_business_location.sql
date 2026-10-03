alter table public.businesses
  add column if not exists latitude double precision,
  add column if not exists longitude double precision,
  add column if not exists location_updated_at timestamptz;

alter table public.businesses
  add constraint businesses_location_pair_check
  check ((latitude is null and longitude is null) or (latitude is not null and longitude is not null));

alter table public.businesses
  add constraint businesses_latitude_range_check
  check (latitude is null or latitude between -90 and 90);

alter table public.businesses
  add constraint businesses_longitude_range_check
  check (longitude is null or longitude between -180 and 180);
