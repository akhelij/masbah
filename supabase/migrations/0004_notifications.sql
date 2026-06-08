-- ════════════════════════════════════════════════════════════════
-- Pissina V2 — 0004 · notifications (realtime, own-row read)
-- Rows are written ONLY by SECURITY DEFINER functions (accept/decline/
-- cancel/expire/review) — clients cannot forge notifications.
-- ════════════════════════════════════════════════════════════════
create table public.notifications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (id) on delete cascade,
  type public.notification_type not null,
  payload jsonb not null default '{}'::jsonb,
  read_at timestamptz,
  created_at timestamptz not null default now()
);
create index notifications_user_idx on public.notifications (user_id, created_at desc);

alter table public.notifications enable row level security;
create policy "notifications_select_own" on public.notifications for select to authenticated
  using (user_id = auth.uid());
create policy "notifications_update_own" on public.notifications for update to authenticated
  using (user_id = auth.uid()) with check (user_id = auth.uid());
-- No INSERT/DELETE policy: only SECURITY DEFINER functions write here.

-- Live badge updates in the UI.
alter publication supabase_realtime add table public.notifications;
