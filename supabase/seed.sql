-- ════════════════════════════════════════════════════════════════
-- Masbah V2 — repeatable seed (non-auth portion)
--
-- This file seeds realistic Moroccan demo data: profiles (owner fields),
-- pools, slots, photos, booking_requests and reviews. It is idempotent —
-- safe to run multiple times (explicit UUIDs + ON CONFLICT / NOT EXISTS).
--
-- ── AUTH USERS (created OUT OF BAND, NOT by this file) ──────────────
-- The 5 seed users below are created via the Supabase Admin API
-- (POST {SUPABASE_URL}/auth/v1/admin/users with the service role key —
-- which must NEVER live in this repo). Each is created with
-- email_confirm:true, password `MasbahSeed2026!`, and
-- user_metadata.full_name (the on_auth_user_created trigger then inserts
-- the matching public.profiles row). This file references them by email.
--
--   Owners:
--     masbah.seed.salma.2026@gmail.com    — Salma Bennani
--     masbah.seed.youssef.2026@gmail.com  — Youssef El Amrani
--   Renters:
--     masbah.seed.amine.2026@gmail.com    — Amine Tazi
--     masbah.seed.fatima.2026@gmail.com   — Fatima Zahra
--     masbah.seed.omar.2026@gmail.com     — Omar Idrissi
--
-- To recreate the users (bash; export SERVICE_KEY first, do not commit it):
--   for u in 'masbah.seed.salma.2026@gmail.com|Salma Bennani' \
--            'masbah.seed.youssef.2026@gmail.com|Youssef El Amrani' \
--            'masbah.seed.amine.2026@gmail.com|Amine Tazi' \
--            'masbah.seed.fatima.2026@gmail.com|Fatima Zahra' \
--            'masbah.seed.omar.2026@gmail.com|Omar Idrissi'; do
--     email="${u%%|*}"; name="${u##*|}"
--     curl -s -X POST "$SUPABASE_URL/auth/v1/admin/users" \
--       -H "apikey: $SERVICE_KEY" -H "Authorization: Bearer $SERVICE_KEY" \
--       -H "Content-Type: application/json" \
--       -d "{\"email\":\"$email\",\"password\":\"MasbahSeed2026!\",\"email_confirm\":true,\"user_metadata\":{\"full_name\":\"$name\"}}";
--   done
--
-- NOTE: run with a role that bypasses RLS (e.g. the SQL editor / service
-- role). Reviews are inserted directly (not via create_review) since this
-- is seeding; the (booking_id, target_type) uniqueness is still respected.
-- ════════════════════════════════════════════════════════════════

begin;

-- ── Owner profile enrichment (phone is PRIVATE; only set on owners) ──
update public.profiles set
  phone = '+212661234501', phone_verified = true, preferred_lang = 'fr',
  bio = 'Propriétaire à Dar Bouazza. Je loue ma villa avec piscine chauffée les week-ends. Accueil chaleureux et cadre familial.'
where id = (select id from auth.users where email = 'masbah.seed.salma.2026@gmail.com');

update public.profiles set
  phone = '+212662987602', phone_verified = true, preferred_lang = 'fr',
  bio = 'Je mets à disposition deux belles piscines près de Marrakech et Rabat. Idéal pour familles et petits groupes.'
where id = (select id from auth.users where email = 'masbah.seed.youssef.2026@gmail.com');

