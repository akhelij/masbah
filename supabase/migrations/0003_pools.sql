-- ════════════════════════════════════════════════════════════════
-- Pissina V2 — 0003 · pools, photos, slots, blocked dates + storage
-- Private columns (address, exact lat/lng) are NEVER exposed publicly:
-- the public reads safe columns of published pools via pools_public only.
-- ════════════════════════════════════════════════════════════════
create table public.pools (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references public.profiles (id) on delete cascade,
  title text not null,
  description text,
  type public.pool_type not null default 'villa',
  city_id uuid not null references public.cities (id),
  neighborhood text,
  address text, -- PRIVATE
  lat numeric, -- PRIVATE (exact)
  lng numeric, -- PRIVATE (exact)
  approx_lat numeric, -- public (jittered ~500m)
  approx_lng numeric, -- public (jittered ~500m)
  max_guests int not null default 10 check (max_guests > 0),
  length_m numeric,
  width_m numeric,
  depth_min numeric,
  depth_max numeric,
  heated boolean not null default false,
  covered boolean not null default false,
  child_safe boolean not null default false,
  sheltered_from_view boolean not null default false,
  owner_present boolean not null default false,
  direct_contact_enabled boolean not null default true,
  rules jsonb not null default '{"kids_allowed":true,"music_allowed":true,"events_allowed":false,"pets_allowed":false,"quiet_hours":null}'::jsonb,
  amenities jsonb not null default '[]'::jsonb,
  status public.pool_status not null default 'draft',
  completion_score int not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index pools_city_status_idx on public.pools (city_id, status);
create index pools_owner_idx on public.pools (owner_id);
create trigger pools_set_updated_at before update on public.pools
  for each row execute function public.set_updated_at();

alter table public.pools enable row level security;

-- Owner: full CRUD on own pools (all columns, incl. private + drafts).
create policy "pools_owner_all" on public.pools for all to authenticated
  using (owner_id = auth.uid()) with check (owner_id = auth.uid());
-- No public SELECT policy on the base table → private columns unreachable.

-- Safe, published-only projection for the public.
create view public.pools_public
with (security_invoker = false) as
select
  id, owner_id, title, description, type, city_id, neighborhood,
  approx_lat, approx_lng, max_guests, length_m, width_m, depth_min, depth_max,
  heated, covered, child_safe, sheltered_from_view, owner_present,
  direct_contact_enabled, rules, amenities, completion_score, created_at, updated_at
from public.pools
where status = 'published';
grant select on public.pools_public to anon, authenticated;

-- SECURITY DEFINER helpers so child-table policies can check pool visibility
-- without granting the public any access to the (sensitive) base pools table.
create or replace function public.pool_is_visible(p_pool_id uuid)
returns boolean language sql security definer stable set search_path = public as $$
  select exists (
    select 1 from public.pools p
    where p.id = p_pool_id and (p.status = 'published' or p.owner_id = auth.uid())
  );
$$;

create or replace function public.pool_is_owned(p_pool_id uuid)
returns boolean language sql security definer stable set search_path = public as $$
  select exists (
    select 1 from public.pools p where p.id = p_pool_id and p.owner_id = auth.uid()
  );
$$;

-- ── pool_photos ───────────────────────────────────────────────────
create table public.pool_photos (
  id uuid primary key default gen_random_uuid(),
  pool_id uuid not null references public.pools (id) on delete cascade,
  storage_path text not null,
  position int not null default 0,
  is_cover boolean not null default false
);
create index pool_photos_pool_idx on public.pool_photos (pool_id, position);
alter table public.pool_photos enable row level security;
create policy "pool_photos_select_visible" on public.pool_photos for select to anon, authenticated
  using (public.pool_is_visible(pool_id));
create policy "pool_photos_owner_write" on public.pool_photos for all to authenticated
  using (public.pool_is_owned(pool_id)) with check (public.pool_is_owned(pool_id));

-- ── pool_slots ────────────────────────────────────────────────────
create table public.pool_slots (
  id uuid primary key default gen_random_uuid(),
  pool_id uuid not null references public.pools (id) on delete cascade,
  slot public.slot_type not null,
  price_mad int not null check (price_mad >= 0),
  enabled boolean not null default true,
  weekend_premium_pct int not null default 0 check (weekend_premium_pct >= 0),
  unique (pool_id, slot)
);
alter table public.pool_slots enable row level security;
create policy "pool_slots_select_visible" on public.pool_slots for select to anon, authenticated
  using (public.pool_is_visible(pool_id));
create policy "pool_slots_owner_write" on public.pool_slots for all to authenticated
  using (public.pool_is_owned(pool_id)) with check (public.pool_is_owned(pool_id));

-- ── blocked_dates ─────────────────────────────────────────────────
create table public.blocked_dates (
  id uuid primary key default gen_random_uuid(),
  pool_id uuid not null references public.pools (id) on delete cascade,
  date date not null,
  slot public.slot_type, -- null = whole day
  reason text
);
create index blocked_dates_pool_idx on public.blocked_dates (pool_id, date);
alter table public.blocked_dates enable row level security;
create policy "blocked_dates_select_visible" on public.blocked_dates for select to anon, authenticated
  using (public.pool_is_visible(pool_id));
create policy "blocked_dates_owner_write" on public.blocked_dates for all to authenticated
  using (public.pool_is_owned(pool_id)) with check (public.pool_is_owned(pool_id));

-- ── Storage bucket for pool photos (path convention: <pool_id>/<file>) ──
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('pool-photos', 'pool-photos', true, 5242880, array['image/webp', 'image/jpeg', 'image/png'])
on conflict (id) do nothing;

create policy "pool_photos_public_read" on storage.objects for select to anon, authenticated
  using (bucket_id = 'pool-photos');
create policy "pool_photos_owner_insert" on storage.objects for insert to authenticated
  with check (bucket_id = 'pool-photos' and public.pool_is_owned(((storage.foldername(name))[1])::uuid));
create policy "pool_photos_owner_update" on storage.objects for update to authenticated
  using (bucket_id = 'pool-photos' and public.pool_is_owned(((storage.foldername(name))[1])::uuid));
create policy "pool_photos_owner_delete" on storage.objects for delete to authenticated
  using (bucket_id = 'pool-photos' and public.pool_is_owned(((storage.foldername(name))[1])::uuid));
