-- ════════════════════════════════════════════════════════════════
-- Pissina V2 — 0004 · booking_requests + lifecycle RPCs + expiry cron
-- Status transitions happen ONLY through SECURITY DEFINER functions
-- (accept/decline/cancel/expire). No UPDATE policy is granted.
-- ════════════════════════════════════════════════════════════════
create table public.booking_requests (
  id uuid primary key default gen_random_uuid(),
  pool_id uuid not null references public.pools (id) on delete cascade,
  renter_id uuid not null references public.profiles (id) on delete cascade,
  date date not null,
  slot public.slot_type not null,
  guests int not null check (guests > 0),
  extras jsonb not null default '[]'::jsonb,
  message text,
  total_estimate_mad int not null default 0,
  status public.booking_status not null default 'pending',
  decline_reason text,
  responded_at timestamptz,
  expires_at timestamptz not null default (now() + interval '24 hours'),
  created_at timestamptz not null default now()
);
-- No duplicate *pending* request for the same renter+pool+date+slot.
create unique index booking_requests_no_dup_pending
  on public.booking_requests (renter_id, pool_id, date, slot)
  where status = 'pending';
create index booking_requests_pool_date_idx on public.booking_requests (pool_id, date);
create index booking_requests_renter_idx on public.booking_requests (renter_id);
create index booking_requests_expiry_idx on public.booking_requests (status, expires_at);

alter table public.booking_requests enable row level security;
create policy "bookings_select_renter" on public.booking_requests for select to authenticated
  using (renter_id = auth.uid());
create policy "bookings_select_owner" on public.booking_requests for select to authenticated
  using (public.pool_is_owned(pool_id));
create policy "bookings_insert_renter" on public.booking_requests for insert to authenticated
  with check (renter_id = auth.uid());

-- ── Server-side validation (RLS-bypassing checks against other tables) ──
create or replace function public.validate_booking_request()
returns trigger language plpgsql security definer set search_path = public as $$
declare
  v_pool record;
  v_pending int;
begin
  select owner_id, max_guests, status into v_pool from public.pools where id = new.pool_id;
  if v_pool is null then raise exception 'Pool not found'; end if;
  if v_pool.status <> 'published' then raise exception 'Pool is not available for booking'; end if;
  if new.renter_id = v_pool.owner_id then raise exception 'Owners cannot book their own pool'; end if;
  if new.guests > v_pool.max_guests then raise exception 'Guests exceed pool capacity (max %)', v_pool.max_guests; end if;
  if new.date < current_date then raise exception 'Date must be today or later'; end if;
  if not exists (
    select 1 from public.pool_slots s where s.pool_id = new.pool_id and s.slot = new.slot and s.enabled
  ) then raise exception 'Selected slot is not available for this pool'; end if;
  if exists (
    select 1 from public.blocked_dates b
    where b.pool_id = new.pool_id and b.date = new.date and (b.slot is null or b.slot = new.slot)
  ) then raise exception 'This date/slot is not available'; end if;
  select count(*) into v_pending from public.booking_requests
    where renter_id = new.renter_id and status = 'pending';
  if v_pending >= 5 then raise exception 'Too many pending requests (max 5)'; end if;
  return new;
end;
$$;
create trigger booking_requests_validate before insert on public.booking_requests
  for each row execute function public.validate_booking_request();

-- ── accept_booking: accept + auto-decline conflicts + notify ──────
create or replace function public.accept_booking(p_request_id uuid)
returns void language plpgsql security definer set search_path = public as $$
declare v_req record;
begin
  select * into v_req from public.booking_requests where id = p_request_id for update;
  if v_req is null then raise exception 'Request not found'; end if;
  if not public.pool_is_owned(v_req.pool_id) then raise exception 'Not authorized'; end if;
  if v_req.status <> 'pending' then raise exception 'Request is not pending'; end if;

  update public.booking_requests set status = 'accepted', responded_at = now() where id = p_request_id;

  -- A full_day rental occupies the whole day, so it conflicts with every slot.
  with declined as (
    update public.booking_requests b
      set status = 'declined',
          decline_reason = 'Créneau attribué à une autre réservation',
          responded_at = now()
      where b.pool_id = v_req.pool_id
        and b.date = v_req.date
        and b.id <> p_request_id
        and b.status = 'pending'
        and (v_req.slot = 'full_day' or b.slot = 'full_day' or b.slot = v_req.slot)
      returning b.id, b.renter_id, b.pool_id, b.date, b.slot
  )
  insert into public.notifications (user_id, type, payload)
  select renter_id, 'request_declined',
         jsonb_build_object('request_id', id, 'pool_id', pool_id, 'date', date, 'slot', slot, 'auto', true)
  from declined;

  insert into public.notifications (user_id, type, payload)
  values (v_req.renter_id, 'request_accepted',
          jsonb_build_object('request_id', p_request_id, 'pool_id', v_req.pool_id, 'date', v_req.date, 'slot', v_req.slot));