-- ════════════════════════════════════════════════════════════════
-- POOLS (explicit UUIDs so child rows + bookings can reference them)
--   0001,0002 → Salma   |   0003..0006 → Youssef
-- approx_lat/approx_lng = city centre ± ~0.01 jitter (never the real spot).
-- ════════════════════════════════════════════════════════════════
insert into public.pools (
  id, owner_id, title, description, type, city_id, neighborhood,
  address, lat, lng, approx_lat, approx_lng,
  max_guests, length_m, width_m, depth_min, depth_max,
  heated, covered, child_safe, sheltered_from_view, owner_present,
  direct_contact_enabled, rules, amenities, status, completion_score
) values
-- ── 0001 · Salma · Dar Bouazza ──────────────────────────────────
('11111111-1111-1111-1111-111111110001',
 (select id from auth.users where email = 'masbah.seed.salma.2026@gmail.com'),
 'Villa avec piscine chauffée à Dar Bouazza',
 'Belle villa familiale avec grande piscine chauffée, jardin arboré et coin barbecue. À 5 minutes de la plage. Idéale pour une journée détente entre amis ou en famille. Transats, parasols et douche extérieure disponibles.',
 'villa', (select id from public.cities where slug = 'dar-bouazza'), 'Lotissement Dar Bouazza',
 'Lotissement Riad Al Andalous, Rue 12, Villa 47, Dar Bouazza', 33.5341, -7.8252, 33.5318, -7.8276,
 25, 12, 6, 1.2, 2.0,
 true, false, true, true, true,
 true,
 '{"kids_allowed":true,"music_allowed":true,"events_allowed":false,"pets_allowed":false,"quiet_hours":"22:00-08:00"}'::jsonb,
 '[
   {"key":"barbecue","label_fr":"Barbecue","label_ar":"شواء","included":true,"price":0,"per_person":false},
   {"key":"transats","label_fr":"Transats","label_ar":"كراسي استلقاء","included":true,"price":0,"per_person":false},
   {"key":"douche","label_fr":"Douche extérieure","label_ar":"دش خارجي","included":true,"price":0,"per_person":false},
   {"key":"parking","label_fr":"Parking privé","label_ar":"موقف خاص","included":true,"price":0,"per_person":false},
   {"key":"wifi","label_fr":"Wi-Fi","label_ar":"واي فاي","included":true,"price":0,"per_person":false},
   {"key":"cuisine","label_fr":"Accès cuisine","label_ar":"استعمال المطبخ","included":false,"price":150,"per_person":false}
 ]'::jsonb,
 'published', 92),

-- ── 0002 · Salma · Bouskoura ────────────────────────────────────
('11111111-1111-1111-1111-111111110002',
 (select id from auth.users where email = 'masbah.seed.salma.2026@gmail.com'),
 'Piscine privée au calme à Bouskoura',
 'Piscine rectangulaire dans une résidence calme et sécurisée à Bouskoura, entourée de verdure. Parfait pour se ressourcer loin de l''agitation. Cuisine d''été équipée et grand espace ombragé.',
 'villa', (select id from public.cities where slug = 'bouskoura'), 'Bouskoura Golf City',
 'Bouskoura Golf City, Îlot 8, Villa 23', 33.4495, -7.6519, 33.4471, -7.6543,
 18, 10, 5, 1.4, 1.8,
 false, false, true, true, false,
 true,
 '{"kids_allowed":true,"music_allowed":false,"events_allowed":false,"pets_allowed":false,"quiet_hours":"21:00-09:00"}'::jsonb,
 '[
   {"key":"transats","label_fr":"Transats","label_ar":"كراسي استلقاء","included":true,"price":0,"per_person":false},
   {"key":"parking","label_fr":"Parking privé","label_ar":"موقف خاص","included":true,"price":0,"per_person":false},
   {"key":"cuisine","label_fr":"Cuisine d''été","label_ar":"مطبخ صيفي","included":true,"price":0,"per_person":false},
   {"key":"barbecue","label_fr":"Barbecue","label_ar":"شواء","included":false,"price":100,"per_person":false},
   {"key":"transport","label_fr":"Navette aller-retour","label_ar":"نقل ذهاب وإياب","included":false,"price":50,"per_person":true}
 ]'::jsonb,
 'published', 80),

-- ── 0003 · Youssef · Marrakech ──────────────────────────────────
('11111111-1111-1111-1111-111111110003',
 (select id from auth.users where email = 'masbah.seed.youssef.2026@gmail.com'),
 'Riad avec piscine au cœur de Marrakech',
 'Authentique riad rénové avec patio et piscine rafraîchissante, à deux pas de la médina. Ambiance marocaine traditionnelle, zelliges et palmiers. Thé à la menthe offert à l''arrivée.',
 'riad', (select id from public.cities where slug = 'marrakech'), 'Médina',
 'Derb Sidi Bouloukat N°18, Médina', 31.6339, -7.9771, 31.6362, -7.9748,
 12, 8, 4, 1.2, 1.6,
 false, false, false, true, true,
 true,
 '{"kids_allowed":true,"music_allowed":true,"events_allowed":true,"pets_allowed":false,"quiet_hours":"23:00-08:00"}'::jsonb,
 '[
   {"key":"the","label_fr":"Thé à la menthe","label_ar":"أتاي بالنعناع","included":true,"price":0,"per_person":false},
   {"key":"transats","label_fr":"Transats","label_ar":"كراسي استلقاء","included":true,"price":0,"per_person":false},
   {"key":"wifi","label_fr":"Wi-Fi","label_ar":"واي فاي","included":true,"price":0,"per_person":false},
   {"key":"cuisine","label_fr":"Repas traditionnel","label_ar":"وجبة تقليدية","included":false,"price":120,"per_person":true},
   {"key":"barbecue","label_fr":"Barbecue","label_ar":"شواء","included":false,"price":150,"per_person":false}
 ]'::jsonb,
 'published', 78),

