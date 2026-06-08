# Pissina V2 — UI/UX Generation Prompts for Claude

How to use:
1. Open a fresh Claude conversation (claude.ai with artifacts enabled, or Claude Code).
2. Paste **Prompt 0 (Master)** first. Claude will produce the Design System Sheet.
3. Then paste the per-screen prompts **one at a time in the same conversation** so every screen reuses the same tokens and components.
4. Iterate on each screen before moving to the next ("make the hero shorter", "increase photo size", etc.).
5. For Arabic, use the RTL prompt at the end on any finished screen.

---

## Prompt 0 — MASTER (paste first)

```
You are the lead product designer for Pissina (pissina.com), Morocco's first peer-to-peer
swimming pool rental marketplace. I'm rebuilding it from scratch and you will design the
complete UI/UX, screen by screen. Read everything below carefully — it is the design brief
for the whole project. After reading, your FIRST deliverable is the Design System Sheet
described at the end. Then wait for my per-screen requests.

═══════════════════════════════════════
1. PRODUCT
═══════════════════════════════════════
Pissina lets private pool owners in Morocco rent their pool to families and groups for a
few hours or a day. Think "Airbnb for private pools", adapted to the Moroccan market.

V2 business model — IMPORTANT, it shapes many screens:
- Booking WITHOUT online payment. Renters send a booking request (date + time slot +
  guests); the owner accepts or declines. Payment happens in cash on arrival. Every
  booking surface must set this expectation clearly ("Paiement sur place").
- Direct contact is ESSENTIAL, not a fallback. In Morocco, renters want to call or
  WhatsApp the owner before committing. Phone + WhatsApp CTAs must be first-class
  citizens next to the booking request flow, never hidden behind it.
- Reviews after the visit build the trust layer.

═══════════════════════════════════════
2. USERS
═══════════════════════════════════════
Renters:
- Families with kids (safety info matters: depth, fence, lifebuoy).
- Groups of friends, birthday/event organizers.
- A major segment: women and families seeking PRIVACY — pools shielded from view
  ("à l'abri des regards" / "بعيد عن الأنظار"). Privacy is a first-class filter and badge.
- Mobile-first (most traffic is smartphones), French/Arabic speaking, WhatsApp-centric.

Owners (hosts):
- Villa owners around Casablanca, Marrakech, Rabat, Agadir, Tangier; some semi-pro hosts
  with several pools.
- Their anxieties: strangers in their home, no-shows, damage. The owner-side UX must
  give control (accept/decline each request, house rules, blocked dates) and visibility
  (who is asking, renter profile, past reviews).

═══════════════════════════════════════
3. MOROCCO MARKET RULES (design for these)
═══════════════════════════════════════
- TRUST is the #1 conversion barrier. Surface everywhere: verified phone badge,
  "Identité vérifiée", real-photo emphasis, review count + rating, owner response rate
  and response time, "Membre depuis 2024".
- WhatsApp culture: a green WhatsApp button is as important as any in-app CTA.
- Cash culture: "no online payment" is a FEATURE — say it loudly, it lowers the barrier.
- Seasonality: peak June–September; design supports seasonal campaigns (Aïd, summer).
- Time slots, not nights: typical rentals are Matinée (9h–14h), Après-midi (15h–20h),
  Journée complète (9h–20h), and optionally Soirée. Pricing is per slot.
- Cities: Casablanca, Rabat, Marrakech, Agadir, Tanger, Fès, Bouskoura, Dar Bouazza…
  City search is the primary entry point.

═══════════════════════════════════════
4. BRAND — "FRESH & SUMMERY"
═══════════════════════════════════════
Personality: the feeling of jumping into cool water on a hot day. Fresh, optimistic,
clean, trustworthy. Playful but never childish — real money and real homes are involved.

- Palette: primary turquoise/aqua family (e.g. #06B6D4 → #0E7490 range) for actions and
  identity; deep petrol/ink (#164E63 family) for text and anchors; ONE warm accent
  (coral/sun #FB7185 or amber #F59E0B family) used sparingly for highlights, promos and
  the favorite/heart; sand-white backgrounds (#FAFAF7-ish), white cards.
- Water-inspired gradients (turquoise → soft cyan) for hero sections only.
- Shapes: rounded-2xl cards, pill buttons, soft wave SVG section dividers (subtle).
- Photography-first: big pool photos, golden-hour, real (non-stock-looking). Cards are
  photo-dominant.
- Typography: a geometric humanist sans for Latin (Plus Jakarta Sans or Outfit) paired
  with an Arabic companion (IBM Plex Sans Arabic or Tajawal). Generous sizes, tight
  headings, relaxed body.
- Icons: rounded line icons (Lucide style). Amenities/rules may use tasteful emoji
  (🧺 🚿 🍖) — it's part of Pissina's existing personality; keep it light.
- Motion: gentle water-like easing, skeleton shimmer for loading, no aggressive bounces.

═══════════════════════════════════════
5. LANGUAGES & RTL
═══════════════════════════════════════
- UI ships in French AND Arabic (Darija-friendly Modern Standard Arabic).
- Design with logical properties in mind (start/end, not left/right) so every layout
  mirrors cleanly in RTL. Icons with direction (arrows, chevrons) must flip.
- Language switcher: FR / العربية, visible in header and in profile settings.
- Default copy in deliverables: French, with Arabic provided for key labels/CTAs.
- Numbers: prices as "350 DH" (or "350 درهم" in AR).

═══════════════════════════════════════
6. PLATFORM & LAYOUT SYSTEM
═══════════════════════════════════════
- Mobile-first PWA. Design at 390px first, then adapt to desktop (1280px container).
- Mobile: bottom tab bar with 5 tabs — Explorer, Réservations, Publier (center, raised
  accent button), Messages, Profil.
- Desktop: top header (logo, search, publish CTA, language, avatar), no bottom bar.
- Listing detail uses a sticky bottom action bar on mobile (price + slot + "Réserver" +
  WhatsApp icon button).
- Cards grid: 1 col mobile, 2 tablet, 3–4 desktop.
- Support PWA moments: install banner, offline state.

═══════════════════════════════════════
7. ACCESSIBILITY & QUALITY BAR
═══════════════════════════════════════
- WCAG AA contrast, 44px minimum touch targets, visible focus rings, reduced-motion
  friendly, alt text on photos, form labels always visible (no placeholder-only).
- Every screen must include realistic French content (real Moroccan city names, plausible
  prices in DH, plausible names) — never lorem ipsum.
- Every screen must show its states when relevant: loading (skeleton), empty, error.

═══════════════════════════════════════
8. SCREEN INVENTORY (I will request them one by one)
═══════════════════════════════════════
S1  Design System Sheet (first deliverable, described below)
S2  Home / landing
S3  Search results + filters
S4  Listing detail
S5  Booking request flow
S6  Renter bookings (Mes réservations)
S7  Owner dashboard (requests inbox + calendar + listings)
S8  Create/edit listing wizard
S9  Auth (sign in / sign up / reset / phone verification)
S10 Public profile & settings
S11 Reviews (post-visit flow + display)
S12 Notifications
S13 How it works / trust page
S14 States kit (empty/error/offline/404)

═══════════════════════════════════════
9. OUTPUT FORMAT — READ CAREFULLY
═══════════════════════════════════════
- Each deliverable = ONE self-contained HTML file in an artifact: Tailwind via CDN,
  Google Fonts via CDN, inline SVG for icons/illustrations, CSS custom properties for
  the design tokens, no external JS frameworks. Light JS allowed only to demo
  interactions (tabs, modals, steppers).
- Mobile-first responsive in the same file (the artifact must look right both at 390px
  and at desktop width).
- Use real photos via https://images.unsplash.com pool/villa photos as placeholders.
- Define all design tokens ONCE in the Design System Sheet, then REUSE identical token
  values in every subsequent screen so the system stays consistent.
- At the end of each screen, add a short "Design notes" comment block in the HTML
  explaining key UX decisions (3–5 bullets max).

FIRST DELIVERABLE NOW — S1 Design System Sheet, one artifact containing:
- Color tokens (with hex + usage), typography scale (FR + AR samples), spacing/radius.
- Buttons (primary/secondary/ghost/WhatsApp/destructive; default+hover+disabled).
- Inputs (text, select, counter stepper, date field, search bar), checkbox/toggle/chips.
- Pool card (photo, price/slot, city, rating, privacy badge, favorite heart) +
  its skeleton variant.
- Badges (Vérifié, À l'abri des regards, Superhost-equivalent "Hôte fiable"), rating
  stars, avatar block.
- Slot selector segmented control (Matinée / Après-midi / Journée).
- Bottom tab bar + top header, mobile and desktop.
- A small RTL demo strip showing 2–3 components mirrored with Arabic labels.
```