end;
$$;

-- ── decline_booking ───────────────────────────────────────────────
create or replace function public.decline_booking(p_request_id uuid, p_reason text default null)
returns void language plpgsql security definer set search_path = public as $$
declare v_req record;
begin
  select * into v_req from public.booking_requests where id = p_request_id for update;
  if v_req is null then raise exception 'Request not found'; end if;
  if not public.pool_is_owned(v_req.pool_id) then raise exception 'Not authorized'; end if;
  if v_req.status <> 'pending' then raise exception 'Request is not pending'; end if;
  update public.booking_requests set status = 'declined', decline_reason = p_reason, responded_at = now()
    where id = p_request_id;
  insert into public.notifications (user_id, type, payload)
  values (v_req.renter_id, 'request_declined',
          jsonb_build_object('request_id', p_request_id, 'pool_id', v_req.pool_id, 'date', v_req.date, 'slot', v_req.slot, 'reason', p_reason));
end;
$$;

-- ── cancel_booking (renter) ───────────────────────────────────────
create or replace function public.cancel_booking(p_request_id uuid)
returns void language plpgsql security definer set search_path = public as $$
declare v_req record;
begin
  select * into v_req from public.booking_requests where id = p_request_id for update;
  if v_req is null then raise exception 'Request not found'; end if;
  if v_req.renter_id <> auth.uid() then raise exception 'Not authorized'; end if;
  if v_req.status not in ('pending', 'accepted') then raise exception 'Cannot cancel this request'; end if;
  update public.booking_requests set status = 'cancelled_by_renter', responded_at = now() where id = p_request_id;
  insert into public.notifications (user_id, type, payload)
  select p.owner_id, 'system',
         jsonb_build_object('event', 'booking_cancelled', 'request_id', p_request_id, 'pool_id', v_req.pool_id, 'date', v_req.date, 'slot', v_req.slot)
  from public.pools p where p.id = v_req.pool_id;
end;
$$;

-- ── get_pool_contact: reveal private contact ONLY post-acceptance ──
create or replace function public.get_pool_contact(p_pool_id uuid)
returns table (address text, lat numeric, lng numeric, owner_phone text, owner_name text)
language plpgsql security definer stable set search_path = public as $$
begin
  if not public.pool_is_owned(p_pool_id) and not exists (
    select 1 from public.booking_requests b
    where b.pool_id = p_pool_id and b.renter_id = auth.uid() and b.status = 'accepted'
  ) then
    raise exception 'Not authorized to view contact details';
  end if;
  return query
    select p.address, p.lat, p.lng, pr.phone, pr.full_name
    from public.pools p join public.profiles pr on pr.id = p.owner_id
    where p.id = p_pool_id;
end;
$$;

-- ── Expiry: pending requests older than 24h → expired + notify ────
create or replace function public.expire_bookings()
returns int language plpgsql security definer set search_path = public as $$
declare v_count int := 0;
begin
  with expired as (
    update public.booking_requests set status = 'expired', responded_at = now()
      where status = 'pending' and expires_at < now()
      returning id, renter_id, pool_id, date, slot
  )
  insert into public.notifications (user_id, type, payload)
  select renter_id, 'request_expired',
         jsonb_build_object('request_id', id, 'pool_id', pool_id, 'date', date, 'slot', slot)
  from expired;
  get diagnostics v_count = row_count;
  return v_count;
end;
$$;

create extension if not exists pg_cron;
select cron.schedule('expire-bookings', '*/15 * * * *', 'select public.expire_bookings();')
where not exists (select 1 from cron.job where jobname = 'expire-bookings');
