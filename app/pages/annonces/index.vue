<script setup lang="ts">
import type { OwnerPoolItem } from '~/composables/useOwnerPools'

// The S7 "Mes annonces" management page: lists the owner's pools (all statuses)
// as rows with cover/title/city/status/completion/price + Modifier, Publier /
// Mettre en pause, Supprimer. Header stat strip + empty-state CTA. dashboard
// layout + auth middleware.
definePageMeta({ layout: 'dashboard', middleware: 'auth' })

const { t, locale } = useI18n()
const localePath = useLocalePath()
const supabase = useSupabaseClient()

const { pools, pending, error, refresh } = useOwnerPools()
const { setStatus, deletePool } = usePoolMutations()

useSeoMeta({
  title: () => `${t('annonces.seoTitle')} · Masbah`,
  robots: 'noindex',
})

// Header stats.
const publishedCount = computed(() => pools.value.filter((p) => p.status === 'published').length)
const totalViews = computed(() => pools.value.reduce((sum, p) => sum + p.views, 0))

// Lightweight ephemeral toast (no global toast system in the app yet).
const toast = ref<{ kind: 'success' | 'error'; text: string } | null>(null)
let toastTimer: ReturnType<typeof setTimeout> | null = null
function showToast(kind: 'success' | 'error', text: string): void {
  toast.value = { kind, text }
  if (toastTimer) clearTimeout(toastTimer)
  toastTimer = setTimeout(() => (toast.value = null), 3200)
}
onBeforeUnmount(() => {
  if (toastTimer) clearTimeout(toastTimer)
})

const busyId = ref<string | null>(null)

/**
 * Toggle a listing's status. Pausing is unconditional. Publishing requires the
 * minimum, so we load the full draft + photos + slots first and let
 * usePoolMutations.setStatus validate; if blocked, we nudge to the editor.
 */
async function toggleStatus(item: OwnerPoolItem): Promise<void> {
  busyId.value = item.id
  try {
    if (item.status === 'published') {
      const res = await setStatus(item.id, 'paused')
      if ('blocked' in res || res.error) {
        showToast('error', t('annonces.actionError'))
        return
      }
      showToast('success', t('annonces.pausedToast'))
      await refresh()
      return
    }

    // draft | paused → publish: gather context for the readiness check.
    const ctx = await loadPublishContext(item.id)
    if (!ctx) {
      showToast('error', t('annonces.actionError'))
      return
    }
    const res = await setStatus(item.id, 'published', ctx)
    if ('blocked' in res) {
      showToast('error', t('annonces.blockedToast'))
      await navigateTo(localePath(`/publish/${item.id}`))
      return
    }
    if (res.error) {
      showToast('error', t('annonces.actionError'))
      return
    }
    showToast('success', t('annonces.publishedToast'))
    await refresh()
  } finally {
    busyId.value = null
  }
}

interface PublishContext {
  draft: {
    title: string
    description: string | null
    city_id: string | null
    neighborhood: string | null
    lat: number | null
    lng: number | null
    max_guests: number
    length_m: number | null
    width_m: number | null
    amenities: { key: string }[]
    sheltered_from_view: boolean
    heated: boolean
    child_safe: boolean
  }
  photos: { id: string }[]
  slots: { enabled: boolean; price_mad: number }[]
}

async function loadPublishContext(id: string): Promise<PublishContext | null> {
  const [poolRes, photosRes, slotsRes] = await Promise.all([
    supabase
      .from('pools')
      .select(
        'title, description, city_id, neighborhood, lat, lng, max_guests, length_m, width_m, amenities, sheltered_from_view, heated, child_safe'
      )
      .eq('id', id)
      .maybeSingle(),
    supabase.from('pool_photos').select('id').eq('pool_id', id),
    supabase.from('pool_slots').select('enabled, price_mad').eq('pool_id', id),
  ])
  if (poolRes.error || !poolRes.data) return null
  const draft = poolRes.data as unknown as PublishContext['draft']
  return {
    draft: { ...draft, amenities: Array.isArray(draft.amenities) ? draft.amenities : [] },
    photos: (photosRes.data ?? []) as unknown as { id: string }[],
    slots: (slotsRes.data ?? []) as unknown as { enabled: boolean; price_mad: number }[],
  }
}

// Delete confirmation.
const deleteTarget = ref<OwnerPoolItem | null>(null)
const deleteOpen = ref(false)
const deleting = ref(false)

function askDelete(item: OwnerPoolItem): void {
  deleteTarget.value = item
  deleteOpen.value = true
}
async function confirmDelete(): Promise<void> {
  if (!deleteTarget.value) return
  deleting.value = true
  try {
    const res = await deletePool(deleteTarget.value.id)
    if (res.error) {
      showToast('error', t('annonces.actionError'))
      return
    }
    showToast('success', t('annonces.deletedToast'))
    deleteOpen.value = false
    deleteTarget.value = null
    await refresh()
  } finally {
    deleting.value = false
  }
}

