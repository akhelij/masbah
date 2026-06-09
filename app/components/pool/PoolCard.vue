<script setup lang="ts">
interface Pool {
  id: string
  title: string
  city: string
  rating?: number
  reviewCount?: number
  priceFrom?: number
  slotLabel?: string
  coverUrl?: string
  amenities?: string[]
  sheltered?: boolean
  reliableHost?: boolean
  /** Distance from the visitor in km (set when "Près de moi" is active). */
  distanceKm?: number
}

const props = defineProps<Pool>()

const favorite = defineModel<boolean>('favorite', { default: false })

const { t, locale } = useI18n()
const localePath = useLocalePath()

const to = computed(() => localePath(`/pools/${props.id}`))

const ratingLabel = computed(() =>
  props.rating !== undefined ? props.rating.toLocaleString(locale.value) : undefined
)

const price = computed(() =>
  props.priceFrom !== undefined ? props.priceFrom.toLocaleString(locale.value) : undefined
)

const distanceLabel = computed(() => {
  if (props.distanceKm == null) return undefined
  const d = props.distanceKm
  const n = d < 10 ? Number(d.toFixed(1)) : Math.round(d)
  return t('pool.distance', { d: n.toLocaleString(locale.value) })
})

function toggleFav(): void {
  favorite.value = !favorite.value
}
</script>

<template>
  <article class="pcard">
    <div class="ph">
      <NuxtImg
        v-if="coverUrl"
        :src="coverUrl"
        :alt="`${title} — ${city}`"
        sizes="sm:100vw md:50vw lg:25vw"
        loading="lazy"
        format="webp"
      />
      <div v-if="sheltered || reliableHost" class="ph-badges">
        <span v-if="sheltered" class="badge badge-privacy">
          <svg
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            stroke-width="2"
            stroke-linecap="round"
            stroke-linejoin="round"
            aria-hidden="true"
          >
            <path
              d="M9.9 4.24A9.1 9.1 0 0 1 12 4c7 0 10 8 10 8a13.2 13.2 0 0 1-1.67 2.68M6.6 6.6A13.2 13.2 0 0 0 2 12s3 8 10 8a9.1 9.1 0 0 0 5.4-1.6M3 3l18 18M9.9 9.9a3 3 0 0 0 4.2 4.2"
            />
          </svg>
          {{ t('pool.sheltered') }}
        </span>
        <span v-if="reliableHost" class="badge badge-host">
          <svg
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            stroke-width="2"
            stroke-linecap="round"
            stroke-linejoin="round"
            aria-hidden="true"
          >
            <circle cx="12" cy="8" r="5" />
            <path d="M8.5 12.5 7 22l5-3 5 3-1.5-9.5" />
          </svg>
          {{ t('pool.reliableHost') }}
        </span>
      </div>
      <button
        class="fav"
        :class="{ 'is-on': favorite }"
        type="button"
        :aria-label="favorite ? t('pool.unfavorite') : t('pool.favorite')"
        :aria-pressed="favorite"
        @click="toggleFav"
      >
        <svg viewBox="0 0 24 24" aria-hidden="true">
          <path
            d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.29 1.51 4.04 3 5.5l7 7Z"
          />
        </svg>
      </button>
    </div>

    <NuxtLink :to="to" class="body">
      <div style="display: flex; justify-content: space-between; align-items: start; gap: 0.6rem">
        <h3 class="title">{{ title }}</h3>
        <span v-if="ratingLabel" class="rating">
          <svg viewBox="0 0 24 24" fill="var(--amber)" aria-hidden="true">
            <path
              d="m12 2 3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01z"
            />
          </svg>
          {{ ratingLabel }}
        </span>
      </div>

      <div class="meta t-sm">
        <svg
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          stroke-width="2"
          aria-hidden="true"
        >
          <path d="M21 10c0 6-9 12-9 12s-9-6-9-12a9 9 0 0 1 18 0Z" />
          <circle cx="12" cy="10" r="3" />
        </svg>
        <span
          >{{ city
          }}<template v-if="reviewCount !== undefined">
            · {{ t('pool.reviews', { count: reviewCount }) }}</template
          ><template v-if="distanceLabel">
            · <strong class="dist">{{ distanceLabel }}</strong></template
          ></span
        >
      </div>

      <div v-if="amenities?.length" class="amenities">
        <span v-for="(a, i) in amenities" :key="i">{{ a }}</span>
      </div>

      <div v-if="price" class="price">
        <span class="muted t-sm">{{ t('common.from') }}</span>
        <span class="price-val">{{ t('common.priceFmt', { n: price }) }}</span>
        <span class="muted t-sm">{{ t('common.perSlot') }}</span>
      </div>
    </NuxtLink>
  </article>
</template>

<style scoped>
.body {
  display: block;
  padding: 0.95rem 1.05rem 1.15rem;
  color: inherit;
  text-decoration: none;
}
.body:focus-visible {
  outline: none;
  box-shadow: inset 0 0 0 2px var(--aqua-500);
}
.title {
  font-size: 1.02rem;
  font-weight: 700;
  letter-spacing: -0.01em;
  line-height: 1.25;
}
.rating {
  display: inline-flex;
  align-items: center;
  gap: 0.25rem;
  font-weight: 700;
  font-size: 0.9rem;
  flex: none;
}
.rating svg {
  width: 15px;
  height: 15px;
}
.meta {
  display: flex;
  align-items: center;
  gap: 0.3rem;
  color: var(--ink-muted);
  margin-top: 0.25rem;
}
.meta svg {
  width: 14px;
  height: 14px;
  flex: none;
}
.meta .dist {
  color: var(--aqua-700);
  font-weight: 700;
}
.amenities {
  display: flex;
  gap: 0.4rem;
  margin-top: 0.6rem;
  font-size: 0.95rem;
}
.price {
  margin-top: 0.7rem;
  display: flex;
  align-items: baseline;
  gap: 0.3rem;
}
.price-val {
  font-weight: 800;
  font-size: 1.15rem;
  color: var(--ink-strong);
}
</style>