---

## Per-screen prompts (paste one at a time, in order)

### S2 — Home / Landing

```
Design S2 — Home/landing, reusing the S1 tokens exactly.

Goal: a first-time visitor understands Pissina in 3 seconds and starts a search.

Sections (mobile-first):
1. Header (from S1) + hero: water gradient, headline ("Louez une piscine privée,
   rien que pour vous" / "اكتري مسبحًا خاصًا لك وحدك"), and the search module:
   city autocomplete + date + guests counter + big search button. Trust microcopy
   under it: "✓ Paiement sur place · ✓ Propriétaires vérifiés".
2. Trust strip: 3 compact items — Propriétaires vérifiés, Paiement sur place,
   Annulation flexible.
3. "Piscines populaires" — horizontal scroll of pool cards (use S1 card).
4. "Comment ça marche" — 3 steps for renters (Cherchez → Réservez votre créneau →
   Profitez, payez sur place), illustrated.
5. Privacy value prop section: "À l'abri des regards" — explain the privacy filter,
   targeted at families. One photo + short copy + CTA.
6. Owner CTA band: "Vous avez une piscine ? Gagnez jusqu'à 3 000 DH par week-end" +
   "Publier mon annonce".
7. Cities grid: Casablanca, Marrakech, Rabat, Agadir, Tanger, Bouskoura (photo tiles).
8. Footer: links (À propos, Comment ça marche, CGU, Confidentialité, Contact),
   language switcher, socials.

Include the PWA install banner variant (dismissible, above bottom tab bar).
```

