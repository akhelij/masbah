-- ════════════════════════════════════════════════════════════════
-- Masbah V2 — 0009 · pre-booking direct contact for opt-in listings
-- Owners who enable `direct_contact_enabled` accept being reached before a
-- booking (the Moroccan norm). Their phone is still never in a public view —
-- it is revealed only to a SIGNED-IN user, only for published opt-in pools.
-- ════════════════════════════════════════════════════════════════
create or replace function public.get_pool_contact_direct(p_pool_id uuid)
returns table (owner_phone text, owner_name text)
language plpgsql security definer stable set search_path = public as $$
begin
  if not exists (
    select 1 from public.pools p
    where p.id = p_pool_id
      and p.status = 'published'
      and p.direct_contact_enabled = true
  ) then
    raise exception 'Direct contact is not available for this listing';
  end if;
  return query
    select pr.phone, pr.full_name
    from public.pools p
    join public.profiles pr on pr.id = p.owner_id
    where p.id = p_pool_id;
end;
$$;

revoke execute on function public.get_pool_contact_direct(uuid) from public, anon;
grant execute on function public.get_pool_contact_direct(uuid) to authenticated;
