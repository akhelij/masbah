-- ════════════════════════════════════════════════════════════════
-- Pissina V2 — 0002 · cities (public read) + seed of ~40 cities
-- ════════════════════════════════════════════════════════════════
create table public.cities (
  id uuid primary key default gen_random_uuid(),
  name_fr text not null,
  name_ar text not null,
  slug text unique not null,
  region text,
  lat numeric,
  lng numeric,
  is_active boolean not null default true
);
alter table public.cities enable row level security;

create policy "cities_select_public" on public.cities
  for select to anon, authenticated using (is_active);

insert into public.cities (name_fr, name_ar, slug, region, lat, lng) values
  ('Casablanca', 'الدار البيضاء', 'casablanca', 'Casablanca-Settat', 33.5992, -7.6200),
  ('Dar Bouazza', 'دار بوعزة', 'dar-bouazza', 'Casablanca-Settat', 33.5300, -7.8300),
  ('Bouskoura', 'بوسكورة', 'bouskoura', 'Casablanca-Settat', 33.4500, -7.6500),
  ('Mohammedia', 'المحمدية', 'mohammedia', 'Casablanca-Settat', 33.6861, -7.3829),
  ('Nouaceur', 'النواصر', 'nouaceur', 'Casablanca-Settat', 33.3700, -7.5800),
  ('Had Soualem', 'حد السوالم', 'had-soualem', 'Casablanca-Settat', 33.4200, -7.8500),
  ('Berrechid', 'برشيد', 'berrechid', 'Casablanca-Settat', 33.2655, -7.5870),
  ('Settat', 'سطات', 'settat', 'Casablanca-Settat', 33.0010, -7.6166),
  ('El Jadida', 'الجديدة', 'el-jadida', 'Casablanca-Settat', 33.2316, -8.5007),
  ('Benslimane', 'بن سليمان', 'benslimane', 'Casablanca-Settat', 33.6128, -7.1208),
  ('Bouznika', 'بوزنيقة', 'bouznika', 'Casablanca-Settat', 33.7892, -7.1591),
  ('Rabat', 'الرباط', 'rabat', 'Rabat-Salé-Kénitra', 34.0253, -6.8361),
  ('Salé', 'سلا', 'sale', 'Rabat-Salé-Kénitra', 34.0500, -6.8167),
  ('Témara', 'تمارة', 'temara', 'Rabat-Salé-Kénitra', 33.9287, -6.9067),
  ('Skhirat', 'الصخيرات', 'skhirat', 'Rabat-Salé-Kénitra', 33.8500, -7.0300),
  ('Kénitra', 'القنيطرة', 'kenitra', 'Rabat-Salé-Kénitra', 34.2500, -6.5833),
  ('Khémisset', 'الخميسات', 'khemisset', 'Rabat-Salé-Kénitra', 33.8242, -6.0658),
  ('Marrakech', 'مراكش', 'marrakech', 'Marrakech-Safi', 31.6295, -7.9811),
  ('Essaouira', 'الصويرة', 'essaouira', 'Marrakech-Safi', 31.5085, -9.7595),
  ('Safi', 'آسفي', 'safi', 'Marrakech-Safi', 32.2994, -9.2372),
  ('Tanger', 'طنجة', 'tanger', 'Tanger-Tétouan-Al Hoceïma', 35.7767, -5.8039),
  ('Tétouan', 'تطوان', 'tetouan', 'Tanger-Tétouan-Al Hoceïma', 35.5667, -5.3667),
  ('Larache', 'العرائش', 'larache', 'Tanger-Tétouan-Al Hoceïma', 35.1932, -6.1557),
  ('Al Hoceïma', 'الحسيمة', 'al-hoceima', 'Tanger-Tétouan-Al Hoceïma', 35.2517, -3.9372),
  ('Fès', 'فاس', 'fes', 'Fès-Meknès', 34.0433, -5.0033),
  ('Meknès', 'مكناس', 'meknes', 'Fès-Meknès', 33.8833, -5.5500),
  ('Taza', 'تازة', 'taza', 'Fès-Meknès', 34.2100, -4.0100),
  ('Ifrane', 'إفران', 'ifrane', 'Fès-Meknès', 33.5228, -5.1106),
  ('Agadir', 'أكادير', 'agadir', 'Souss-Massa', 30.4167, -9.5833),
  ('Taroudant', 'تارودانت', 'taroudant', 'Souss-Massa', 30.4703, -8.8766),
  ('Tiznit', 'تزنيت', 'tiznit', 'Souss-Massa', 29.6974, -9.7316),
  ('Oujda', 'وجدة', 'oujda', 'Oriental', 34.6900, -1.9100),
  ('Nador', 'الناظور', 'nador', 'Oriental', 35.1681, -2.9335),
  ('Beni Mellal', 'بني ملال', 'beni-mellal', 'Béni Mellal-Khénifra', 32.3373, -6.3498),
  ('Khouribga', 'خريبكة', 'khouribga', 'Béni Mellal-Khénifra', 32.8811, -6.9063),
  ('Ouarzazate', 'ورزازات', 'ouarzazate', 'Drâa-Tafilalet', 30.9189, -6.8934),
  ('Errachidia', 'الرشيدية', 'errachidia', 'Drâa-Tafilalet', 31.9314, -4.4244),
  ('Guelmim', 'كلميم', 'guelmim', 'Guelmim-Oued Noun', 28.9870, -10.0574),
  ('Dakhla', 'الداخلة', 'dakhla', 'Dakhla-Oued Ed-Dahab', 23.6848, -15.9580),
  ('Laâyoune', 'العيون', 'laayoune', 'Laâyoune-Sakia El Hamra', 27.1536, -13.2033);
