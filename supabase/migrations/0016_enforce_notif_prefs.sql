-- ════════════════════════════════════════════════════════════════
-- Masbah V2 — 0016 · actually honor profiles.notif_prefs
--
-- 0015 added the per-user notification toggles and the /compte UI persists
-- them, but every notification insert (triggers + lifecycle RPCs) ignored the
-- column — turning a type off did nothing. This adds a should_notify() helper
-- (an explicit `false` for a type disables it; anything else means ON) and
-- re-creates the emitting functions with the guard. Function bodies are
-- otherwise identical to their latest versions (0013 accept_booking with the
-- double-booking guard, 0005 decline/expire, 0006 create_review, 0012 trigger).
-- The 'system' type (renter cancellations) stays always-on: it is operational,
-- not a preference.
-- ════════════════════════════════════════════════════════════════

create or replace function public.should_notify(p_user_id uuid, p_type text)
returns boolean language sql security definer stable set search_path = public as $$
  select coalesce((select notif_prefs ->> p_type from public.profiles where id = p_user_id), '') is distinct from 'false';
$$;
revoke execute on function public.should_notify(uuid, text) from public, anon, authenticated;

-- ── new_request (trigger, 0012) ───────────────────────────────────
create or replace function public.notify_owner_new_request()
returns trigger language plpgsql security definer set search_path = public as $$
declare v_owner uuid;
begin
  if new.status <> 'pending' then return new; end if;
  select owner_id into v_owner from public.pools where id = new.pool_id;
  if v_owner is not null and public.should_notify(v_owner, 'new_request') then
    insert into public.notifications (user_id, type, payload)
    values (
      v_owner, 'new_request',
      jsonb_build_object(
        'request_id', new.id, 'pool_id', new.pool_id,
        'date', new.date, 'slot', new.slot, 'renter_id', new.renter_id
      )
    );
  end if;
  return new;
end;
$$;
revoke execute on function public.notify_owner_new_request() from public, anon, authenticated;

-- ── accept_booking (0013 body + pref guards) ──────────────────────
create or replace function public.accept_booking(p_request_id uuid)
returns void language plpgsql security definer set search_path = public as $$
declare v_req record;
begin
  select * into v_req from public.booking_requests where id = p_request_id for update;
  if v_req is null then raise exception 'Request not found'; end if;
  if not public.pool_is_owned(v_req.pool_id) then raise exception 'Not authorized'; end if;
  if v_req.status <> 'pending' then raise exception 'Request is not pending'; end if;

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
  from declined
  where public.should_notify(renter_id, 'request_declined');

  if public.should_notify(v_req.renter_id, 'request_accepted') then
    insert into public.notifications (user_id, type, payload)
    values (v_req.renter_id, 'request_accepted',
            jsonb_build_object('request_id', p_request_id, 'pool_id', v_req.pool_id, 'date', v_req.date, 'slot', v_req.slot));
  end if;
end;
$$;

-- ── decline_booking (0005 body + pref guard) ──────────────────────
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
  if public.should_notify(v_req.renter_id, 'request_declined') then
    insert into public.notifications (user_id, type, payload)
    values (v_req.renter_id, 'request_declined',
            jsonb_build_object('request_id', p_request_id, 'pool_id', v_req.pool_id, 'date', v_req.date, 'slot', v_req.slot, 'reason', p_reason));
  end if;
end;
$$;

-- ── expire_bookings (0005 body + pref guard) ──────────────────────
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
  from expired
  where public.should_notify(renter_id, 'request_expired');
  get diagnostics v_count = row_count;
  return v_count;
end;
$$;

-- ── create_review (0006 body + pref guards on new_review) ─────────
create or replace function public.create_review(
  p_booking_id uuid,
  p_target_type public.review_target,
  p_rating int,
  p_categories jsonb default '{}'::jsonb,
  p_comment text default null
) returns uuid language plpgsql security definer set search_path = public as $$
declare v_b record; v_review_id uuid;
begin
  select b.renter_id, b.pool_id, b.status, b.date, p.owner_id as pool_owner
    into v_b
  from public.booking_requests b join public.pools p on p.id = b.pool_id
  where b.id = p_booking_id;
  if v_b is null then raise exception 'Booking not found'; end if;
  if v_b.status <> 'accepted' then raise exception 'Reviews require an accepted booking'; end if;
  if v_b.date >= current_date then raise exception 'You can review only after the visit date'; end if;

  if p_target_type = 'pool' then
    if auth.uid() <> v_b.renter_id then raise exception 'Only the renter can review the pool'; end if;
    insert into public.reviews (booking_id, author_id, target_type, pool_id, rating, categories, comment)
    values (p_booking_id, auth.uid(), 'pool', v_b.pool_id, p_rating, p_categories, p_comment)
    returning id into v_review_id;
    if public.should_notify(v_b.pool_owner, 'new_review') then
      insert into public.notifications (user_id, type, payload)
      values (v_b.pool_owner, 'new_review', jsonb_build_object('review_id', v_review_id, 'booking_id', p_booking_id, 'target_type', 'pool'));
    end if;
  else
    if auth.uid() <> v_b.pool_owner then raise exception 'Only the owner can review the renter'; end if;
    insert into public.reviews (booking_id, author_id, target_type, target_user_id, rating, categories, comment)
    values (p_booking_id, auth.uid(), 'renter', v_b.renter_id, p_rating, p_categories, p_comment)
    returning id into v_review_id;
    if public.should_notify(v_b.renter_id, 'new_review') then
      insert into public.notifications (user_id, type, payload)
      values (v_b.renter_id, 'new_review', jsonb_build_object('review_id', v_review_id, 'booking_id', p_booking_id, 'target_type', 'renter'));
    end if;
  end if;
  return v_review_id;
end;
$$;