### S3 — Search results + filters

```
Design S3 — Search results, reusing S1 tokens.

Goal: scan many pools fast, filter precisely, trust what you see.

- Top: compact search summary pill (city · date · guests) that reopens search.
- Filter bar (horizontal scroll chips on mobile): Prix, Créneau, Confidentialité
  (à l'abri des regards), Convient aux enfants, Équipements, Règles, Note. Tapping
  "Prix" or "Équipements" opens a bottom-sheet with the detailed controls + result
  count button ("Voir 23 piscines").
- Sort control: Pertinence / Prix croissant / Mieux notées / Plus récentes.
- Results count + active filter chips (dismissible).
- Card grid using the S1 pool card: photo carousel dots, price "à partir de 350 DH /
  matinée", city + neighborhood, rating ★4,8 (12), badges (Vérifié, À l'abri des
  regards), favorite heart.
- Map toggle button (floating, bottom center on mobile): show the map view variant
  with price pins and a swipeable card rail at the bottom.
- States: skeleton grid (6 cards), empty state ("Aucune piscine à Fès pour cette date"
  + suggestions: change date, nearby cities), pagination or infinite scroll with loader.
Desktop: filters as a left column, map as a right split-view option.
```

### S4 — Listing detail

```
Design S4 — Listing detail page, reusing S1 tokens. This is the money screen — it must
sell trust.

Content top to bottom (mobile):
1. Photo gallery: full-width swipe carousel, counter "3/11", share + favorite buttons
   overlaid, tap → full-screen grid.
2. Title + location ("Villa avec piscine chauffée — Dar Bouazza, Casablanca") +
   rating ★4,8 (12 avis) + badges: ✓ Vérifié, 👀 À l'abri des regards.
3. Owner card: avatar, "Hôte : Yasmine", Membre depuis 2024, taux de réponse 95%,
   répond en ~1h. Two contact buttons: 📞 Appeler + WhatsApp (green) — VISIBLE
   without scrolling effort, not buried.
4. Key facts row: 👥 jusqu'à 15 invités · 📏 10×5m · 🌡️ Chauffée · 🚗 Parking.
5. Description (collapsible after 4 lines).
6. Équipements & extras: list with included ones (✓) and paid extras with price
   ("🍖 Barbecue +100 DH", "🧺 Serviettes +20 DH/pers").
7. Règlement: Convient aux enfants ✓, Musique autorisée ✓, Animaux ✗, Événements ✓,
   Propriétaire non présent ✓ — clear allowed/forbidden styling.
8. Disponibilités: month calendar with available days; tapping a day shows slot
   availability (Matinée 350 DH / Après-midi 400 DH / Journée 650 DH).
9. Localisation: map with APPROXIMATE circle (exact address only after acceptance) +
   neighborhood name.
10. Avis: rating summary by category (Propreté, Conformité aux photos, Communication,
    Confidentialité) + 2–3 review cards + "Voir les 12 avis".
11. "Piscines similaires" rail.

Sticky bottom bar (mobile): "À partir de 350 DH / matinée" + primary button
"Demander à réserver" + WhatsApp icon button. Desktop: right sticky booking card with
calendar + slot + recap, contact buttons under the owner block.
Include the "Paiement sur place" reassurance line in the booking card/bar.
```