-- ── 0004 · Youssef · Rabat ──────────────────────────────────────
('11111111-1111-1111-1111-111111110004',
 (select id from auth.users where email = 'masbah.seed.youssef.2026@gmail.com'),
 'Grande piscine familiale à Rabat',
 'Spacieuse piscine dans une villa à Souissi, quartier résidentiel haut standing. Grand jardin parfait pour les enfants, aire de jeux et nombreux transats. Présence discrète du propriétaire pour vous accompagner.',
 'villa', (select id from public.cities where slug = 'rabat'), 'Souissi',
 'Avenue Mehdi Ben Barka, Villa 9, Souissi', 34.0212, -6.8270, 34.0189, -6.8294,
 30, 14, 7, 1.0, 2.2,
 true, false, true, false, true,
 true,
 '{"kids_allowed":true,"music_allowed":true,"events_allowed":false,"pets_allowed":true,"quiet_hours":"22:00-08:00"}'::jsonb,
 '[
   {"key":"transats","label_fr":"Transats","label_ar":"كراسي استلقاء","included":true,"price":0,"per_person":false},
   {"key":"parking","label_fr":"Parking privé","label_ar":"موقف خاص","included":true,"price":0,"per_person":false},
   {"key":"douche","label_fr":"Douche extérieure","label_ar":"دش خارجي","included":true,"price":0,"per_person":false},
   {"key":"aire_jeux","label_fr":"Aire de jeux enfants","label_ar":"مساحة لعب للأطفال","included":true,"price":0,"per_person":false},
   {"key":"wifi","label_fr":"Wi-Fi","label_ar":"واي فاي","included":true,"price":0,"per_person":false},
   {"key":"barbecue","label_fr":"Barbecue","label_ar":"شواء","included":false,"price":120,"per_person":false}
 ]'::jsonb,
 'published', 88),

-- ── 0005 · Youssef · Mohammedia ─────────────────────────────────
('11111111-1111-1111-1111-111111110005',
 (select id from auth.users where email = 'masbah.seed.youssef.2026@gmail.com'),
 'Piscine couverte et chauffée à Mohammedia',
 'Piscine intérieure chauffée, utilisable toute l''année quelle que soit la météo. Cadre élégant, à l''abri des regards. Idéale pour les amateurs de baignade au calme et hors saison.',
 'villa', (select id from public.cities where slug = 'mohammedia'), 'Parc',
 'Rue des Roses N°31, Quartier du Parc', 33.6866, -7.3848, 33.6843, -7.3871,
 15, 10, 5, 1.3, 1.9,
 true, true, false, true, false,
 true,
 '{"kids_allowed":true,"music_allowed":false,"events_allowed":false,"pets_allowed":false,"quiet_hours":"21:00-09:00"}'::jsonb,
 '[
   {"key":"transats","label_fr":"Transats","label_ar":"كراسي استلقاء","included":true,"price":0,"per_person":false},
   {"key":"douche","label_fr":"Douche chaude","label_ar":"دش ساخن","included":true,"price":0,"per_person":false},
   {"key":"parking","label_fr":"Parking privé","label_ar":"موقف خاص","included":true,"price":0,"per_person":false},
   {"key":"serviettes","label_fr":"Serviettes","label_ar":"مناشف","included":false,"price":30,"per_person":true},
   {"key":"cuisine","label_fr":"Accès cuisine","label_ar":"استعمال المطبخ","included":false,"price":100,"per_person":false}
 ]'::jsonb,
 'published', 84),

