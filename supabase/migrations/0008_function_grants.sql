-- ════════════════════════════════════════════════════════════════
-- Pissina V2 — 0008 · lock down function EXECUTE grants
-- Postgres grants EXECUTE to PUBLIC by default, so 0007's revoke from
-- anon/authenticated was insufficient. Revoke from PUBLIC, then grant
-- narrowly to the roles that actually need each function.
-- ════════════════════════════════════════════════════════════════

-- Trigger / cron only — never callable through the REST API.
revoke execute on function public.handle_new_user() from public, anon, authenticated;
revoke execute on function public.validate_booking_request() from public, anon, authenticated;
revoke execute on function public.expire_bookings() from public, anon, authenticated;

-- Authenticated-only RPCs (each also checks auth.uid() internally).
revoke execute on function public.accept_booking(uuid) from public, anon;
revoke execute on function public.decline_booking(uuid, text) from public, anon;
revoke execute on function public.cancel_booking(uuid) from public, anon;
revoke execute on function public.create_review(uuid, public.review_target, integer, jsonb, text) from public, anon;
revoke execute on function public.reply_to_review(uuid, text) from public, anon;
revoke execute on function public.get_pool_contact(uuid) from public, anon;
grant execute on function public.accept_booking(uuid) to authenticated;
grant execute on function public.decline_booking(uuid, text) to authenticated;
grant execute on function public.cancel_booking(uuid) to authenticated;
grant execute on function public.create_review(uuid, public.review_target, integer, jsonb, text) to authenticated;
grant execute on function public.reply_to_review(uuid, text) to authenticated;
grant execute on function public.get_pool_contact(uuid) to authenticated;

-- RLS helper referenced only by `to authenticated` policies.
revoke execute on function public.pool_is_owned(uuid) from public, anon;
grant execute on function public.pool_is_owned(uuid) to authenticated;

-- pool_is_visible stays callable by anon: anon SELECT policies (pool_photos,
-- pool_slots, blocked_dates) evaluate it. It returns only a visibility boolean.
revoke execute on function public.pool_is_visible(uuid) from public;
grant execute on function public.pool_is_visible(uuid) to anon, authenticated;