### S5 — Booking request flow

```
Design S5 — Booking request flow, reusing S1 tokens. Launched from S4. Bottom-sheet
flow on mobile, modal on desktop. 3 steps + success.

Step 1 — Créneau: calendar (unavailable days disabled) + slot segmented control with
  per-slot prices; selected slot summary.
Step 2 — Détails: guests counter (with max limit warning), optional extras checklist
  with prices updating the total, message to owner textarea with helper placeholder
  ("Présentez-vous : qui vient, à quelle occasion…") — explain that a good message
  increases acceptance chances.
Step 3 — Récapitulatif: date, slot, guests, extras, TOTAL ESTIMÉ in DH with the
  explicit notice: "💵 Paiement en espèces sur place. Aucun paiement en ligne." +
  cancellation note + "Envoyer la demande" primary CTA.
Success state: confetti-light animation, "Demande envoyée à Yasmine ✓", explanation
  ("Vous recevrez une réponse sous 24h — souvent en moins d'1h"), buttons: Voir ma
  demande / Continuer à explorer. Mention that phone contact unlocks after acceptance
  (or show owner contact if already public — keep both variants).
Also show: the inline progress indicator (1/3, 2/3, 3/3), and the error state if the
slot got taken ("Ce créneau vient d'être réservé").
```

### S6 — Renter bookings (Mes réservations)

```
Design S6 — "Mes réservations" for renters, reusing S1 tokens.

- Tabs: À venir / En attente / Passées.
- Booking card: pool photo thumb, title, date + slot, guests, total, STATUS chip —
  En attente (amber), Acceptée (green, shows owner phone + WhatsApp + itinerary
  button), Refusée (gray, with optional owner reason), Annulée, Terminée (with
  "Laisser un avis" CTA if no review yet).
- Accepted card expands to: exact address + "Ouvrir dans Google Maps", owner contact,
  recap, "Annuler la demande" (with confirmation dialog asking reason).
- Empty states per tab ("Aucune réservation à venir — Explorer les piscines").
- Pending card shows a subtle countdown ("Expire dans 22h" if owner doesn't answer).
```

### S7 — Owner dashboard