-- ── 0006 · Youssef · Bouznika ───────────────────────────────────
('11111111-1111-1111-1111-111111110006',
 (select id from auth.users where email = 'masbah.seed.youssef.2026@gmail.com'),
 'Piscine vue mer à Bouznika',
 'Magnifique piscine à débordement avec vue sur l''océan, à Bouznika. Grand espace lounge, parfait pour un anniversaire ou une journée entre amis. Coucher de soleil garanti. Sonorisation autorisée jusqu''en soirée.',
 'villa', (select id from public.cities where slug = 'bouznika'), 'Bouznika Bay',
 'Résidence Bouznika Bay, Bloc C, Villa 14', 33.7884, -7.1500, 33.7861, -7.1523,
 40, 16, 6, 1.2, 2.4,
 false, false, false, false, true,
 true,
 '{"kids_allowed":true,"music_allowed":true,"events_allowed":true,"pets_allowed":false,"quiet_hours":"00:00-08:00"}'::jsonb,
 '[
   {"key":"transats","label_fr":"Transats & parasols","label_ar":"كراسي ومظلات","included":true,"price":0,"per_person":false},
   {"key":"parking","label_fr":"Parking privé","label_ar":"موقف خاص","included":true,"price":0,"per_person":false},
   {"key":"wifi","label_fr":"Wi-Fi","label_ar":"واي فاي","included":true,"price":0,"per_person":false},
   {"key":"sono","label_fr":"Sonorisation","label_ar":"نظام صوتي","included":false,"price":200,"per_person":false},
   {"key":"barbecue","label_fr":"Barbecue","label_ar":"شواء","included":false,"price":150,"per_person":false},
   {"key":"traiteur","label_fr":"Service traiteur","label_ar":"خدمة تموين","included":false,"price":180,"per_person":true}
 ]'::jsonb,
 'published', 90)
on conflict (id) do nothing;

-- ════════════════════════════════════════════════════════════════
-- POOL SLOTS  (realistic subset per pool; weekend premium on some)
-- ════════════════════════════════════════════════════════════════
insert into public.pool_slots (pool_id, slot, price_mad, enabled, weekend_premium_pct) values
  -- 0001 Dar Bouazza (chauffée, premium)
  ('11111111-1111-1111-1111-111111110001', 'morning',   450, true, 15),
  ('11111111-1111-1111-1111-111111110001', 'afternoon', 600, true, 20),
  ('11111111-1111-1111-1111-111111110001', 'full_day',  900, true, 20),
  -- 0002 Bouskoura
  ('11111111-1111-1111-1111-111111110002', 'morning',   350, true, 10),
  ('11111111-1111-1111-1111-111111110002', 'afternoon', 450, true, 15),
  -- 0003 Marrakech riad
  ('11111111-1111-1111-1111-111111110003', 'afternoon', 400, true, 15),
  ('11111111-1111-1111-1111-111111110003', 'evening',   500, true, 25),
  ('11111111-1111-1111-1111-111111110003', 'full_day',  750, true, 20),
  -- 0004 Rabat (grande, familiale)
  ('11111111-1111-1111-1111-111111110004', 'morning',   500, true, 15),
  ('11111111-1111-1111-1111-111111110004', 'afternoon', 650, true, 20),
  ('11111111-1111-1111-1111-111111110004', 'full_day',  900, true, 20),
  -- 0005 Mohammedia (couverte)
  ('11111111-1111-1111-1111-111111110005', 'morning',   400, true, 10),
  ('11111111-1111-1111-1111-111111110005', 'afternoon', 500, true, 15),
  ('11111111-1111-1111-1111-111111110005', 'evening',   550, true, 20),
  -- 0006 Bouznika (vue mer, events)
  ('11111111-1111-1111-1111-111111110006', 'afternoon', 700, true, 20),
  ('11111111-1111-1111-1111-111111110006', 'evening',   800, true, 25),
  ('11111111-1111-1111-1111-111111110006', 'full_day',  900, true, 25)
on conflict (pool_id, slot) do nothing;

