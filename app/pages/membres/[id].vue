<script setup lang="ts">
import type { RatingSummary } from '~/composables/usePublicProfile'
import type { UserReviewItem } from '~/composables/useUserReviews'
import type { PoolListItem } from '~/types/db'

// Public page (no auth): anyone can view a member's profile.
const route = useRoute()
const { t, locale } = useI18n()
const localePath = useLocalePath()

const id = computed(() => String(route.params.id))
const { member, pending } = usePublicProfile(id)
const { reviews } = useUserReviews(id)

// ── Identity ────────────────────────────────────────────────────────────────
const initials = computed(() => {
  const n = (member.value?.profile.full_name ?? '').trim()
  if (!n) return '·'
  const parts = n.split(/\s+/).filter(Boolean)
  const a = parts[0]?.[0] ?? ''
  const b = parts.length > 1 ? (parts[parts.length - 1]?.[0] ?? '') : ''
  return (a + b).toUpperCase()
})
const displayName = computed(() => member.value?.profile.full_name || t('reviews.titleRenter'))
const memberYear = computed(() => {
  const c = member.value?.profile.created_at
  return c ? new Date(c).getFullYear() : null
})

// ── Rating helpers ────────────────────────────────────────────────────────
function fmtRating(s: RatingSummary): string {
  return (s.avg ?? 0).toLocaleString(locale.value, {
    minimumFractionDigits: 1,
    maximumFractionDigits: 1,
  })
}
function fillWidth(s: RatingSummary): string {
  return `${((s.avg ?? 0) / 5) * 100}%`
}

// ── Reviews tab ──────────────────────────────────────────────────────────
const revTab = ref<'host' | 'guest'>('host')
// Land on whichever bucket has reviews.
watch([() => reviews.value.asHost.length, () => reviews.value.asGuest.length], () => {
  if (!reviews.value.asHost.length && reviews.value.asGuest.length) revTab.value = 'guest'
})
const visibleReviews = computed<UserReviewItem[]>(() =>
  revTab.value === 'host' ? reviews.value.asHost : reviews.value.asGuest
)

function reviewInitials(name: string | null | undefined): string {
  const n = (name ?? '').trim()
  if (!n) return '·'
  const parts = n.split(/\s+/).filter(Boolean)
  const a = parts[0]?.[0] ?? ''
  const b = parts.length > 1 ? (parts[parts.length - 1]?.[0] ?? '') : ''
  return (a + b).toUpperCase()
}
function reviewDate(iso: string): string {
  return new Date(iso).toLocaleDateString(locale.value === 'ar' ? 'ar-MA' : 'fr-MA', {
    month: 'long',
    year: 'numeric',
  })
}

// ── Listings strip card mapping (mirrors search.vue) ───────────────────────
function cardCity(p: PoolListItem): string {
  return p.neighborhood ? `${p.neighborhood} · ${p.cityName}` : p.cityName
}
function cardAmenities(p: PoolListItem): string[] {
  return p.amenities
    .filter((a) => a.included)
    .slice(0, 3)
    .map((a) => (locale.value === 'ar' ? a.label_ar : a.label_fr))
}

// ── SEO (noindex is fine for member profiles) ──────────────────────────────
useSeoMeta({
  title: () => `${displayName.value} · Masbah`,
  description: () => t('profile.seoDescription', { name: displayName.value }),
  robots: 'noindex',
})
</script>

