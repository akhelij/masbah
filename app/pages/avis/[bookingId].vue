<script setup lang="ts">
import type { ReviewableBooking } from '~/composables/useReviewableBookings'
import type { ReviewCategories, SlotKey } from '~/types/db'

definePageMeta({ middleware: 'auth', layout: 'dashboard' })

const route = useRoute()
const { t, locale } = useI18n()
const localePath = useLocalePath()

const bookingId = computed(() => String(route.params.bookingId))

useSeoMeta({
  title: () => `${t('reviews.seoTitle')} · Masbah`,
  robots: 'noindex',
})

// ── Resolve which booking + direction applies for this caller ───────────────
const { reviewable, pending } = useReviewableBookings()
const target = computed<ReviewableBooking | null>(() => {
  const all = [...reviewable.value.asRenter, ...reviewable.value.asOwner]
  return all.find((b) => b.bookingId === bookingId.value) ?? null
})
const isRenterReview = computed(() => target.value?.targetType === 'pool')

// ── Slot label ──────────────────────────────────────────────────────────────
const SLOT_LABELS: Record<SlotKey, string> = {
  morning: 'slots.morning',
  afternoon: 'slots.afternoon',
  evening: 'slots.evening',
  full_day: 'slots.fullDay',
}
function formatDate(iso: string): string {
  const [y, m, d] = iso.split('-').map(Number)
  if (!y || !m || !d) return iso
  return new Date(y, m - 1, d).toLocaleDateString(locale.value === 'ar' ? 'ar-MA' : 'fr-MA', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  })
}
const visitLine = computed(() => {
  const b = target.value
  if (!b) return ''
  return t('reviews.visitWithSlot', { date: formatDate(b.date), slot: t(SLOT_LABELS[b.slot]) })
})
const counterpartInitials = computed(() => {
  const n = (target.value?.counterpartName ?? '').trim()
  if (!n) return '·'
  const parts = n.split(/\s+/).filter(Boolean)
  const a = parts[0]?.[0] ?? ''
  const b = parts.length > 1 ? (parts[parts.length - 1]?.[0] ?? '') : ''
  return (a + b).toUpperCase()
})

// ── Category axes (slugs stored in `categories` jsonb) ──────────────────────
interface CatDef {
  key: keyof ReviewCategories
  icon: string
  label: string
}
const poolCats = computed<CatDef[]>(() => [
  { key: 'proprete', icon: '🧼', label: t('pool.reviews_section.cat.proprete') },
  { key: 'conformite', icon: '📸', label: t('pool.reviews_section.cat.conformite') },
  { key: 'rapport', icon: '💰', label: t('pool.reviews_section.cat.rapport') },
  { key: 'communication', icon: '💬', label: t('pool.reviews_section.cat.communication') },
])
const renterCats = computed<CatDef[]>(() => [
  { key: 'communication', icon: '💬', label: t('reviews.renterCat.communication') },
  { key: 'respect', icon: '🏡', label: t('reviews.renterCat.respect') },
  { key: 'ponctualite', icon: '⏱️', label: t('reviews.renterCat.ponctualite') },
])
const activeCats = computed(() => (isRenterReview.value ? poolCats.value : renterCats.value))

// ── Form state ──────────────────────────────────────────────────────────────
const overall = ref(0)
const hovered = ref(0)
const cats = ref<Record<string, number>>({})
const comment = ref('')
const formError = ref<string | null>(null)

const overallLabel = computed(() => {
  const v = hovered.value || overall.value
  return v >= 1 && v <= 5 ? t(`reviews.ratingLabels.${v}`) : t('reviews.tapStars')
})

function setCat(key: string, v: number): void {
  cats.value = { ...cats.value, [key]: v }
}

// ── Submit ──────────────────────────────────────────────────────────────────
const { submit, pending: submitting, error: submitError } = useCreateReview()
const submitted = ref(false)

async function onSubmit(): Promise<void> {
  formError.value = null
  if (!target.value) return
  if (overall.value < 1) {
    formError.value = t('reviews.ratingRequired')
    return
  }
  // Only include axes the user actually rated.
  const categories: ReviewCategories = {}
  for (const c of activeCats.value) {
    const v = cats.value[c.key]
    if (typeof v === 'number' && v >= 1) categories[c.key] = v
  }
  const id = await submit({
    bookingId: bookingId.value,
    targetType: target.value.targetType,
    rating: overall.value,
    categories,
    comment: comment.value,
  })
  if (id) submitted.value = true
}

const backTo = computed(() => (isRenterReview.value ? '/bookings' : '/demandes'))
const backLabel = computed(() =>
  isRenterReview.value ? t('reviews.backToBookings') : t('reviews.backToRequests')
)
</script>