```
Design S7 — Owner dashboard, reusing S1 tokens. The owner's command center. Tabs or
segmented sections: Demandes / Calendrier / Mes annonces / Statistiques.

1. Demandes (default): request cards — renter avatar + name + member-since + their
   rating from past visits, requested date/slot/guests, their message, total in DH,
   and two big actions: Accepter (primary) / Refuser (ghost, asks a reason from a
   preset list). Accepted state reveals renter phone/WhatsApp. Badge count on tab.
2. Calendrier: month view; days show colored dots per slot (booked/blocked/free).
   Tap a day → bottom sheet to block/unblock slots or see the booking.
3. Mes annonces: listing rows with photo, status toggle (Publiée/En pause), quick
   stats (vues 7j, demandes), Modifier button, "Compléter votre annonce" progress
   meter if <100%.
4. Statistiques: simple cards — vues, taux d'acceptation, revenus estimés du mois
   (DH), note moyenne. One simple bar chart (views per week).
Include the empty "new owner" state: no listing yet → big "Publier ma première
annonce" CTA with the earnings pitch.
```

### S8 — Create/edit listing wizard

```
Design S8 — Listing wizard, reusing S1 tokens. Multi-step, mobile-first, progress bar
on top, Enregistrer-comme-brouillon implicit (autosave note). Steps:

1. L'essentiel: titre (with good/bad example helper), description (with AI-assist
   placeholder "Suggérer une description"), type (villa, riad, ferme…), capacité max.
2. Localisation: ville (autocomplete from Moroccan cities), quartier, exact address
   (with privacy note: "visible uniquement après acceptation"), map pin adjust.
3. Photos: upload grid (min 3, drag to reorder, first = cover), quality tips banner
   ("Photos lumineuses = 3× plus de demandes"), example good photo.
4. La piscine: dimensions, profondeur min/max, chauffée?, couverte?, sécurité enfants
   (barrière, alarme), à l'abri des regards toggle (explain why it matters).
5. Équipements & extras: checklist; each can be Inclus or payant with a price field
   (🧺 Serviettes, 🚿 Douche, 🚽 Toilettes, 🪑 Table & chaises, 🤽 Bouées,
   🍖 Barbecue, 🛖 Gazebo, WiFi, Parking…).
6. Règlement: toggles — enfants, musique, événements, animaux, propriétaire présent
   ou non, heures de silence.
7. Tarifs & créneaux: enable/disable each slot (Matinée/Après-midi/Soirée/Journée),
   price per slot in DH, weekend premium toggle, suggested price hint ("Les piscines
   similaires à Bouskoura: 300–450 DH/matinée").
8. Aperçu & publication: live preview of the listing card + detail, validation
   checklist (✓ 3 photos min, ✓ prix, ✓ règlement), big "Publier" CTA, then success
   state with share buttons (WhatsApp, Facebook, Instagram, copy link).
```

### S9 — Auth

```
Design S9 — Authentication screens, reusing S1 tokens. Keep it FAST — auth is asked
only when needed (booking request, favorite, publish).

- Entry bottom-sheet: "Continuer avec Google", "Continuer avec Facebook", divider,
  phone/email option. Reassurance: "Gratuit · Sans engagement".
- Sign up form: name, email, password (show/hide), terms checkbox linking CGU.
- Phone verification step (CRITICAL for trust): +212 input, SMS code 6-digit boxes,
  resend with countdown — explain "Votre numéro vérifié rassure les propriétaires ✓".
- Sign in + forgot password (email sent confirmation state).
- Show the contextual auth trigger variant: user tapped "Demander à réserver" while
  logged out → sheet says "Connectez-vous pour envoyer votre demande à Yasmine".
- Error states: wrong password, account exists with Google, invalid code.
```

### S10 — Public profile & settings

```
Design S10 — Profile, reusing S1 tokens. Two surfaces:

1. Public profile (seen by others): avatar, name, ✓ badges (téléphone vérifié,
   email vérifié), membre depuis, languages, rating as renter (from owners) and as
   owner (from renters) when applicable, their listings if owner, reviews received.
2. My settings: edit profile (photo, name, bio), phone + verification status,
   language FR/AR, notifications toggles (WhatsApp/SMS/email/push per event type),
   favorites list, "Passer en mode propriétaire" entry, logout, delete account
   (danger zone with confirmation).
```

