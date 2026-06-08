-- ════════════════════════════════════════════════════════════════
-- Pissina V2 — 0007 · security hardening (advisor follow-ups)
-- Note: pools_public / profiles_public stay SECURITY DEFINER on purpose —
-- they expose only safe columns while owners keep full base-table access
-- via RLS. That is the intended design, not a weakening.
-- ════════════════════════════════════════════════════════════════

-- pool_ratings only reads public reviews → run as invoker (clears lint).
alter view public.pool_ratings set (security_invoker = true);

-- Pin search_path on the one helper that was missing it.
alter function public.set_updated_at() set search_path = public;

-- Public bucket serves objects via URL; clients list photos through the
-- pool_photos table. Drop the broad SELECT policy so the bucket can't be listed.
drop policy if exists "pool_photos_public_read" on storage.objects;

-- Trigger / cron-only functions must not be callable through the REST API.
revoke execute on function public.expire_bookings() from anon, authenticated;
revoke execute on function public.handle_new_user() from anon, authenticated;
revoke execute on function public.validate_booking_request() from anon, authenticated;

-- These RPCs require a signed-in user (they check auth.uid() internally);
-- remove the anon execute grant as defense-in-depth.
revoke execute on function public.accept_booking(uuid) from anon;
revoke execute on function public.decline_booking(uuid, text) from anon;
revoke execute on function public.cancel_booking(uuid) from anon;
revoke execute on function public.create_review(uuid, public.review_target, integer, jsonb, text) from anon;
revoke execute on function public.reply_to_review(uuid, text) from anon;
revoke execute on function public.get_pool_contact(uuid) from anon;

-- pool_is_owned is only referenced by `to authenticated` policies.
revoke execute on function public.pool_is_owned(uuid) from anon;
-- pool_is_visible stays callable by anon: it is used by anon SELECT policies.
