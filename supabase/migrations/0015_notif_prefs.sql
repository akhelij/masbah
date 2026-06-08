-- ════════════════════════════════════════════════════════════════
-- Masbah V2 — 0015 · per-user notification preferences
-- Adds a jsonb column on profiles to store the user's notification toggles
-- (new_request / request_accepted / request_declined / new_review). Read and
-- written by the account settings page via own-row RLS on profiles; an empty
-- object means "all defaults on". No new policies are needed — the existing
-- own-row SELECT/UPDATE policies on public.profiles already cover this column.
-- ════════════════════════════════════════════════════════════════
alter table public.profiles
  add column if not exists notif_prefs jsonb not null default '{}'::jsonb;