<template>
  <div class="member">
    <!-- ░ NOT FOUND ░ -->
    <div v-if="!member && !pending" class="state-card">
      <span class="state-info">
        <svg
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          stroke-width="2"
          stroke-linecap="round"
          stroke-linejoin="round"
          aria-hidden="true"
        >
          <circle cx="12" cy="8" r="4" />
          <path d="M4 21a8 8 0 0 1 16 0" />
        </svg>
      </span>
      <h1 class="t-h2" style="margin-top: 1rem">{{ t('profile.notFoundTitle') }}</h1>
      <p class="t-body muted" style="max-width: 30rem; margin: 0.5rem auto 0">
        {{ t('profile.notFoundBody') }}
      </p>
      <NuxtLink :to="localePath('/')" class="btn btn-primary" style="margin-top: 1.4rem">
        {{ t('profile.backHome') }}
      </NuxtLink>
    </div>

    <!-- ░ LOADING ░ -->
    <div v-else-if="pending" class="loading">
      <div class="skel" style="height: 200px; border-radius: var(--r-2xl)" />
      <div class="skel" style="height: 90px; margin-top: 1rem; border-radius: var(--r-xl)" />
    </div>

    <!-- ░ PROFILE ░ -->
    <template v-else-if="member">
      <!-- identity card -->
      <div class="id-card">
        <div class="id-cover" />
        <div class="id-body">
          <NuxtImg
            v-if="member.profile.avatar_url"
            :src="member.profile.avatar_url"
            :alt="displayName"
            width="92"
            height="92"
            format="webp"
            class="avatar id-avatar"
          />
          <span v-else class="avatar id-avatar id-avatar-fallback">{{ initials }}</span>
          <h1 class="t-h1" style="margin-top: 0.6rem">{{ displayName }}</h1>
          <p v-if="memberYear" class="muted t-sm" style="margin-top: 0.2rem">
            {{ t('profile.memberSince', { year: memberYear }) }}
          </p>

          <div v-if="member.profile.phone_verified" class="id-badges">
            <PBadge variant="verified">
              <template #icon>
                <svg
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  stroke-width="2.4"
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  aria-hidden="true"
                >
                  <path d="M20 6 9 17l-5-5" />
                </svg>
              </template>
              {{ t('profile.phoneVerified') }}
            </PBadge>
          </div>

          <p v-if="member.profile.bio" class="t-body" style="margin-top: 0.9rem">
            {{ member.profile.bio }}
          </p>
        </div>
      </div>

      <!-- dual rating summaries -->
      <div class="ratings">
        <div class="rating-card">
          <div class="t-sm muted rating-role">{{ t('profile.asHost') }}</div>
          <div v-if="member.asHost.avg != null" class="rating-row">
            <span class="rating-num">{{ fmtRating(member.asHost) }}</span>
            <div>
              <span class="stars" :aria-label="fmtRating(member.asHost)">
                <span class="base" aria-hidden="true">★★★★★</span>
                <span class="fill" aria-hidden="true" :style="{ width: fillWidth(member.asHost) }"
                  >★★★★★</span
                >
              </span>
              <div class="t-sm muted">
                {{ t('profile.hostReviews', { count: member.asHost.count }) }}
              </div>
            </div>
          </div>
          <div v-else class="t-sm muted rating-empty">{{ t('profile.noRatingYet') }}</div>
        </div>

        <div class="rating-card">
          <div class="t-sm muted rating-role">{{ t('profile.asGuest') }}</div>
          <div v-if="member.asGuest.avg != null" class="rating-row">
            <span class="rating-num">{{ fmtRating(member.asGuest) }}</span>
            <div>
              <span class="stars" :aria-label="fmtRating(member.asGuest)">
                <span class="base" aria-hidden="true">★★★★★</span>
                <span class="fill" aria-hidden="true" :style="{ width: fillWidth(member.asGuest) }"
                  >★★★★★</span
                >
              </span>
              <div class="t-sm muted">
                {{ t('profile.guestReviews', { count: member.asGuest.count }) }}
              </div>
            </div>
          </div>
          <div v-else class="t-sm muted rating-empty">{{ t('profile.noRatingYet') }}</div>
        </div>
      </div>

      <!-- listings strip -->
      <section v-if="member.pools.length" class="strip">
        <h2 class="t-h3 strip-head">
          {{ t('profile.listingsTitle') }}
          <span class="muted" style="font-weight: 500">· {{ member.pools.length }}</span>
        </h2>
        <div class="strip-grid">
          <PoolCard
            v-for="p in member.pools"
            :id="p.id"
            :key="p.id"
            :title="p.title"
            :city="cardCity(p)"
            :rating="p.rating ?? undefined"
            :review-count="p.reviewCount"
            :price-from="p.priceFrom ?? undefined"
            :cover-url="p.coverUrl ?? undefined"
            :amenities="cardAmenities(p)"
            :sheltered="p.sheltered"
            :reliable-host="p.rating !== null && p.rating >= 4.7"
          />
        </div>
      </section>

      <!-- reviews received -->
      <section class="rev-section">
        <div class="rev-head">
          <h2 class="t-h3">{{ t('profile.reviewsTitle') }}</h2>
          <div
            v-if="reviews.asHost.length || reviews.asGuest.length"
            class="minitab"
            role="tablist"
          >
            <button
              class="minitab-btn"
              :class="{ 'is-on': revTab === 'host' }"
              type="button"
              role="tab"
              :aria-selected="revTab === 'host'"
              @click="revTab = 'host'"
            >
              {{ t('profile.tabHost') }} ({{ reviews.asHost.length }})
            </button>
            <button
              class="minitab-btn"
              :class="{ 'is-on': revTab === 'guest' }"
              type="button"
              role="tab"
              :aria-selected="revTab === 'guest'"
              @click="revTab = 'guest'"
            >
              {{ t('profile.tabGuest') }} ({{ reviews.asGuest.length }})
            </button>
          </div>
        </div>

        <div v-if="visibleReviews.length" class="rev-grid">
          <article v-for="rev in visibleReviews" :key="rev.id" class="rev-card">
            <div class="rev-author">
              <NuxtImg
                v-if="rev.author?.avatar_url"
                :src="rev.author.avatar_url"
                :alt="rev.author.full_name ?? ''"
                width="40"
                height="40"
                format="webp"
                class="avatar rev-avatar"
              />
              <span v-else class="avatar rev-avatar rev-avatar-fallback">{{
                reviewInitials(rev.author?.full_name)
              }}</span>
              <div>
                <strong class="rev-name">{{ rev.author?.full_name || '—' }}</strong>
                <div class="t-sm muted">
                  {{ reviewDate(rev.created_at) }} ·
                  {{ rev.role === 'host' ? t('profile.reviewerHost') : t('profile.reviewerGuest') }}
                </div>
              </div>
            </div>
            <PRating :rating="rev.rating" size="sm" style="margin-top: 0.5rem" />
            <div v-if="rev.role === 'host' && rev.poolTitle" class="rev-pool">
              {{ rev.poolTitle }}
            </div>
            <p v-if="rev.comment" class="t-body" style="margin-top: 0.5rem">{{ rev.comment }}</p>
            <div v-if="rev.reply" class="rev-reply">
              <div class="rev-reply-head">
                <strong class="t-sm">{{
                  t('pool.reviews_section.replyFrom', { name: displayName })
                }}</strong>
                <PBadge variant="host">{{ t('pool.reviews_section.hostBadge') }}</PBadge>
              </div>
              <p class="t-sm" style="margin-top: 0.4rem">{{ rev.reply }}</p>
            </div>
          </article>
        </div>
        <p v-else class="rev-empty">{{ t('profile.noReviews') }}</p>
      </section>
    </template>
  </div>
