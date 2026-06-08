# Pissina V2 — Full Rebuild Prompt (Nuxt 3 + Supabase)

How to use:
1. Put the approved HTML designs in a `design/` folder at the repo root (e.g. `design/S1-design-system.html` … `design/S14-states.html`). The agent will treat them as the visual source of truth.
2. Create a Supabase project (or let the agent do it via the Supabase MCP/CLI if connected).
3. Open Claude Code in this repo and paste the ENTIRE prompt below.
4. The agent works milestone by milestone and STOPS after each one for your review. Review, test, then say "continue to M2", etc.

---

## THE PROMPT (paste everything below into Claude Code)

```
You are rebuilding Pissina from scratch in this repository. Pissina is Morocco's
peer-to-peer swimming pool rental marketplace (think Swimmy.fr adapted to Morocco).
The repo currently contains the old V1 (Vue 3 + Firebase + Vuex from 2022). You will
archive it, wipe it, and build V2 with Nuxt 3 + Supabase, following the HTML designs
in `design/` as the visual source of truth.

Work in the milestones defined at the end. After completing each milestone, STOP,
summarize what was built and how to test it, and wait for my approval.

═══════════════════════════════════════
1. PRODUCT SPEC (the contract — never deviate)
═══════════════════════════════════════
- Renters browse pools by city, view details, and send BOOKING REQUESTS for a date +
  time slot (Matinée 9h–14h / Après-midi 15h–20h / Soirée 20h–00h / Journée 9h–20h).
  Each listing enables its own slots with a price per slot in MAD (DH).
- NO online payment. Cash on arrival. Every booking surface displays
  "💵 Paiement sur place" clearly.
- Owners accept or decline each request (with optional reason). On acceptance, the
  renter unlocks the owner's phone/WhatsApp and the exact address. Before acceptance,
  only the approximate location (neighborhood + ~1km map circle) is visible.
- Direct contact culture: owner phone/WhatsApp CTAs are first-class on the listing
  page for owners who opt in to "contact direct avant réservation" (boolean per
  listing, default ON — this mirrors how the Moroccan market works).
- Two-way reviews after the visit date passes on accepted bookings: renter reviews
  pool (overall + Propreté, Conformité aux photos, Communication, Confidentialité),
  owner reviews renter (overall + respect des lieux, ponctualité).
- Trust signals everywhere: phone-verified badge, "Membre depuis", response rate,
  review count, "À l'abri des regards" privacy badge (major Moroccan use case).
- Booking request lifecycle: pending → accepted | declined | expired (24h without
  owner answer) | cancelled_by_renter. Slot conflicts: accepting a request
  auto-declines other pending requests for the same listing+date+overlapping slot.
- Languages: French (default) + Arabic with full RTL. Currency MAD displayed as
  "350 DH" / "350 درهم".

═══════════════════════════════════════
2. PHASE 0 — ARCHIVE V1, THEN WIPE (do this first, carefully)
═══════════════════════════════════════
1. Verify clean git status. If uncommitted changes exist, commit them as
   "chore: final v1 state".
2. git tag v1-final && git branch legacy-v1  (then push tag + branch if a remote
   exists; if no remote, just create them locally and tell me).
3. On main: delete ALL files and folders EXCEPT: .git/, design/, PISSINA_V2_*.md,
   and .idea/ if present.
4. Commit: "chore!: remove v1, start v2 rebuild (v1 preserved in legacy-v1)".
5. Confirm to me that legacy-v1 contains the full old project before proceeding.

═══════════════════════════════════════
3. PHASE 1 — SCAFFOLD
═══════════════════════════════════════
- Latest stable Nuxt 3.x/4.x, TypeScript strict, pnpm.
- Modules: @nuxtjs/supabase, @nuxtjs/i18n, @nuxtjs/tailwindcss, @nuxt/image,
  @vueuse/nuxt, @pinia/nuxt (client-only UI state: filters, wizard draft),
  @vite-pwa/nuxt.
- Rendering: SSR enabled. Public pages (home, search, listing detail, how-it-works)
  must be server-rendered for SEO. Dashboard/profile pages can be client-only.
- ESLint + Prettier matching: singleQuote, no semi-colons debate — use the repo's
  old .prettierrc.js settings as base. Husky + lint-staged pre-commit.
- Folder conventions: components/ui/* (design-system primitives), components/pool/*,
  components/booking/*, composables/*, server/api/* (only where Supabase RLS isn't
  enough), types/database.types.ts generated from Supabase.
- .env.example with SUPABASE_URL, SUPABASE_KEY (anon), and documented secrets.

═══════════════════════════════════════
4. PHASE 2 — SUPABASE SCHEMA (write real SQL migrations)
═══════════════════════════════════════
Create migrations (supabase/migrations/) implementing exactly:

profiles (extends auth.users via trigger on signup)
  id uuid PK → auth.users, full_name, avatar_url, phone text, phone_verified bool
  default false, preferred_lang text default 'fr', bio, created_at. Public read of
  safe fields only (name, avatar, created_at, phone_verified) via a view or column
  RLS discipline; phone NEVER publicly readable.

cities (seeded)
  id, name_fr, name_ar, slug, region, lat, lng, is_active. Seed the ~40 main
  Moroccan cities (port the list from legacy-v1 src/assets/js/cities.js, add name_ar).

pools
  id uuid PK, owner_id → profiles, title, description, type enum(villa,riad,farm,
  apartment,other), city_id → cities, neighborhood text, address text (PRIVATE),
  lat/lng (PRIVATE), approx_lat/approx_lng (public, jittered ~500m), max_guests int,
  length_m/width_m/depth_min/depth_max numeric null, heated bool, covered bool,
  child_safe bool, sheltered_from_view bool, owner_present bool,
  direct_contact_enabled bool default true, rules jsonb (kids_allowed, music_allowed,
  events_allowed, pets_allowed, quiet_hours), amenities jsonb [{key, label_fr,
  label_ar, included bool, price int null, per_person bool}], status enum(draft,
  published,paused,banned) default draft, completion_score int, created_at,
  updated_at. RLS: public can SELECT published only and NEVER address/lat/lng
  columns (expose a public view `pools_public` excluding private columns); owner
  full CRUD on own rows.

pool_photos
  id, pool_id, storage_path, position int, is_cover bool. Supabase Storage bucket
  `pool-photos` (public read, owner-scoped write, 5MB limit, webp conversion on
  upload via client).

pool_slots
  id, pool_id, slot enum(morning,afternoon,evening,full_day), price_mad int,
  enabled bool, weekend_premium_pct int default 0. Unique(pool_id, slot).

blocked_dates
  id, pool_id, date, slot null (null = whole day), reason. Owner CRUD.

booking_requests
  id, pool_id, renter_id, date, slot, guests int, extras jsonb (selected amenity
  keys), message text, total_estimate_mad int, status enum(pending,accepted,declined,
  expired,cancelled_by_renter) default pending, decline_reason text null,
  responded_at, expires_at timestamptz default now()+interval '24 hours', created_at.
  Constraints: date >= today; guests <= pool.max_guests (validate in a DB function);
  no duplicate pending request per (renter, pool, date, slot).
  RLS: renter sees own; owner sees requests on own pools; nobody else.
  Postgres function accept_booking(request_id): in one transaction set accepted +
  auto-decline conflicting pending requests (same pool+date, same slot or full_day
  overlap) + insert notifications. Edge function or pg_cron for expiry.

reviews
  id, booking_id unique per direction, author_id, target_type enum(pool,renter),
  pool_id null, target_user_id null, rating int 1–5, categories jsonb, comment,
  reply text null (owner reply), created_at. Only allowed if booking accepted AND
  date passed. Public read.

favorites (renter_id, pool_id, PK both).

notifications
  id, user_id, type enum(new_request,request_accepted,request_declined,
  request_expired,visit_reminder,new_review,system), payload jsonb, read_at,
  created_at. Realtime enabled so the UI badge updates live.

Also: updated_at triggers, indexes on (pools.city_id, status), booking_requests
(pool_id, date), and database.types.ts generation. RLS ON for every table — deny by
default. If the Supabase MCP or CLI is available, apply migrations; otherwise output
them and tell me how to apply.

═══════════════════════════════════════
5. PHASE 3 — DESIGN SYSTEM FROM HTML
═══════════════════════════════════════
- Read every file in design/. Extract tokens from S1 (colors, radii, type scale,
  spacing) into tailwind.config + CSS custom properties. Fonts: Plus Jakarta Sans +
  IBM Plex Sans Arabic via @nuxt/fonts or local.
- Build components/ui/* primitives matching S1 1:1: PButton (primary/secondary/
  ghost/whatsapp/destructive), PInput, PSelect, PCounter, PChip, PBadge, PToggle,
  PModal/PSheet (bottom-sheet on mobile), PSkeleton, PRating, PSlotPicker,
  PDatePicker (availability-aware), PoolCard (+skeleton), PTabBar, PHeader.
- Visual fidelity rule: when in doubt, the design/ HTML wins over your taste.
  Reuse its exact hex values, radii and spacing.

═══════════════════════════════════════
6. CROSS-CUTTING REQUIREMENTS (apply to every milestone)
═══════════════════════════════════════
i18n/RTL
- @nuxtjs/i18n, strategy prefix ('/fr/...', '/ar/...'), default fr, lazy-loaded
  locale files (fr.json, ar.json). dir="rtl" on html for ar; use Tailwind logical
  utilities (ps-*/pe-*, start-*/end-*) everywhere — NEVER pl/pr/left/right.
  Directional icons flip via rtl: variants. Every user-facing string goes through
  i18n from day one — no hardcoded copy.

SEO (a marketplace lives on this)
- SSR meta per page (useSeoMeta), hreflang fr/ar alternates, canonical URLs.
- Listing pages: schema.org Product/LocalBusiness JSON-LD (name, image, price range,
  aggregateRating). City landing pages /fr/piscines/casablanca etc., statically
  crawlable. Dynamic sitemap.xml (published pools + cities), robots.txt.
- OG/Twitter cards with the pool cover photo.

Security
- RLS deny-by-default; private columns (address, exact lat/lng, phone) only exposed
  post-acceptance through a dedicated RPC/view, never shipped to the client
  otherwise. Validate everything server-side (DB constraints + functions); client
  validation is UX only. Rate-limit booking request creation (max 5 pending per
  renter). Sanitize all user text rendering.

Accessibility & quality
- WCAG AA, 44px targets, focus-visible, alt text, label-for on every input,
  prefers-reduced-motion respected. Lighthouse: Perf ≥ 85 mobile, SEO ≥ 95,
  A11y ≥ 95 on home + listing detail.

Conventions
- Vue 3 Composition API <script setup lang="ts"> only. Conventional commits.
  NEVER add an AI/Anthropic co-author line to commits. Small commits per feature.

═══════════════════════════════════════
7. MILESTONES (stop after each one)
═══════════════════════════════════════
M1 — Foundation
  Phases 0–3 + app shell: PHeader, PTabBar (mobile bottom nav), footer, layouts
  (default/dashboard), i18n wired with FR+AR and language switcher, fonts, PWA
  manifest + icons (reuse brand), Sentry, error page.
  DoD: pnpm dev runs; / renders in fr and ar (RTL correct); design tokens visible
  in a /dev/ui playground page listing all primitives; lint+typecheck pass in CI.

M2 — Auth & profiles
  Supabase auth: Google + email/password + password reset; profile auto-creation
  trigger; onboarding (name, avatar, lang); phone verification UI (E.164 +212,
  6-digit OTP screen) behind a feature flag — wire Supabase phone provider config
  but mock the SMS in dev; auth-gated middleware; contextual auth sheet (triggered
  by booking/favorite/publish actions per S9).
  DoD: full signup/login/logout/reset E2E test green; profile row created on
  signup; gated routes redirect correctly.

M3 — Listings: browse & detail (SEO core)
  Home (S2), search results + filters + sort + map toggle (S3), listing detail (S4)
  with gallery, owner card (call/WhatsApp when direct_contact_enabled), amenities/
  extras with prices, rules, availability calendar fed by pool_slots + blocked_dates
  + accepted bookings, reviews section (placeholder until M6), approximate map
  circle. City landing pages + sitemap + JSON-LD. Skeletons + empty states (S14).
  DoD: SSR verified (view-source shows content), Lighthouse SEO ≥ 95, filters
  drive URL query params (shareable), E2E: search Casablanca → open a listing.

M4 — Owner: listing wizard & management
  Wizard S8 (8 steps, autosave draft to Supabase, photo upload to Storage with
  reorder + cover, per-slot pricing, completion score), my-listings management
  (publish/pause/edit/delete) per S7 "Mes annonces" tab.
  DoD: E2E: create listing draft → publish → visible in search; RLS verified by
  test (user B cannot edit user A's pool).

M5 — Booking requests end-to-end (the heart)
  Booking flow S5 (3 steps + success), renter bookings S6, owner requests inbox S7
  with accept/decline(+reason), accept_booking() conflict auto-decline, 24h expiry
  job, contact + exact address reveal post-acceptance, in-app notifications
  (realtime badge) S12.
  DoD: E2E multi-actor test: renter requests → owner accepts → conflicting pending
  request auto-declined → renter sees phone + address; expiry tested with mocked
  clock; "Paiement sur place" visible at every booking step.

M6 — Reviews & public profiles
  Post-visit review flows both directions (S11), category ratings, owner reply,
  aggregate ratings on listing + profile (S10), review gating (accepted + date
  passed only).
  DoD: E2E: completed booking → both reviews → averages update; gating tested.

M7 — Polish & launch readiness
  PWA offline state + install banner, full S14 states audit on every page,
  favorites, notification preferences, privacy/terms pages (port content from
  legacy-v1), analytics (Plausible or GA4 — ask me), final Lighthouse pass,
  production deploy config.
  DoD: all E2E suites green in CI; Lighthouse budgets met; deploy preview live.

═══════════════════════════════════════
8. TESTING & CI
═══════════════════════════════════════
- Cypress for E2E (I know it well — not Playwright): one spec per critical flow
  listed in the DoDs, run against a local Supabase (supabase start) with seeded
  fixtures (2 owners, 3 renters, 6 pools across 3 cities, bookings in all states).
- Vitest for composables/utils (price calculation with extras + weekend premium,
  slot conflict logic, completion score).
- GitHub Actions: .github/workflows/ci.yml — pnpm install (cached), lint,
  typecheck, vitest, Cypress E2E with supabase local, build. On main: deploy to
  Vercel (or output the config if no token). PR previews.
- Seed script: pnpm db:seed for local dev with realistic Moroccan data (real city
  names, plausible DH prices, FR descriptions).

═══════════════════════════════════════
9. WORKING RULES
═══════════════════════════════════════
- After each milestone: STOP. Give me a summary, how to test manually, and any
  decisions you made that deviated from this prompt (with why).
- Ask me before: adding paid services, changing the schema after M2, adding any
  dependency > 100kb client-side.
- If a design/ file is missing for a screen, build from the spec in this prompt
  and flag it — don't invent a different layout.
- If Supabase MCP tools are available in your session, use them for migrations,
  type generation and seeding; otherwise use the supabase CLI.
- Never commit secrets. Never weaken an RLS policy to "make it work".
```

---

## After M7 (not in the prompt, for you)

- Real SMS OTP: evaluate WhatsApp OTP / local SMS gateways for Morocco vs Twilio pricing before flipping the phone-verification flag.
- Hook the concierge-MVP learnings (pricing, decline reasons, FAQ) back into copy and defaults before public launch.
- Point pissina.com DNS at the Vercel deployment; keep legacy-v1 branch as the archive.

