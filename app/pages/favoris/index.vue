<script setup lang="ts">
// Favorites — the signed-in user's saved pools, rendered in the same card grid
// as search/home. Auth-gated. Empty state mirrors S14 (icon + copy + CTA).
import type { PoolListItem } from '~/types/db'

definePageMeta({ middleware: 'auth', layout: 'dashboard' })

const { t, locale } = useI18n()
const localePath = useLocalePath()

const { favorites, favoriteIdSet, pending, error } = useFavorites()
const { toggle } = useToggleFavorite()

useSeoMeta({
  title: () => `${t('favorites.seoTitle')} · Masbah`,
  robots: 'noindex',
})

// ── Card bindings (same mapping as search.vue / index.vue) ────────────────
function isFav(id: string): boolean {
  return favoriteIdSet.value.has(id)
}
function onToggleFav(pool: PoolListItem, next: boolean): void {
  // PoolCard emits the NEW value; toggle() expects the CURRENT state.
  void toggle(pool.id, !next)
}
function cardCity(p: PoolListItem): string {
  return p.neighborhood ? `${p.neighborhood} · ${p.cityName}` : p.cityName
}
function cardAmenities(p: PoolListItem): string[] {
  return p.amenities
    .filter((a) => a.included)
    .slice(0, 3)
    .map((a) => (locale.value === 'ar' ? a.label_ar : a.label_fr))
}
</script>

<template>
  <div class="fav-page">
    <header class="fav-head">
      <h1 class="t-h1">{{ t('favorites.title') }}</h1>
      <p class="muted t-body" style="margin-top: 0.3rem">
        <template v-if="!pending && favorites.length">{{
          t('favorites.count', { n: favorites.length })
        }}</template>
        <template v-else>{{ t('favorites.subtitle') }}</template>
      </p>
    </header>

    <!-- error -->
    <div v-if="error" class="state-card">
      <span class="ill-circle" style="color: var(--danger)">
        <svg
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          stroke-width="1.8"
          stroke-linecap="round"
          stroke-linejoin="round"
          aria-hidden="true"
        >
          <path
            d="M10.3 3.3 1.8 18a2 2 0 0 0 1.7 3h16.9a2 2 0 0 0 1.7-3L13.7 3.3a2 2 0 0 0-3.4 0Z"
          />
          <path d="M12 9v4.5M12 17h.01" />
        </svg>
      </span>
      <p class="sc-copy">{{ t('favorites.error') }}</p>
    </div>

    <!-- skeletons -->
    <div v-else-if="pending" class="card-grid">
      <PoolCardSkeleton v-for="n in 6" :key="n" />
    </div>

    <!-- empty (S14 style) -->
    <div v-else-if="!favorites.length" class="state-card">
      <span class="ill-circle">
        <span class="acc" />
        <svg
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          stroke-width="1.8"
          stroke-linecap="round"
          stroke-linejoin="round"
          aria-hidden="true"
        >
          <path
            d="M19 14c1.5-1.5 3-3.2 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.8 0-3 .5-4.5 2-1.5-1.5-2.7-2-4.5-2A5.5 5.5 0 0 0 2 8.5C2 10.8 3.5 12.5 5 14l7 7Z"
          />
        </svg>
      </span>
      <div class="sc-title">{{ t('favorites.empty.title') }}</div>
      <p class="sc-copy">{{ t('favorites.empty.body') }}</p>
      <div class="sc-action">
        <NuxtLink :to="localePath('/search')" class="btn btn-primary btn-sm">
          {{ t('favorites.empty.cta') }}
        </NuxtLink>
      </div>
    </div>

    <!-- grid -->
    <div v-else class="card-grid">
      <PoolCard
        v-for="pool in favorites"
        :id="pool.id"
        :key="pool.id"
        :title="pool.title"
        :city="cardCity(pool)"
        :rating="pool.rating ?? undefined"
        :review-count="pool.reviewCount"
        :price-from="pool.priceFrom ?? undefined"
        :cover-url="pool.coverUrl ?? undefined"
        :amenities="cardAmenities(pool)"
        :sheltered="pool.sheltered"
        :reliable-host="pool.rating !== null && pool.rating >= 4.7"
        :favorite="isFav(pool.id)"
        @update:favorite="(v: boolean) => onToggleFav(pool, v)"
      />
    </div>
  </div>
</template>

<style scoped>
.fav-page {
  max-width: 1100px;
  margin-inline: auto;
}
.fav-head {
  margin-bottom: 1.4rem;
}

/* results grid (mirrors search.vue) */
.card-grid {
  display: grid;
  grid-template-columns: 1fr;
  gap: 1rem;
}
@media (min-width: 560px) {
  .card-grid {
    grid-template-columns: 1fr 1fr;
  }
}
@media (min-width: 1180px) {
  .card-grid {
    grid-template-columns: 1fr 1fr 1fr;
  }
}

/* state card (mirrors S14 / search.vue) */
.state-card {
  background: #fff;
  border: 1px solid var(--line);
  border-radius: var(--r-2xl);
  box-shadow: var(--sh-sm);
  padding: 2.6rem 1.3rem;
  text-align: center;
  display: flex;
  flex-direction: column;
  align-items: center;
}
.ill-circle {
  width: 92px;
  height: 92px;
  border-radius: 50%;
  background: radial-gradient(circle at 50% 34%, var(--aqua-100), var(--aqua-50));
  display: grid;
  place-items: center;
  color: var(--aqua-700);
  position: relative;
  margin-bottom: 1rem;
}
.ill-circle > svg {
  width: 42px;
  height: 42px;
}
.ill-circle .acc {
  position: absolute;
  width: 13px;
  height: 13px;
  border-radius: 50%;
  background: var(--coral);
  top: 10px;
  inset-inline-end: 16px;
  box-shadow: 0 0 0 4px #fff;
}
.sc-title {
  font-weight: 700;
  font-size: 1.05rem;
}
.sc-copy {
  font-size: 0.9rem;
  color: var(--ink-muted);
  line-height: 1.5;
  margin-top: 0.4rem;
  max-width: 26rem;
}
.sc-action {
  margin-top: 1.2rem;
}
.sc-action .btn {
  text-decoration: none;
}
</style>