### S11 — Reviews

```
Design S11 — Reviews, reusing S1 tokens.

1. Post-visit prompt (next day): push/notification card + in-app sheet "Comment était
   la piscine de Yasmine ?" → star rating overall + 4 category sliders/stars
   (Propreté, Conformité aux photos, Communication, Confidentialité) + comment with
   helpful prompt + photo upload option. Owner reviews renter too (simple: respect
   des lieux, ponctualité, communication).
2. Review display on listing: category bars, distribution (5★ ×8, 4★ ×3…), review
   cards (avatar, name, date, slot type tag "Journée complète", text, owner reply
   variant), report button, "Voir tous les avis" full sheet with sort/filter.
3. Owner reply composer with guidance ("Remerciez, restez professionnel").
```

### S12 — Notifications

```
Design S12 — Notifications center + push templates, reusing S1 tokens.

- In-app list grouped by day: Nouvelle demande (owner), Demande acceptée 🎉 (renter,
  with contact CTA), Rappel veille de visite (with itinerary + owner phone), Demande
  expirée, Nouvel avis reçu, Conseils ("Ajoutez des photos pour plus de demandes").
- Unread states, swipe to dismiss, mark all read, empty state.
- Also mock 4 OS push notification previews (lockscreen style) for the key events,
  in FR and AR.
```

### S13 — How it works / trust page

```
Design S13 — "Comment ça marche" + trust page, reusing S1 tokens.

- Two audiences with a toggle: Locataires / Propriétaires.
- Renter flow: 4 illustrated steps (Cherchez → Demandez votre créneau → Échangez avec
  le propriétaire → Profitez et payez sur place).
- Owner flow: Publiez gratuitement → Recevez des demandes → Acceptez qui vous voulez →
  Encaissez en espèces. Earnings example card.
- Trust section: vérification du téléphone, avis authentiques (après visite réelle
  uniquement), confidentialité de l'adresse, conseils de sécurité.
- FAQ accordion (8 questions: annulation, caution, no-show, enfants, etc.).
- Final CTA band both ways.
```

### S14 — States kit

```
Design S14 — States kit, reusing S1 tokens. One artifact, grid of state cards:

- Empty: recherches sans résultat, aucune réservation, aucune annonce, aucun avis,
  aucune notification, aucun favori.
- Errors: 404 (piscine introuvable — playful drained-pool illustration), erreur
  serveur, formulaire (inline + toast), créneau plus disponible.
- Offline PWA state + retry; update-available toast ("Nouvelle version — Actualiser").
- Loading: page skeletons (list, detail, dashboard) + button spinners.
- Confirmation dialogs: annuler une demande, refuser une demande, supprimer une
  annonce, se déconnecter.
Each state: illustration style consistent with brand (line + turquoise fill), short
human copy in French, one clear action.
```

---

## Utility prompts

### RTL / Arabic pass (run on any finished screen)

```
Take screen [SX] and produce its Arabic RTL version: dir="rtl", all layout mirrored
(start/end), directional icons flipped, Arabic typography (IBM Plex Sans Arabic),
all copy translated to Modern Standard Arabic (Morocco-friendly), prices as
"350 درهم". Keep tokens and spacing identical.
```

### Consistency check (run every 3–4 screens)

```
Compare the last screens against the S1 Design System Sheet. List any drift (colors,
radii, type sizes, button styles, spacing) as a table: element / S1 token / what the
screen used / fix. Then regenerate only the drifted parts.
```

### Iteration tips

- One change request at a time works better than five.
- Reference tokens by name ("use the primary-600 from S1") instead of describing colors.
- Ask for "Design notes" explanations when a layout choice seems odd — sometimes the reasoning is good.
- When a screen is final, save the HTML next to this file (e.g. `design/S4-listing-detail.html`) — these become the reference for the Vue implementation.

