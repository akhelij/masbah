-- ════════════════════════════════════════════════════════════════
-- Masbah V2 — 0018 · transactional booking emails (UX2)
--
-- In-app notifications only reach users while they're in the app; if a renter
-- closes the tab after "Demande envoyée", they learn nothing until they come
-- back. This emails the THREE booking events (new_request, request_accepted,
-- request_declined) via Resend, straight from the database:
--
--   notifications INSERT ─trigger→ send_notification_email() ─pg_net→ Resend
--
-- Design notes:
--  • Piggybacks on `notifications` inserts, so emails automatically respect
--    profiles.notif_prefs (0016 already gates those inserts) — no double
--    preference logic.
--  • The Resend API key + from-address live in Supabase VAULT (encrypted),
--    inserted at runtime — NEVER in this repo. If the vault secret is absent
--    the trigger no-ops, so environments without a key stay functional.
--  • net.http_post is async (queued) — it cannot slow down or roll back
--    accept_booking; delivery results are observable in net._http_response.
--  • The EXCEPTION guard means a malformed payload can never break the
--    booking transaction itself (the in-app notification still lands).
--  • FR/AR body per profiles.preferred_lang. From defaults to Resend's
--    sandbox sender; switch the 'resend_from' vault secret to
--    "Masbah <notifications@masbah.ma>" once the domain is verified.
-- ════════════════════════════════════════════════════════════════
create extension if not exists pg_net;

create or replace function public.send_notification_email()
returns trigger language plpgsql security definer set search_path = public as $$
declare
  v_key text; v_from text; v_email text; v_name text; v_lang text;
  v_pool_title text; v_date text; v_subject text; v_body text;
  v_link text; v_cta text; v_intro text;
  v_site text := 'https://masbah.ma';
begin
  if new.type not in ('new_request', 'request_accepted', 'request_declined') then
    return new;
  end if;

  select decrypted_secret into v_key from vault.decrypted_secrets where name = 'resend_api_key';
  if v_key is null or v_key = '' then return new; end if;
  select decrypted_secret into v_from from vault.decrypted_secrets where name = 'resend_from';
  if v_from is null or v_from = '' then v_from := 'Masbah <onboarding@resend.dev>'; end if;

  select u.email into v_email from auth.users u where u.id = new.user_id;
  if v_email is null then return new; end if;

  select p.full_name, coalesce(p.preferred_lang, 'fr')
    into v_name, v_lang
  from public.profiles p where p.id = new.user_id;
  v_name := coalesce(nullif(trim(v_name), ''), '');

  if new.payload ? 'pool_id' then
    select title into v_pool_title from public.pools where id = (new.payload->>'pool_id')::uuid;
  end if;
  v_date := coalesce(new.payload->>'date', '');

  if v_lang = 'ar' then
    v_pool_title := coalesce(v_pool_title, 'مسبحكم');
    case new.type
      when 'new_request' then
        v_subject := 'طلب حجز جديد — ' || v_pool_title;
        v_intro := 'لديك طلب حجز جديد لـ « ' || v_pool_title || ' »' || case when v_date <> '' then ' ليوم ' || v_date else '' end || '. لديك 24 ساعة للرد قبل انتهاء الطلب.';
        v_link := v_site || '/ar/demandes'; v_cta := 'عرض الطلب';
      when 'request_accepted' then
        v_subject := 'تم قبول طلبك 🎉 — ' || v_pool_title;
        v_intro := 'قَبِل المضيف طلبك لـ « ' || v_pool_title || ' »' || case when v_date <> '' then ' ليوم ' || v_date else '' end || '. أصبح بإمكانك الاطلاع على العنوان الدقيق ورقم الهاتف.';
        v_link := v_site || '/ar/bookings'; v_cta := 'عرض حجزي';
      else
        v_subject := 'بخصوص طلب الحجز — ' || v_pool_title;
        v_intro := 'تعذّر قبول طلبك لـ « ' || v_pool_title || ' »' || case when v_date <> '' then ' ليوم ' || v_date else '' end || '. يمكنك اختيار تاريخ آخر أو مسبحًا آخر.';
        v_link := v_site || '/ar/search'; v_cta := 'البحث عن مسبح';
    end case;
    v_body := '<div dir="rtl" style="font-family:sans-serif;max-width:520px;margin:0 auto;color:#1f2933">'
      || '<h2 style="color:#0e7490">مسبح</h2>'
      || '<p>مرحبًا ' || v_name || '،</p><p>' || v_intro || '</p>'
      || '<p><a href="' || v_link || '" style="display:inline-block;background:#0e7490;color:#fff;padding:10px 18px;border-radius:10px;text-decoration:none">' || v_cta || '</a></p>'
      || '<p style="color:#6b7280;font-size:13px">💵 الدفع نقدًا عند الوصول — لا دفع عبر الإنترنت.</p></div>';
  else
    v_pool_title := coalesce(v_pool_title, 'votre piscine');
    case new.type
      when 'new_request' then
        v_subject := 'Nouvelle demande de réservation — ' || v_pool_title;
        v_intro := 'Vous avez reçu une nouvelle demande pour « ' || v_pool_title || ' »' || case when v_date <> '' then ' le ' || v_date else '' end || '. Vous avez 24 h pour répondre avant son expiration.';
        v_link := v_site || '/fr/demandes'; v_cta := 'Voir la demande';
      when 'request_accepted' then
        v_subject := 'Demande acceptée 🎉 — ' || v_pool_title;
        v_intro := 'L''hôte a accepté votre demande pour « ' || v_pool_title || ' »' || case when v_date <> '' then ' le ' || v_date else '' end || '. L''adresse exacte et le téléphone sont maintenant débloqués.';
        v_link := v_site || '/fr/bookings'; v_cta := 'Voir ma réservation';
      else
        v_subject := 'Réponse à votre demande — ' || v_pool_title;
        v_intro := 'Votre demande pour « ' || v_pool_title || ' »' || case when v_date <> '' then ' le ' || v_date else '' end || ' n''a pas pu être acceptée. Essayez une autre date ou une autre piscine.';
        v_link := v_site || '/fr/search'; v_cta := 'Chercher une piscine';
    end case;
    v_body := '<div style="font-family:sans-serif;max-width:520px;margin:0 auto;color:#1f2933">'
      || '<h2 style="color:#0e7490">masbah</h2>'
      || '<p>Bonjour ' || v_name || ',</p><p>' || v_intro || '</p>'
      || '<p><a href="' || v_link || '" style="display:inline-block;background:#0e7490;color:#fff;padding:10px 18px;border-radius:10px;text-decoration:none">' || v_cta || '</a></p>'
      || '<p style="color:#6b7280;font-size:13px">💵 Paiement en espèces sur place — aucun paiement en ligne.</p></div>';
  end if;

  perform net.http_post(
    url := 'https://api.resend.com/emails',
    headers := jsonb_build_object(
      'Authorization', 'Bearer ' || v_key,
      'Content-Type', 'application/json'
    ),
    body := jsonb_build_object(
      'from', v_from,
      'to', jsonb_build_array(v_email),
      'subject', v_subject,
      'html', v_body
    )
  );
  return new;
exception when others then
  -- Email must never break the booking transaction; the in-app notification
  -- already landed and delivery issues are visible in net._http_response.
  return new;
end;
$$;

revoke execute on function public.send_notification_email() from public, anon, authenticated;

create trigger notifications_email
  after insert on public.notifications
  for each row execute function public.send_notification_email();