-- ════════════════════════════════════════════════════════════════
-- POOL PHOTOS  (full Unsplash URLs in storage_path; position 0 = cover)
-- The usePoolImageUrl helper returns http(s) paths as-is.
-- ════════════════════════════════════════════════════════════════
insert into public.pool_photos (pool_id, storage_path, position, is_cover) values
  -- 0001
  ('11111111-1111-1111-1111-111111110001', 'https://images.unsplash.com/photo-1571896349842-33c89424de2d?auto=format&fit=crop&w=1200&q=70', 0, true),
  ('11111111-1111-1111-1111-111111110001', 'https://images.unsplash.com/photo-1572331165267-854da2b10ccc?auto=format&fit=crop&w=1200&q=70', 1, false),
  ('11111111-1111-1111-1111-111111110001', 'https://images.unsplash.com/photo-1613490493576-7fde63acd811?auto=format&fit=crop&w=1200&q=70', 2, false),
  ('11111111-1111-1111-1111-111111110001', 'https://images.unsplash.com/photo-1583608205776-bfd35f0d9f83?auto=format&fit=crop&w=1200&q=70', 3, false),
  -- 0002
  ('11111111-1111-1111-1111-111111110002', 'https://images.unsplash.com/photo-1576013551627-0cc20b96c2a7?auto=format&fit=crop&w=1200&q=70', 0, true),
  ('11111111-1111-1111-1111-111111110002', 'https://images.unsplash.com/photo-1540541338287-41700207dee6?auto=format&fit=crop&w=1200&q=70', 1, false),
  ('11111111-1111-1111-1111-111111110002', 'https://images.unsplash.com/photo-1568605114967-8130f3a36994?auto=format&fit=crop&w=1200&q=70', 2, false),
  -- 0003 (riad)
  ('11111111-1111-1111-1111-111111110003', 'https://images.unsplash.com/photo-1582610116397-edb318620f90?auto=format&fit=crop&w=1200&q=70', 0, true),
  ('11111111-1111-1111-1111-111111110003', 'https://images.unsplash.com/photo-1518684079-3c830dcef090?auto=format&fit=crop&w=1200&q=70', 1, false),
  ('11111111-1111-1111-1111-111111110003', 'https://images.unsplash.com/photo-1602002418082-a4443e081dd1?auto=format&fit=crop&w=1200&q=70', 2, false),
  -- 0004
  ('11111111-1111-1111-1111-111111110004', 'https://images.unsplash.com/photo-1566073771259-6a8506099945?auto=format&fit=crop&w=1200&q=70', 0, true),
  ('11111111-1111-1111-1111-111111110004', 'https://images.unsplash.com/photo-1535827841776-24afc1e255ac?auto=format&fit=crop&w=1200&q=70', 1, false),
  ('11111111-1111-1111-1111-111111110004', 'https://images.unsplash.com/photo-1551882547-ff40c63fe5fa?auto=format&fit=crop&w=1200&q=70', 2, false),
  ('11111111-1111-1111-1111-111111110004', 'https://images.unsplash.com/photo-1505691938895-1758d7feb511?auto=format&fit=crop&w=1200&q=70', 3, false),
  -- 0005 (couverte)
  ('11111111-1111-1111-1111-111111110005', 'https://images.unsplash.com/photo-1574691250077-03a929faece5?auto=format&fit=crop&w=1200&q=70', 0, true),
  ('11111111-1111-1111-1111-111111110005', 'https://images.unsplash.com/photo-1560185007-cde436f6a4d0?auto=format&fit=crop&w=1200&q=70', 1, false),
  ('11111111-1111-1111-1111-111111110005', 'https://images.unsplash.com/photo-1571902943202-507ec2618e8f?auto=format&fit=crop&w=1200&q=70', 2, false),
  -- 0006 (vue mer)
  ('11111111-1111-1111-1111-111111110006', 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=1200&q=70', 0, true),
  ('11111111-1111-1111-1111-111111110006', 'https://images.unsplash.com/photo-1505881502353-a1986add3762?auto=format&fit=crop&w=1200&q=70', 1, false),
  ('11111111-1111-1111-1111-111111110006', 'https://images.unsplash.com/photo-1519046904884-53103b34b206?auto=format&fit=crop&w=1200&q=70', 2, false),
  ('11111111-1111-1111-1111-111111110006', 'https://images.unsplash.com/photo-1535262412227-85541e910204?auto=format&fit=crop&w=1200&q=70', 3, false)
on conflict do nothing;

-- ════════════════════════════════════════════════════════════════
-- BOOKING REQUESTS (explicit UUIDs)
--   B1,B2,B3,B4 = accepted + PAST date (enable reviews)
--   B5,B6       = pending + FUTURE date
-- total_estimate_mad ≈ slot base price (× guests for per-person extras).
-- NOTE: we set status/responded_at directly here (seeding bypasses the
-- accept_booking RPC). guests ≤ pool max_guests.
--
-- The validate_booking_request BEFORE-INSERT trigger rejects past dates
-- (date < current_date). Seeding legitimately needs accepted+past
-- bookings (so reviews are allowed), so we disable the trigger only
-- around these inserts and re-enable it immediately after.
-- ════════════════════════════════════════════════════════════════
alter table public.booking_requests disable trigger booking_requests_validate;

insert into public.booking_requests (
  id, pool_id, renter_id, date, slot, guests, extras, message,
  total_estimate_mad, status, responded_at, expires_at, created_at
) values
  -- B1 · Amine → Salma 0001 (Dar Bouazza) · accepted, past
  ('22222222-2222-2222-2222-222222220001',
   '11111111-1111-1111-1111-111111110001',
   (select id from auth.users where email = 'masbah.seed.amine.2026@gmail.com'),
   (current_date - 14), 'afternoon', 8, '[]'::jsonb,
   'Bonjour, journée en famille prévue, merci !',
   600, 'accepted', (current_date - 20)::timestamptz, (current_date - 19)::timestamptz, (current_date - 21)::timestamptz),
  -- B2 · Fatima → Salma 0002 (Bouskoura) · accepted, past
  ('22222222-2222-2222-2222-222222220002',
   '11111111-1111-1111-1111-111111110002',
   (select id from auth.users where email = 'masbah.seed.fatima.2026@gmail.com'),
   (current_date - 10), 'morning', 6, '[]'::jsonb,
   'Anniversaire surprise, on sera 6 adultes.',
   350, 'accepted', (current_date - 16)::timestamptz, (current_date - 15)::timestamptz, (current_date - 17)::timestamptz),
  -- B3 · Omar → Youssef 0004 (Rabat) · accepted, past
  ('22222222-2222-2222-2222-222222220003',
   '11111111-1111-1111-1111-111111110004',
   (select id from auth.users where email = 'masbah.seed.omar.2026@gmail.com'),
   (current_date - 7), 'full_day', 20, '[]'::jsonb,
   'Réunion de famille, journée complète.',
   900, 'accepted', (current_date - 12)::timestamptz, (current_date - 11)::timestamptz, (current_date - 13)::timestamptz),
  -- B4 · Amine → Youssef 0005 (Mohammedia) · accepted, past
  ('22222222-2222-2222-2222-222222220004',
   '11111111-1111-1111-1111-111111110005',
   (select id from auth.users where email = 'masbah.seed.amine.2026@gmail.com'),
   (current_date - 5), 'afternoon', 10, '[]'::jsonb,
   'Baignade au calme un après-midi.',
   500, 'accepted', (current_date - 9)::timestamptz, (current_date - 8)::timestamptz, (current_date - 10)::timestamptz),
  -- B5 · Fatima → Youssef 0006 (Bouznika) · pending, future
  ('22222222-2222-2222-2222-222222220005',
   '11111111-1111-1111-1111-111111110006',
   (select id from auth.users where email = 'masbah.seed.fatima.2026@gmail.com'),
   (current_date + 9), 'evening', 25, '[]'::jsonb,
   'Soirée entre amis face au coucher de soleil ?',
   800, 'pending', null, (now() + interval '24 hours'), now()),
  -- B6 · Omar → Salma 0001 (Dar Bouazza) · pending, future
  ('22222222-2222-2222-2222-222222220006',
   '11111111-1111-1111-1111-111111110001',
   (select id from auth.users where email = 'masbah.seed.omar.2026@gmail.com'),
   (current_date + 5), 'full_day', 12, '[]'::jsonb,
   'Disponible pour une journée complète ce week-end ?',
   900, 'pending', null, (now() + interval '24 hours'), now())
on conflict (id) do nothing;

alter table public.booking_requests enable trigger booking_requests_validate;

-- ════════════════════════════════════════════════════════════════
-- REVIEWS (seeded directly — bypasses create_review; one per
-- (booking_id, target_type)). Pool reviews from the renters of the
-- accepted+past bookings → pools surface aggregate ratings.
-- categories: {proprete, conformite, communication, confidentialite}
-- ════════════════════════════════════════════════════════════════
insert into public.reviews (
  id, booking_id, author_id, target_type, pool_id, target_user_id,
  rating, categories, comment, reply, created_at
) values
  -- Pool review · Amine → 0001
  ('33333333-3333-3333-3333-333333330001',
   '22222222-2222-2222-2222-222222220001',
   (select id from auth.users where email = 'masbah.seed.amine.2026@gmail.com'),
   'pool', '11111111-1111-1111-1111-111111110001', null,
   5, '{"proprete":5,"conformite":5,"communication":5,"confidentialite":4}'::jsonb,
   'Superbe villa, piscine impeccable et accueil au top. On reviendra sans hésiter !',
   'Merci Amine, au plaisir de vous revoir !', (current_date - 13)::timestamptz),
  -- Pool review · Fatima → 0002
  ('33333333-3333-3333-3333-333333330002',
   '22222222-2222-2222-2222-222222220002',
   (select id from auth.users where email = 'masbah.seed.fatima.2026@gmail.com'),
   'pool', '11111111-1111-1111-1111-111111110002', null,
   4, '{"proprete":4,"conformite":4,"communication":5,"confidentialite":5}'::jsonb,
   'Endroit très calme et privé, parfait pour notre fête. Eau un peu fraîche mais rien de grave.',
   null, (current_date - 9)::timestamptz),
  -- Pool review · Omar → 0004
  ('33333333-3333-3333-3333-333333330003',
   '22222222-2222-2222-2222-222222220003',
   (select id from auth.users where email = 'masbah.seed.omar.2026@gmail.com'),
   'pool', '11111111-1111-1111-1111-111111110004', null,
   5, '{"proprete":5,"conformite":5,"communication":4,"confidentialite":4}'::jsonb,
   'Grande piscine idéale pour les enfants, beaucoup d''espace. Propriétaire discret et serviable.',
   'Merci beaucoup Omar !', (current_date - 6)::timestamptz),
  -- Pool review · Amine → 0005
  ('33333333-3333-3333-3333-333333330004',
   '22222222-2222-2222-2222-222222220004',
   (select id from auth.users where email = 'masbah.seed.amine.2026@gmail.com'),
   'pool', '11111111-1111-1111-1111-111111110005', null,
   4, '{"proprete":5,"conformite":4,"communication":4,"confidentialite":5}'::jsonb,
   'Piscine couverte très agréable, eau bien chauffée. Parfait pour une baignade tranquille.',
   null, (current_date - 4)::timestamptz),
  -- Renter review · Salma → Amine (from B1)
  ('33333333-3333-3333-3333-333333330005',
   '22222222-2222-2222-2222-222222220001',
   (select id from auth.users where email = 'masbah.seed.salma.2026@gmail.com'),
   'renter', null,
   (select id from auth.users where email = 'masbah.seed.amine.2026@gmail.com'),
   5, '{"proprete":5,"conformite":5,"communication":5,"confidentialite":5}'::jsonb,
   'Locataire idéal : ponctuel, respectueux des lieux et très sympathique. Bienvenu quand il veut.',
   null, (current_date - 12)::timestamptz),
  -- Renter review · Youssef → Omar (from B3)
  ('33333333-3333-3333-3333-333333330006',
   '22222222-2222-2222-2222-222222220003',
   (select id from auth.users where email = 'masbah.seed.youssef.2026@gmail.com'),
   'renter', null,
   (select id from auth.users where email = 'masbah.seed.omar.2026@gmail.com'),
   5, '{"proprete":5,"conformite":5,"communication":5,"confidentialite":5}'::jsonb,
   'Groupe calme et soigneux, tout était nickel au départ. Je recommande !',
   null, (current_date - 5)::timestamptz)
on conflict (booking_id, target_type) do nothing;

-- ── Favorites (a couple, so the favorites UI has data) ──────────────
insert into public.favorites (renter_id, pool_id) values
  ((select id from auth.users where email = 'masbah.seed.amine.2026@gmail.com'),  '11111111-1111-1111-1111-111111110006'),
  ((select id from auth.users where email = 'masbah.seed.fatima.2026@gmail.com'), '11111111-1111-1111-1111-111111110001'),
  ((select id from auth.users where email = 'masbah.seed.omar.2026@gmail.com'),   '11111111-1111-1111-1111-111111110004')
on conflict (renter_id, pool_id) do nothing;

commit;
