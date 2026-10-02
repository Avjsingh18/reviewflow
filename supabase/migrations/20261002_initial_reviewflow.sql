create extension if not exists pgcrypto;

create table if not exists public.businesses (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null unique references auth.users(id) on delete cascade,
  name varchar(160) not null,
  google_review_url text not null check (google_review_url ~ '^https?://'),
  google_place_id varchar(255),
  slug varchar(160) not null unique,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.qr_codes (
  id uuid primary key default gen_random_uuid(),
  business_id uuid not null references public.businesses(id) on delete cascade,
  tracking_slug varchar(180) not null unique,
  active boolean not null default true,
  created_at timestamptz not null default now()
);
create unique index if not exists one_active_qr_per_business on public.qr_codes(business_id) where active;

create table if not exists public.qr_scans (
  id uuid primary key default gen_random_uuid(),
  qr_code_id uuid not null references public.qr_codes(id) on delete cascade,
  scanned_at timestamptz not null default now(),
  ip_hash varchar(64),
  user_agent text
);
create index if not exists qr_scans_code_date on public.qr_scans(qr_code_id, scanned_at);

create table if not exists public.review_snapshots (
  id uuid primary key default gen_random_uuid(),
  business_id uuid not null references public.businesses(id) on delete cascade,
  rating numeric(2,1) not null check (rating >= 0 and rating <= 5),
  total_reviews integer not null check (total_reviews >= 0),
  snapshot_date date not null,
  source varchar(30) not null check (source in ('manual_verified', 'google_places', 'google_business_profile')),
  unique(business_id, snapshot_date)
);
create index if not exists review_snapshots_business_date on public.review_snapshots(business_id, snapshot_date);

alter table public.businesses enable row level security;
alter table public.qr_codes enable row level security;
alter table public.qr_scans enable row level security;
alter table public.review_snapshots enable row level security;

create policy "Owners read their business" on public.businesses for select to authenticated using ((select auth.uid()) = user_id);
create policy "Owners update their business" on public.businesses for update to authenticated using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);
create policy "Owners read their QR codes" on public.qr_codes for select to authenticated using (exists (select 1 from public.businesses b where b.id = business_id and b.user_id = (select auth.uid())));
create policy "Owners read their scans" on public.qr_scans for select to authenticated using (exists (select 1 from public.qr_codes q join public.businesses b on b.id = q.business_id where q.id = qr_code_id and b.user_id = (select auth.uid())));
create policy "Owners read their snapshots" on public.review_snapshots for select to authenticated using (exists (select 1 from public.businesses b where b.id = business_id and b.user_id = (select auth.uid())));

revoke all on table public.businesses, public.qr_codes, public.qr_scans, public.review_snapshots from anon, authenticated;
grant usage on schema public to service_role;
grant all privileges on table public.businesses, public.qr_codes, public.qr_scans, public.review_snapshots to service_role;