</template>

<style scoped>
.member {
  max-width: 880px;
  margin-inline: auto;
}

/* loading + states */
.loading .skel {
  background: linear-gradient(100deg, var(--sand-2) 30%, #fff 50%, var(--sand-2) 70%);
  background-size: 200% 100%;
  animation: shimmer 1.4s infinite;
}
@keyframes shimmer {
  to {
    background-position: -200% 0;
  }
}
.state-card {
  text-align: center;
  padding: 3rem 1rem;
}
.state-info {
  width: 84px;
  height: 84px;
  border-radius: 50%;
  display: grid;
  place-items: center;
  margin-inline: auto;
  background: var(--aqua-50);
  color: var(--aqua-700);
}
.state-info svg {
  width: 40px;
  height: 40px;
}

/* identity card */
.id-card {
  background: #fff;
  border: 1px solid var(--line);
  border-radius: var(--r-2xl);
  box-shadow: var(--sh-sm);
  overflow: hidden;
  margin-bottom: 1.2rem;
}
.id-cover {
  height: 90px;
  background: linear-gradient(140deg, #0e7490, #0891b2 40%, #22c9de 75%, #7fe6ef);
}
.id-body {
  padding: 0 1.2rem 1.2rem;
  margin-top: -44px;
}
.id-avatar {
  width: 92px;
  height: 92px;
  font-size: 2rem;
  border: 4px solid #fff;
  box-shadow: var(--sh-sm);
  object-fit: cover;
}
.id-avatar-fallback {
  background: linear-gradient(135deg, #22d3ee, #0e7490);
}
.id-badges {
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
  margin-top: 0.9rem;
}

/* ratings */
.ratings {
  display: grid;
  gap: 0.75rem;
  margin-bottom: 1.4rem;
}
@media (min-width: 560px) {
  .ratings {
    grid-template-columns: 1fr 1fr;
  }
}
.rating-card {
  background: #fff;
  border: 1px solid var(--line);
  border-radius: var(--r-xl);
  box-shadow: var(--sh-sm);
  padding: 1rem 1.1rem;
}
.rating-role {
  font-weight: 700;
}
.rating-row {
  display: flex;
  align-items: center;
  gap: 0.6rem;
  margin-top: 0.4rem;
}
.rating-num {
  font-size: 1.8rem;
  font-weight: 800;
  line-height: 1;
}
.rating-empty {
  margin-top: 0.5rem;
}

/* listings strip */
.strip {
  margin-bottom: 1.6rem;
}
.strip-head {
  margin-bottom: 0.8rem;
}
.strip-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 0.75rem;
}
@media (min-width: 768px) {
  .strip-grid {
    grid-template-columns: repeat(3, 1fr);
  }
}

/* reviews */
.rev-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 1rem;
  margin-bottom: 0.8rem;
  flex-wrap: wrap;
}
.minitab {
  display: inline-flex;
  gap: 0.3rem;
  background: var(--sand-2);
  border-radius: var(--r-pill);
  padding: 0.25rem;
}
.minitab-btn {
  border: none;
  background: none;
  border-radius: var(--r-pill);
  padding: 0.4rem 0.8rem;
  font-weight: 700;
  font-size: 0.82rem;
  color: var(--ink-muted);
  cursor: pointer;
}
.minitab-btn.is-on {
  background: #fff;
  color: var(--aqua-800);
  box-shadow: var(--sh-sm);
}
.minitab-btn:focus-visible {
  outline: none;
  box-shadow: var(--focus);
}
.rev-grid {
  display: grid;
  gap: 0.75rem;
}
@media (min-width: 560px) {
  .rev-grid {
    grid-template-columns: 1fr 1fr;
  }
}
.rev-card {
  background: #fff;
  border: 1px solid var(--line);
  border-radius: var(--r-xl);
  padding: 1rem;
  box-shadow: var(--sh-sm);
}
.rev-author {
  display: flex;
  align-items: center;
  gap: 0.6rem;
}
.rev-avatar {
  width: 40px;
  height: 40px;
  font-size: 0.85rem;
  object-fit: cover;
}
.rev-avatar-fallback {
  background: linear-gradient(135deg, #0e7490, #155e75);
}
.rev-name {
  font-size: 0.95rem;
}
.rev-pool {
  font-size: 0.8rem;
  color: var(--aqua-800);
  font-weight: 600;
  margin-top: 0.4rem;
}
.rev-reply {
  margin-top: 0.9rem;
  padding: 0.85rem 0.95rem;
  background: var(--aqua-50);
  border-radius: var(--r-lg);
  border-inline-start: 3px solid var(--aqua-400);
}
.rev-reply-head {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}
.rev-empty {
  background: #fff;
  border: 1px solid var(--line);
  border-radius: var(--r-xl);
  padding: 1.4rem;
  text-align: center;
  color: var(--ink-muted);
  font-size: 0.9rem;
}
</style>
