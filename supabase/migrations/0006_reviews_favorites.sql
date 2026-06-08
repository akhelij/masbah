-- ════════════════════════════════════════════════════════════════
-- Pissina V2 — 0006 · reviews (two-way, gated), favorites, rating view
-- Reviews are public-read; writes go through create_review/reply_to_review
-- which enforce: accepted booking AND visit date passed AND correct author.
-- ════════════════════════════════════════════════════════════════
create table public.reviews (
  id uuid primary key default gen_random_uuid(),
  booking_id uuid not null references public.booking_requests (id) on delete cascade,
  author_id uuid not null references public.profiles (id) on delete cascade,
  target_type public.review_target not null,
  pool_id uuid references public.pools (id) on delete cascade,
  target_user_id uuid references public.profiles (id) on delete cascade,
  rating int not null check (rating between 1 and 5),
  categories jsonb not null default '{}'::jsonb,
  comment text,
  reply text,
  created_at timestamptz not null default now(),
  unique (booking_id, target_type)
);
create index reviews_pool_idx on public.reviews (pool_id);
create index reviews_target_user_idx on public.reviews (target_user_id);

alter table public.reviews enable row level security;
create policy "reviews_select_public" on public.reviews for select to anon, authenticated using (true);
-- Writes only via the gated functions below (no direct insert/update policy).

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
    insert into public.notifications (user_id, type, payload)
    values (v_b.pool_owner, 'new_review', jsonb_build_object('review_id', v_review_id, 'booking_id', p_booking_id, 'target_type', 'pool'));
  else
    if auth.uid() <> v_b.pool_owner then raise exception 'Only the owner can review the renter'; end if;
    insert into public.reviews (booking_id, author_id, target_type, target_user_id, rating, categories, comment)
    values (p_booking_id, auth.uid(), 'renter', v_b.renter_id, p_rating, p_categories, p_comment)
    returning id into v_review_id;
    insert into public.notifications (user_id, type, payload)
    values (v_b.renter_id, 'new_review', jsonb_build_object('review_id', v_review_id, 'booking_id', p_booking_id, 'target_type', 'renter'));
  end if;
  return v_review_id;
end;
$$;

create or replace function public.reply_to_review(p_review_id uuid, p_reply text)
returns void language plpgsql security definer set search_path = public as $$
declare v_r record;
begin
  select r.target_type, p.owner_id as pool_owner
    into v_r
  from public.reviews r left join public.pools p on p.id = r.pool_id
  where r.id = p_review_id;
  if v_r is null then raise exception 'Review not found'; end if;
  if v_r.target_type <> 'pool' or auth.uid() <> v_r.pool_owner then
    raise exception 'Only the pool owner can reply';
  end if;
  update public.reviews set reply = p_reply where id = p_review_id;
end;
$$;

-- Aggregate rating per pool (public).
create view public.pool_ratings as
select pool_id,
       round(avg(rating)::numeric, 2) as avg_rating,
       count(*)::int as review_count
from public.reviews
where target_type = 'pool' and pool_id is not null
group by pool_id;
grant select on public.pool_ratings to anon, authenticated;

-- ── favorites ─────────────────────────────────────────────────────
create table public.favorites (
  renter_id uuid not null references public.profiles (id) on delete cascade,
  pool_id uuid not null references public.pools (id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (renter_id, pool_id)
);
alter table public.favorites enable row level security;
create policy "favorites_all_own" on public.favorites for all to authenticated
  using (renter_id = auth.uid()) with check (renter_id = auth.uid());