<template>
  <div class="review-page">
    <!-- ░ SUCCESS ░ -->
    <div v-if="submitted" class="state-card">
      <span class="state-ok">
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
      </span>
      <h1 class="t-h2" style="margin-top: 1rem">{{ t('reviews.successTitle') }}</h1>
      <p class="t-body muted" style="max-width: 26rem; margin: 0.5rem auto 0">
        {{ isRenterReview ? t('reviews.successBodyPool') : t('reviews.successBodyRenter') }}
      </p>
      <NuxtLink :to="localePath(backTo)" class="btn btn-primary btn-lg" style="margin-top: 1.4rem">
        {{ backLabel }}
      </NuxtLink>
    </div>

    <!-- ░ LOADING ░ -->
    <div v-else-if="pending" class="loading">
      <div class="skel" style="height: 64px; border-radius: var(--r-lg)" />
      <div class="skel" style="height: 180px; margin-top: 1rem; border-radius: var(--r-2xl)" />
    </div>

    <!-- ░ NOT REVIEWABLE ░ (already done / not eligible) -->
    <div v-else-if="!target" class="state-card">
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
          <circle cx="12" cy="12" r="9" />
          <path d="M12 8h.01M11 12h1v4h1" />
        </svg>
      </span>
      <h1 class="t-h2" style="margin-top: 1rem">{{ t('reviews.ineligibleTitle') }}</h1>
      <p class="t-body muted" style="max-width: 30rem; margin: 0.5rem auto 0">
        {{ t('reviews.ineligibleBody') }}
      </p>
      <NuxtLink
        :to="localePath('/bookings')"
        class="btn btn-secondary btn-lg"
        style="margin-top: 1.4rem"
      >
        {{ t('reviews.backToBookings') }}
      </NuxtLink>
    </div>

    <!-- ░ FORM ░ -->
    <form v-else class="form" @submit.prevent="onSubmit">
      <h1 class="t-h1 page-title">
        {{ isRenterReview ? t('reviews.titlePool') : t('reviews.titleRenter') }}
      </h1>

      <!-- context -->
      <div class="ctx">
        <span class="avatar ctx-avatar">{{ counterpartInitials }}</span>
        <div style="min-width: 0">
          <strong class="ctx-name">{{
            isRenterReview
              ? target.poolTitle || t('reviews.questionPoolFallback')
              : target.counterpartName || t('demandes.unknownRenter')
          }}</strong>
          <div class="t-sm muted">
            <template v-if="isRenterReview && target.counterpartName">
              {{ t('reviews.hostLabel', { name: target.counterpartName }) }} ·
            </template>
            {{ visitLine }}
          </div>
        </div>
      </div>

      <!-- overall rating -->
      <div class="overall">
        <h2 class="t-h3 overall-q">
          {{
            isRenterReview
              ? target.poolTitle
                ? t('reviews.questionPool', { pool: target.poolTitle })
                : t('reviews.questionPoolFallback')
              : t('reviews.questionRenter')
          }}
        </h2>
        <div
          class="srate"
          role="radiogroup"
          :aria-label="t('reviews.overallLabel')"
          @mouseleave="hovered = 0"
        >
          <button
            v-for="v in 5"
            :key="v"
            type="button"
            class="srate-btn"
            :class="{ on: v <= (hovered || overall) }"
            role="radio"
            :aria-checked="overall === v"
            :aria-label="t(`reviews.ratingLabels.${v}`)"
            @mouseover="hovered = v"
            @focus="hovered = v"
            @click="overall = v"
          >
            <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
              <path
                d="m12 2 3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01z"
              />
            </svg>
          </button>
        </div>
        <div class="overall-label">{{ overallLabel }}</div>
      </div>

      <!-- private note (owner reviewing renter) -->
      <p v-if="!isRenterReview" class="private-note">{{ t('reviews.privateNote') }}</p>

      <!-- category sub-ratings -->
      <div class="cats">
        <div class="cats-title">{{ t('reviews.categoriesTitle') }}</div>
        <div v-for="c in activeCats" :key="c.key" class="cat-row">
          <span class="cat-label"
            ><span aria-hidden="true">{{ c.icon }}</span> {{ c.label }}</span
          >
          <div class="srate srate-sm" role="radiogroup" :aria-label="c.label">
            <button
              v-for="v in 5"
              :key="v"
              type="button"
              class="srate-btn"
              :class="{ on: v <= (cats[c.key] ?? 0) }"
              role="radio"
              :aria-checked="(cats[c.key] ?? 0) === v"
              :aria-label="`${c.label}: ${v}`"
              @click="setCat(c.key, v)"
            >
              <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
                <path
                  d="m12 2 3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01z"
                />
              </svg>
            </button>
          </div>
        </div>
      </div>

      <!-- comment -->
      <label class="field comment-field">
        <span class="label">
          {{ t('reviews.commentLabel') }}
          <span class="muted" style="font-weight: 400">{{ t('reviews.commentOptional') }}</span>
        </span>
        <textarea
          v-model="comment"
          class="ta"
          rows="4"
          :placeholder="
            isRenterReview
              ? t('reviews.commentPlaceholderPool')
              : t('reviews.commentPlaceholderRenter')
          "
        />
      </label>

      <!-- cash tone reminder (renter reviewing pool) -->
      <p v-if="isRenterReview" class="cash-tone">
        <svg
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          stroke-width="2"
          stroke-linecap="round"
          stroke-linejoin="round"
          aria-hidden="true"
        >
          <rect x="2" y="5" width="20" height="14" rx="3" />
          <circle cx="12" cy="12" r="2.5" />
        </svg>
        {{ t('common.cashOnPlace') }}
      </p>

      <p v-if="formError" class="hint-err" style="margin-top: 0.5rem">{{ formError }}</p>
      <p v-else-if="submitError" class="hint-err" style="margin-top: 0.5rem">
        {{ t(submitError) }}
      </p>

      <PButton type="submit" block size="lg" :loading="submitting" style="margin-top: 1.2rem">
        {{ isRenterReview ? t('reviews.submitPool') : t('reviews.submitRenter') }}
      </PButton>
    </form>
  </div>
