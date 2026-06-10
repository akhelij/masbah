-- ════════════════════════════════════════════════════════════════
-- Masbah V2 — 0017 · J+1 review reminders (visit_reminder)
--
-- The notification type existed since 0001 and the UI renders it, but nothing
-- ever emitted it — so reviews only happened if someone spontaneously revisited
-- their bookings. A daily 9:00 job now nudges BOTH sides of yesterday's
-- accepted visits to leave their review (renter → pool, owner → renter),
-- skipping anyone who already reviewed, already got the reminder, or turned
-- the type off in notif_prefs.
-- ════════════════════════════════════════════════════════════════
create or replace function public.send_visit_reminders()
returns int language plpgsql security definer set search_path = public as $$
declare v_renter int := 0; v_owner int := 0;
begin
  -- Renter side: review the pool.
  insert into public.notifications (user_id, type, payload)
  select b.renter_id, 'visit_reminder',
         jsonb_build_object('request_id', b.id, 'pool_id', b.pool_id, 'date', b.date, 'target', 'pool')
  from public.booking_requests b
  where b.status = 'accepted'
    and b.date = current_date - 1
    and public.should_notify(b.renter_id, 'visit_reminder')
    and not exists (select 1 from public.reviews r where r.booking_id = b.id and r.target_type = 'pool')
    and not exists (
      select 1 from public.notifications n
      where n.type = 'visit_reminder' and n.user_id = b.renter_id
        and n.payload->>'request_id' = b.id::text
    );
  get diagnostics v_renter = row_count;

  -- Owner side: review the guest.
  insert into public.notifications (user_id, type, payload)
  select p.owner_id, 'visit_reminder',
         jsonb_build_object('request_id', b.id, 'pool_id', b.pool_id, 'date', b.date, 'target', 'renter')
  from public.booking_requests b
  join public.pools p on p.id = b.pool_id
  where b.status = 'accepted'
    and b.date = current_date - 1
    and public.should_notify(p.owner_id, 'visit_reminder')
    and not exists (select 1 from public.reviews r where r.booking_id = b.id and r.target_type = 'renter')
    and not exists (
      select 1 from public.notifications n
      where n.type = 'visit_reminder' and n.user_id = p.owner_id
        and n.payload->>'request_id' = b.id::text
    );
  get diagnostics v_owner = row_count;

  return v_renter + v_owner;
end;
$$;
revoke execute on function public.send_visit_reminders() from public, anon, authenticated;

select cron.schedule('visit-reminders', '0 9 * * *', 'select public.send_visit_reminders();')
where not exists (select 1 from cron.job where jobname = 'visit-reminders');
