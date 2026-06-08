-- ════════════════════════════════════════════════════════════════
-- Masbah V2 — 0011 · allow NULL city_id for drafts
-- The publish wizard creates a blank draft before the owner picks a city
-- (step 1). city_id stays a FK to cities; publishing is gated on it being set
-- (publishReadiness), so published pools always have a city.
-- ════════════════════════════════════════════════════════════════
alter table public.pools alter column city_id drop not null;