</template>

<style scoped>
.review-page {
  max-width: 560px;
  margin-inline: auto;
}
.page-title {
  margin-bottom: 1.1rem;
}

/* loading */
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

/* state cards (success / ineligible) */
.state-card {
  text-align: center;
  padding: 2.5rem 1rem;
}
.state-ok,
.state-info {
  width: 84px;
  height: 84px;
  border-radius: 50%;
  display: grid;
  place-items: center;
  margin-inline: auto;
}
.state-ok {
  background: var(--success-soft);
  color: var(--success);
}
.state-info {
  background: var(--aqua-50);
  color: var(--aqua-700);
}
.state-ok svg,
.state-info svg {
  width: 42px;
  height: 42px;
}

/* context */
.ctx {
  display: flex;
  align-items: center;
  gap: 0.7rem;
  background: var(--sand-2);
  border-radius: var(--r-lg);
  padding: 0.6rem 0.8rem;
  margin-bottom: 1.3rem;
}
.ctx-avatar {
  width: 40px;
  height: 40px;
  font-size: 0.85rem;
  background: linear-gradient(135deg, #fb7185, #f43f5e);
}
.ctx-name {
  font-size: 0.95rem;
  display: block;
}

/* overall */
.overall {
  text-align: center;
  margin-bottom: 1.4rem;
}
.overall-q {
  font-size: 1.15rem;
  margin-bottom: 0.8rem;
}
.overall-label {
  font-weight: 700;
  color: var(--aqua-700);
  margin-top: 0.5rem;
  min-height: 1.2em;
}

/* clickable stars */
.srate {
  display: inline-flex;
  gap: 0.25rem;
  justify-content: center;
}
.srate-btn {
  background: none;
  border: none;
  cursor: pointer;
  color: var(--line-strong);
  padding: 0;
  line-height: 1;
  transition: transform var(--dur-1);
}
.srate-btn:hover {
  transform: scale(1.12);
}
.srate-btn:focus-visible {
  outline: none;
  border-radius: 6px;
  box-shadow: var(--focus);
}
.srate-btn.on {
  color: var(--amber);
}
.srate svg {
  width: 38px;
  height: 38px;
  display: block;
}
.srate-sm svg {
  width: 26px;
  height: 26px;
}

/* private note */
.private-note {
  text-align: center;
  font-size: 0.85rem;
  color: var(--ink-muted);
  margin: -0.6rem 0 1.2rem;
}

/* categories */
.cats {
  margin-bottom: 1.2rem;
}
.cats-title {
  font-weight: 700;
  font-size: 0.8125rem;
  text-transform: uppercase;
  letter-spacing: 0.04em;
  color: var(--ink-muted);
  margin-bottom: 0.3rem;
}
.cat-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 0.8rem;
  padding: 0.7rem 0;
  border-bottom: 1px solid var(--line-2);
}
.cat-row:last-child {
  border-bottom: none;
}
.cat-label {
  font-weight: 600;
  font-size: 0.92rem;
}

/* comment */
.comment-field {
  margin-bottom: 0.4rem;
}

/* cash tone */
.cash-tone {
  display: flex;
  align-items: center;
  gap: 0.45rem;
  font-size: 0.82rem;
  font-weight: 600;
  color: var(--amber-ink);
  margin-top: 0.8rem;
}
.cash-tone svg {
  width: 16px;
  height: 16px;
  flex: none;
}
</style>
