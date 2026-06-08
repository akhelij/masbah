-- ════════════════════════════════════════════════════════════════
-- Masbah V2 — 0010 · default ownership columns to auth.uid()
-- Inserts no longer need to pass the owner/renter/author id from the client
-- (the @nuxtjs/supabase user ref isn't always populated client-side), and the
-- value can never be spoofed — it's always the authenticated caller. The
-- existing WITH CHECK (… = auth.uid()) policies still enforce this.
-- ════════════════════════════════════════════════════════════════
alter table public.pools alter column owner_id set default auth.uid();
alter table public.favorites alter column renter_id set default auth.uid();
alter table public.booking_requests alter column renter_id set default auth.uid();
alter table public.reviews alter column author_id set default auth.uid();
