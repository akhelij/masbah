-- ════════════════════════════════════════════════════════════════
-- Pissina V2 — 0001 · extensions, enums, helpers, profiles
-- RLS is deny-by-default on every table. Phone is NEVER publicly readable.
-- ════════════════════════════════════════════════════════════════

-- updated_at helper (reused by tables with updated_at)
create or replace function public.set_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

-- ── Enums ─────────────────────────────────────────────────────────
create type public.pool_type as enum ('villa', 'riad', 'farm', 'apartment', 'other');
create type public.pool_status as enum ('draft', 'published', 'paused', 'banned');
create type public.slot_type as enum ('morning', 'afternoon', 'evening', 'full_day');
create type public.booking_status as enum ('pending', 'accepted', 'declined', 'expired', 'cancelled_by_renter');
create type public.review_target as enum ('pool', 'renter');
create type public.notification_type as enum (
  'new_request', 'request_accepted', 'request_declined',
  'request_expired', 'visit_reminder', 'new_review', 'system'
);

-- ── Profiles (extends auth.users) ─────────────────────────────────
create table public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  full_name text,
  avatar_url text,
  phone text, -- PRIVATE: never exposed to other users
  phone_verified boolean not null default false,
  preferred_lang text not null default 'fr' check (preferred_lang in ('fr', 'ar')),
  bio text,
  created_at timestamptz not null default now()
);
alter table public.profiles enable row level security;

-- Only the owner can read/update their own full row (which includes phone).
create policy "profiles_select_own" on public.profiles
  for select to authenticated using (auth.uid() = id);
create policy "profiles_update_own" on public.profiles
  for update to authenticated using (auth.uid() = id) with check (auth.uid() = id);
create policy "profiles_insert_self" on public.profiles
  for insert to authenticated with check (auth.uid() = id);

-- Public-safe projection: name / avatar / phone_verified / member-since only.
-- security_invoker = false → runs as owner and bypasses the caller's RLS, so
-- the SAFE columns of every profile are publicly readable. Phone is not in the
-- view, so it can never leak this way.
create view public.profiles_public
with (security_invoker = false) as
select id, full_name, avatar_url, phone_verified, created_at
from public.profiles;

grant select on public.profiles_public to anon, authenticated;

-- Auto-create a profile row when a new auth user signs up.
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into public.profiles (id, full_name, avatar_url)
  values (
    new.id,
    coalesce(new.raw_user_meta_data ->> 'full_name', new.raw_user_meta_data ->> 'name'),
    new.raw_user_meta_data ->> 'avatar_url'
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

create trigger on_auth_user_created
after insert on auth.users
for each row execute function public.handle_new_user();