function statusClass(status: OwnerPoolItem['status']): string {
  if (status === 'published') return 'st-ok'
  if (status === 'paused') return 'st-no'
  return 'st-wait'
}
function priceText(item: OwnerPoolItem): string {
  if (item.priceFrom === null) return t('annonces.noPrice')
  return t('common.priceFmt', { n: item.priceFrom.toLocaleString(locale.value) })
}
</script>

<template>
  <div class="annonces">
    <!-- header -->
    <div class="ann-head">
      <div>
        <h1 class="t-h1">{{ t('annonces.title') }}</h1>
        <p class="muted t-sm ann-sub">{{ t('annonces.subtitle') }}</p>
      </div>
      <NuxtLink :to="localePath('/publish')" class="btn btn-primary new-btn">
        <svg
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          stroke-width="2"
          stroke-linecap="round"
          aria-hidden="true"
        >
          <path d="M12 5v14M5 12h14" />
        </svg>
        {{ t('annonces.new') }}
      </NuxtLink>
    </div>

    <!-- stat strip -->
    <div v-if="pools.length" class="stat-strip">
      <div class="stat-pill">
        <strong>{{ pools.length }}</strong>
        <span class="muted t-sm">{{ t('annonces.stats.listings') }}</span>
      </div>
      <div class="stat-pill">
        <strong>{{ publishedCount }}</strong>
        <span class="muted t-sm">{{ t('annonces.stats.published') }}</span>
      </div>
      <div class="stat-pill">
        <strong>{{ totalViews }}</strong>
        <span class="muted t-sm">{{ t('annonces.stats.views') }}</span>
      </div>
    </div>

    <!-- loading -->
    <div v-if="pending && !pools.length" class="ann-loading">
      <span class="spinner" aria-hidden="true" />
      <p class="muted">{{ t('annonces.loading') }}</p>
    </div>

    <!-- error -->
    <div v-else-if="error" class="ann-error">
      <h2 class="t-h3">{{ t('annonces.errorTitle') }}</h2>
      <p class="muted">{{ t('annonces.errorBody') }}</p>
      <PButton variant="secondary" @click="refresh">{{ t('common.retry') }}</PButton>
    </div>

    <!-- empty state -->
    <div v-else-if="!pools.length" class="empty-card card">
      <div class="empty-hero">
        <div class="empty-emoji">🏖️</div>
        <h2 class="empty-title">{{ t('annonces.empty.title') }}</h2>
        <p class="empty-body">{{ t('annonces.empty.body') }}</p>
        <NuxtLink :to="localePath('/publish')" class="btn btn-lg empty-cta">
          <svg
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            stroke-width="2"
            stroke-linecap="round"
            aria-hidden="true"
          >
            <path d="M12 5v14M5 12h14" />
          </svg>
          {{ t('annonces.empty.cta') }}
        </NuxtLink>
      </div>
      <div class="empty-steps">
        <div class="empty-step">
          <div class="empty-step-ic">📸</div>
          <strong>{{ t('annonces.empty.step1Title') }}</strong>
          <span class="t-sm muted">{{ t('annonces.empty.step1Body') }}</span>
        </div>
        <div class="empty-step">
          <div class="empty-step-ic">🗓️</div>
          <strong>{{ t('annonces.empty.step2Title') }}</strong>
          <span class="t-sm muted">{{ t('annonces.empty.step2Body') }}</span>
        </div>
        <div class="empty-step">
          <div class="empty-step-ic">💵</div>
          <strong>{{ t('annonces.empty.step3Title') }}</strong>
          <span class="t-sm muted">{{ t('annonces.empty.step3Body') }}</span>
        </div>
      </div>
    </div>

    <!-- listings -->
    <div v-else class="listings">
      <article v-for="item in pools" :key="item.id" class="card listing">
        <div class="listing-row">
          <div class="listing-thumb">
            <img v-if="item.coverUrl" :src="item.coverUrl" :alt="item.title">
            <div v-else class="thumb-empty">
              <svg
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                stroke-width="1.6"
                stroke-linecap="round"
                stroke-linejoin="round"
                aria-hidden="true"
              >
                <rect x="3" y="3" width="18" height="18" rx="3" />
                <circle cx="8.5" cy="8.5" r="1.5" />
                <path d="m21 15-5-5L5 21" />
              </svg>
            </div>
          </div>

          <div class="listing-main">
            <div class="listing-title-row">
              <strong class="listing-title">{{ item.title || t('publish.essential.titlePlaceholder') }}</strong>
              <span class="st" :class="statusClass(item.status)">{{ t(`annonces.status.${item.status}`) }}</span>
            </div>
            <div class="t-sm muted listing-loc">
              {{ [item.neighborhood, item.cityName].filter(Boolean).join(', ') || '—' }}
            </div>
            <div class="listing-facts t-sm">
              <span><strong>{{ item.views }}</strong> <span class="muted">{{ t('annonces.viewsLabel') }}</span></span>
              <span class="listing-price">{{ priceText(item) }}</span>
            </div>
          </div>

          <div class="listing-actions">
            <PToggle
              v-if="item.status !== 'draft'"
              :model-value="item.status === 'published'"
              :aria-label="item.status === 'published' ? t('annonces.pause') : t('annonces.resume')"
              @update:model-value="toggleStatus(item)"
            />
            <PButton
              v-else
              variant="primary"
              size="sm"
              :loading="busyId === item.id"
              @click="toggleStatus(item)"
            >
              {{ t('annonces.publish') }}
            </PButton>
            <NuxtLink :to="localePath(`/publish/${item.id}`)" class="btn btn-secondary btn-sm">
              {{ item.status === 'draft' ? t('annonces.complete') : t('annonces.edit') }}
            </NuxtLink>
            <button
              class="icon-btn del-btn"
              type="button"
              :aria-label="t('annonces.delete')"
              @click="askDelete(item)"
            >
              <svg
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                stroke-width="2"
                stroke-linecap="round"
                stroke-linejoin="round"
                aria-hidden="true"
              >
                <path d="M3 6h18M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6" />
              </svg>
            </button>
          </div>
        </div>

        <!-- completion meter for drafts / paused / incomplete listings -->
        <div v-if="item.status !== 'published' || item.completionScore < 100" class="completion">
          <div class="completion-inner">
            <div class="completion-head">
              <strong>{{ t('annonces.completion') }}</strong>
              <strong>{{ item.completionScore }} %</strong>
            </div>
            <div class="meter"><i :style="{ width: `${item.completionScore}%` }" /></div>
            <NuxtLink :to="localePath(`/publish/${item.id}`)" class="btn btn-primary btn-sm complete-cta">
              {{ t('annonces.complete') }}
            </NuxtLink>
          </div>
        </div>
      </article>
    </div>

    <!-- delete confirm modal -->
    <PModal v-model:open="deleteOpen" :title="t('annonces.deleteModal.title')">
      <p class="t-body">
        {{ t('annonces.deleteModal.body', { title: deleteTarget?.title || '—' }) }}
      </p>
      <template #footer>
        <PButton variant="ghost" @click="deleteOpen = false">
          {{ t('annonces.deleteModal.cancel') }}
        </PButton>
        <PButton variant="destructive" :loading="deleting" @click="confirmDelete">
          {{ t('annonces.deleteModal.confirm') }}
        </PButton>
      </template>
    </PModal>

    <!-- toast -->
    <Transition name="toast">
      <div v-if="toast" class="toast" :class="`toast-${toast.kind}`" role="status">
        {{ toast.text }}
      </div>
    </Transition>
  </div>
