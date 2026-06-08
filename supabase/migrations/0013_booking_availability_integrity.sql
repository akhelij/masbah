-- ════════════════════════════════════════════════════════════════
-- Masbah V2 — 0013 · accurate availability + double-booking guard
--
-- Two related gaps in the booking loop:
--   1. booking_requests is RLS-readable only for the renter's own rows or the
--      pool owner's rows, so a browsing renter cannot see OTHER renters'
--      accepted bookings — the availability calendar under-reported taken
--      slots. Fix: a SECURITY DEFINER function that returns the taken/blocked
--      slots for a pool+date WITHOUT exposing who booked them.
--   2. accept_booking auto-declined *pending* conflicts but never checked for
--      an already-*accepted* conflict, so an owner could accept two requests
--      for the same slot/date (double-booking). Fix: reject the accept when a
--      conflicting accepted booking already exists.
-- ════════════════════════════════════════════════════════════════

-- ── 1 · public availability (no identity leak) ────────────────────
create or replace function public.pool_day_availability(p_pool_id uuid, p_date date)
returns table (
  day_blocked boolean,
  blocked_slots public.slot_type[],
  accepted_slots public.slot_type[]
)
language sql security definer stable set search_path = public as $$
  select
    exists (
      select 1 from public.blocked_dates bd
      where bd.pool_id = p_pool_id and bd.date = p_date and bd.slot is null
    ),
    coalesce((
      select array_agg(distinct bd.slot)
      from public.blocked_dates bd
      where bd.pool_id = p_pool_id and bd.date = p_date and bd.slot is not null
    ), '{}'::public.slot_type[]),
    coalesce((
      select array_agg(distinct b.slot)
      from public.booking_requests b
      where b.pool_id = p_pool_id and b.date = p_date and b.status = 'accepted'
    ), '{}'::public.slot_type[]);
$$;

revoke execute on function public.pool_day_availability(uuid, date) from public;
grant execute on function public.pool_day_availability(uuid, date) to anon, authenticated;

-- ── 2 · double-booking guard inside accept_booking ────────────────
create or replace function public.accept_booking(p_request_id uuid)
returns void language plpgsql security definer set search_path = public as $$
declare v_req record;
begin
  select * into v_req from public.booking_requests where id = p_request_id for update;
  if v_req is null then raise exception 'Request not found'; end if;
  if not public.pool_is_owned(v_req.pool_id) then raise exception 'Not authorized'; end if;
  if v_req.status <> 'pending' then raise exception 'Request is not pending'; end if;

  -- Reject if a conflicting booking is ALREADY accepted for this date (a
  -- full_day occupies the whole day, so it conflicts with every slot).
  if exists (
    select 1 from public.booking_requests b
    where b.pool_id = v_req.pool_id
      and b.date = v_req.date
      and b.id <> p_request_id
      and b.status = 'accepted'
      and (v_req.slot = 'full_day' or b.slot = 'full_day' or b.slot = v_req.slot)
  ) then
    raise exception 'A conflicting booking is already accepted for this slot';
  end if;

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
