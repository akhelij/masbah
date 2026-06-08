-- ════════════════════════════════════════════════════════════════
-- Masbah V2 — 0012 · notify the owner on every new booking request
-- The lifecycle RPCs (accept/decline/cancel/expire) already notify the
-- *renter*, and the `new_request` notification type existed in the enum,
-- but nothing ever emitted it — so owners got no bell badge for incoming
-- requests, defeating the realtime inbox. This AFTER INSERT trigger fills
-- that gap. SECURITY DEFINER so the renter's insert can write a row the
-- owner will read (notifications has no INSERT policy by design).
-- Guarded on status = 'pending' so direct seed/admin inserts of already
-- accepted/declined bookings don't generate a spurious "new request".
-- ════════════════════════════════════════════════════════════════
create or replace function public.notify_owner_new_request()
returns trigger language plpgsql security definer set search_path = public as $$
declare v_owner uuid;
begin
  if new.status <> 'pending' then return new; end if;
  select owner_id into v_owner from public.pools where id = new.pool_id;
  if v_owner is not null then
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

revoke execute on function public.notify_owner_new_request() from public;

create trigger booking_requests_notify_owner
  after insert on public.booking_requests
  for each row execute function public.notify_owner_new_request();