</template>

<style scoped>
.ann-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 1rem;
  flex-wrap: wrap;
  margin-bottom: 1.1rem;
}
.ann-sub {
  margin-top: 0.2rem;
}
.new-btn {
  flex: none;
}

/* stat strip */
.stat-strip {
  display: flex;
  gap: 0.7rem;
  flex-wrap: wrap;
  margin-bottom: 1.3rem;
}
.stat-pill {
  display: flex;
  flex-direction: column;
  gap: 0.1rem;
  background: #fff;
  border: 1px solid var(--line);
  border-radius: var(--r-xl);
  box-shadow: var(--sh-sm);
  padding: 0.8rem 1.1rem;
  min-width: 96px;
}
.stat-pill strong {
  font-size: 1.5rem;
  font-weight: 800;
  letter-spacing: -0.02em;
}

/* loading / error */
.ann-loading,
.ann-error {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 0.8rem;
  text-align: center;
  padding: 3rem 1rem;
}
.spinner {
  width: 36px;
  height: 36px;
  border-radius: 50%;
  border: 3px solid var(--line-strong);
  border-top-color: var(--aqua-600);
  animation: spin 0.8s linear infinite;
}

/* listings */
.listings {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}
.card {
  background: #fff;
  border: 1px solid var(--line);
  border-radius: var(--r-2xl);
  box-shadow: var(--sh-sm);
}
.listing-row {
  display: flex;
  gap: 0.9rem;
  padding: 1rem;
  align-items: center;
}
.listing-thumb {
  width: 84px;
  height: 84px;
  border-radius: var(--r-lg);
  overflow: hidden;
  flex: none;
  background: var(--sand-2);
}
.listing-thumb img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}
.thumb-empty {
  width: 100%;
  height: 100%;
  display: grid;
  place-items: center;
  color: var(--ink-faint);
}
.thumb-empty svg {
  width: 28px;
  height: 28px;
}
.listing-main {
  flex: 1;
  min-width: 0;
}
.listing-title-row {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  flex-wrap: wrap;
}
.listing-title {
  font-size: 1rem;
  letter-spacing: -0.01em;
}
.listing-loc {
  margin-top: 0.2rem;
}
.listing-facts {
  display: flex;
  align-items: center;
  gap: 1.2rem;
  margin-top: 0.5rem;
  flex-wrap: wrap;
}
.listing-price {
  font-weight: 700;
  color: var(--ink-strong);
}
.listing-actions {
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  gap: 0.6rem;
  flex: none;
}
.del-btn {
  width: 38px;
  height: 38px;
  color: var(--ink-muted);
}
.del-btn:hover {
  border-color: var(--danger);
  color: var(--danger);
}

/* status badges */
.st {
  display: inline-flex;
  align-items: center;
  gap: 0.3rem;
  padding: 0.3rem 0.58rem;
  border-radius: var(--r-pill);
  font-size: 0.73rem;
  font-weight: 700;
  line-height: 1;
  white-space: nowrap;
}
.st-ok {
  background: var(--success-soft);
  color: #0f7a38;
}
.st-no {
  background: var(--sand-2);
  color: var(--ink-muted);
}
.st-wait {
  background: var(--amber-soft);
  color: var(--amber-ink);
}

/* completion meter */
.completion {
  padding: 0 1rem 1rem;
}
.completion-inner {
  background: var(--amber-soft);
  border-radius: var(--r-lg);
  padding: 0.8rem 0.9rem;
}
.completion-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 0.6rem;
  margin-bottom: 0.5rem;
  color: var(--amber-ink);
  font-size: 0.88rem;
}
.meter {
  height: 7px;
  border-radius: 99px;
  background: rgba(255, 255, 255, 0.6);
  overflow: hidden;
}
.meter i {
  display: block;
  height: 100%;
  background: var(--amber);
  border-radius: 99px;
  transition: width var(--dur-3) var(--ease-water);
}
.complete-cta {
  margin-top: 0.7rem;
}

/* empty state */
.empty-card {
  overflow: hidden;
}
.empty-hero {
  background: var(--grad-hero);
  color: #fff;
  padding: clamp(1.6rem, 4vw, 2.6rem);
  text-align: center;
}
.empty-emoji {
  font-size: 2.4rem;
}
.empty-title {
  font-size: clamp(1.5rem, 3.4vw, 2rem);
  font-weight: 800;
  letter-spacing: -0.02em;
  margin-top: 0.6rem;
}
.empty-body {
  font-size: 0.9375rem;
  line-height: 1.6;
  color: rgba(255, 255, 255, 0.92);
  max-width: 34rem;
  margin: 0.6rem auto 0;
}
.empty-cta {
  background: #fff;
  color: var(--aqua-800);
  margin-top: 1.3rem;
}
.empty-steps {
  display: grid;
  gap: 1rem;
  padding: 1.2rem;
}
@media (min-width: 640px) {
  .empty-steps {
    grid-template-columns: repeat(3, 1fr);
  }
}
.empty-step {
  text-align: center;
}
.empty-step-ic {
  font-size: 1.4rem;
}
.empty-step strong {
  display: block;
  margin-top: 0.3rem;
}

/* toast */
.toast {
  position: fixed;
  inset-inline: 0;
  bottom: calc(86px + env(safe-area-inset-bottom));
  margin-inline: auto;
  width: max-content;
  max-width: calc(100vw - 2rem);
  z-index: 70;
  padding: 0.7rem 1.1rem;
  border-radius: var(--r-pill);
  font-weight: 600;
  font-size: 0.9rem;
  color: #fff;
  box-shadow: var(--sh-pop);
}
@media (min-width: 768px) {
  .toast {
    bottom: 1.5rem;
  }
}
.toast-success {
  background: var(--success);
}
.toast-error {
  background: var(--danger);
}
.toast-enter-active,
.toast-leave-active {
  transition: opacity var(--dur-2), transform var(--dur-2) var(--ease-water);
}
.toast-enter-from,
.toast-leave-to {
  opacity: 0;
  transform: translateY(12px);
}

@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}
@media (prefers-reduced-motion: reduce) {
  .spinner {
    animation-duration: 1.6s;
  }
  .toast-enter-active,
  .toast-leave-active {
    transition-duration: 0.01ms;
  }
}
</style>
