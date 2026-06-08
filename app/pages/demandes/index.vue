<script setup lang="ts">
import type { OwnerRequestItem } from '~/composables/useOwnerRequests'
import type { BookingStatus } from '~/composables/useRenterBookings'
import type { SlotKey } from '~/types/db'

definePageMeta({ middleware: 'auth', layout: 'dashboard' })

const { t, locale } = useI18n()
const localePath = useLocalePath()

useSeoMeta({
  title: () => `${t('demandes.seoTitle')} · Masbah`,
  robots: 'noindex',
})

const { requests, pendingRequests, pending, error, refresh } = useOwnerRequests()
const { accept, decline, pending: responding, error: respondError } = useRespondBooking()

// Accepted + past + not-yet-reviewed requests the owner can still rate (S11).
const { reviewable } = useReviewableBookings()
const reviewableIds = computed(() => new Set(reviewable.value.asOwner.map((b) => b.bookingId)))

// ── Tabs: à traiter (pending) / traitées (everything else) ──────────────────
type Tab = 'pending' | 'handled'
const tab = ref<Tab>('pending')

const handledRequests = computed(() => requests.value.filter((r) => r.status !== 'pending'))
const visible = computed(() =>
  tab.value === 'pending' ? pendingRequests.value : handledRequests.value
)

// ── Slot labels ─────────────────────────────────────────────────────────────
const SLOT_LABELS: Record<SlotKey, string> = {
  morning: 'slots.morning',
  afternoon: 'slots.afternoon',
  evening: 'slots.evening',
  full_day: 'slots.fullDay',
}
const SLOT_SUBS: Record<SlotKey, string> = {
  morning: 'slots.morningSub',
  afternoon: 'slots.afternoonSub',
  evening: 'slots.eveningSub',
  full_day: 'slots.fullDaySub',
}
function slotLabel(slot: SlotKey): string {
  return `${t(SLOT_LABELS[slot])} · ${t(SLOT_SUBS[slot])}`
}

// ── Status badge classes ─────────────────────────────────────────────────────
const STATUS_CLASS: Record<BookingStatus, string> = {
  pending: 'st-wait',
  accepted: 'st-ok',
  declined: 'st-no',
  expired: 'st-no',
  cancelled_by_renter: 'st-no',
}

// ── Formatting ───────────────────────────────────────────────────────────────
function formatDate(iso: string): string {
  const [y, m, d] = iso.split('-').map(Number)
  if (!y || !m || !d) return iso
  return new Date(y, m - 1, d).toLocaleDateString(locale.value === 'ar' ? 'ar-MA' : 'fr-MA', {
    weekday: 'short',
    day: 'numeric',
    month: 'short',
  })
}

const RTF_DIVISIONS: { amount: number; unit: Intl.RelativeTimeFormatUnit }[] = [
  { amount: 60, unit: 'second' },
  { amount: 60, unit: 'minute' },
  { amount: 24, unit: 'hour' },
  { amount: 7, unit: 'day' },
  { amount: 4.34524, unit: 'week' },
  { amount: 12, unit: 'month' },
  { amount: Number.POSITIVE_INFINITY, unit: 'year' },
]
function timeAgo(iso: string): string {
  const rtf = new Intl.RelativeTimeFormat(locale.value === 'ar' ? 'ar-MA' : 'fr-MA', {
    numeric: 'auto',
  })
  let duration = (new Date(iso).getTime() - Date.now()) / 1000
  for (const division of RTF_DIVISIONS) {
    if (Math.abs(duration) < division.amount) {
      return rtf.format(Math.round(duration), division.unit)
    }
    duration /= division.amount
  }
  return ''
}

function initials(name: string | null | undefined): string {
  const n = (name ?? '').trim()
  if (!n) return '?'
  const parts = n.split(/\s+/).filter(Boolean)
  const first = parts[0]?.[0] ?? ''
  const last = parts.length > 1 ? (parts[parts.length - 1]?.[0] ?? '') : ''
  return (first + last).toUpperCase() || '?'
}

function extrasLabel(req: OwnerRequestItem): string {
  return req.extras.map((e) => (locale.value === 'ar' ? e.label_ar : e.label_fr)).join(' · ')
}

// ── Accept ───────────────────────────────────────────────────────────────────
const actingId = ref<string | null>(null)
async function onAccept(req: OwnerRequestItem): Promise<void> {
  actingId.value = req.id
  try {
    const ok = await accept(req.id)
    if (ok) await refresh()
  } finally {
    actingId.value = null
  }
}

// ── Decline (PModal + optional reason) ───────────────────────────────────────
const declineTarget = ref<OwnerRequestItem | null>(null)
const declineReason = ref('')
const declineOpen = computed({
  get: () => declineTarget.value !== null,
  set: (v: boolean) => {
    if (!v) declineTarget.value = null
  },
})
function askDecline(req: OwnerRequestItem): void {
  respondError.value = null
  declineReason.value = ''
  declineTarget.value = req
}
async function confirmDecline(): Promise<void> {
  const target = declineTarget.value
  if (!target) return
  actingId.value = target.id
  try {
    const ok = await decline(target.id, declineReason.value)
    if (ok) {
      declineTarget.value = null
      await refresh()
    }
  } finally {
    actingId.value = null
  }
}
</script>

<template>
  <div class="demandes">
    <header class="dm-head">
      <h1 class="t-h1">{{ t('demandes.title') }}</h1>
      <p class="muted t-sm dm-sub">
        <template v-if="pendingRequests.length">
          {{ t('demandes.subtitle', { count: pendingRequests.length }) }}
        </template>
        <template v-else>{{ t('demandes.subtitleEmpty') }}</template>
      </p>
    </header>

    <!-- reassurance note -->
    <div class="dm-reassure">
      <svg
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        stroke-width="2"
        stroke-linecap="round"
        stroke-linejoin="round"
        aria-hidden="true"
      >
        <rect x="3" y="11" width="18" height="11" rx="2" />
        <path d="M7 11V7a5 5 0 0 1 10 0v4" />
      </svg>
      <span class="t-sm">{{ t('demandes.contactRevealNote') }}</span>
    </div>

    <!-- tabs -->
    <div class="tabs" role="tablist">
      <button
        v-for="key in ['pending', 'handled'] as const"
        :key="key"
        class="tabx"
        :class="{ 'is-on': tab === key }"
        type="button"
        role="tab"
        :aria-selected="tab === key"
        @click="tab = key"
      >
        {{ t(`demandes.tabs.${key}`) }}
        <span v-if="(key === 'pending' ? pendingRequests : handledRequests).length" class="cnt">
          {{ (key === 'pending' ? pendingRequests : handledRequests).length }}
        </span>
      </button>
    </div>

    <!-- error -->
    <div v-if="error" class="state-msg">
      <p class="t-body muted">{{ t('demandes.error') }}</p>
      <PButton variant="secondary" size="sm" style="margin-top: 0.8rem" @click="refresh()">
        {{ t('common.retry') }}
      </PButton>
    </div>

    <!-- skeleton -->
    <div v-else-if="pending" class="list">
      <div v-for="i in 3" :key="i" class="skel req-sk" />
    </div>

    <!-- empty -->
    <div v-else-if="!visible.length" class="empty">
      <span class="empty-ill">
        <svg
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          stroke-width="1.7"
          stroke-linecap="round"
          stroke-linejoin="round"
          aria-hidden="true"
        >
          <path d="M22 12h-4l-3 9L9 3l-3 9H2" />
        </svg>
      </span>
      <h2 class="t-h3" style="margin-top: 1rem">{{ t(`demandes.empty.${tab}.title`) }}</h2>
      <p class="t-body muted" style="max-width: 28rem; margin: 0.5rem auto 0">
        {{ t(`demandes.empty.${tab}.body`) }}
      </p>
      <NuxtLink
        v-if="tab === 'pending'"
        :to="localePath('/annonces')"
        class="btn btn-secondary btn-lg"
        style="margin-top: 1.2rem"
      >
        {{ t('demandes.empty.manageCta') }}
      </NuxtLink>
    </div>

    <!-- list -->
    <div v-else class="list">
      <article v-for="req in visible" :key="req.id" class="req-card">
        <!-- renter row -->
        <div class="req-renter">
          <NuxtImg
            v-if="req.renter?.avatar_url"
            :src="req.renter.avatar_url"
            :alt="req.renter.full_name ?? t('demandes.unknownRenter')"
            width="48"
            height="48"
            format="webp"
            class="req-avatar"
          />
          <span v-else class="req-avatar req-avatar-fallback" aria-hidden="true">
            {{ initials(req.renter?.full_name) }}
          </span>
          <div class="req-renter-info">
            <div class="req-renter-top">
              <strong>{{ req.renter?.full_name ?? t('demandes.unknownRenter') }}</strong>
              <span class="t-sm faint">{{ timeAgo(req.createdAt) }}</span>
            </div>
            <div class="req-renter-sub">
              <PBadge v-if="req.renter?.phone_verified" variant="phone">
                <svg
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  stroke-width="2"
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  aria-hidden="true"
                >
                  <path d="M9 12l2 2 4-4" />
                  <path d="M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" />
                </svg>
                {{ t('demandes.phoneVerified') }}
              </PBadge>
              <span v-else class="t-sm faint">{{ t('demandes.phoneUnverified') }}</span>
            </div>
          </div>
        </div>

        <!-- pool title -->
        <div class="req-pool">
          <NuxtImg
            v-if="req.coverUrl"
            :src="req.coverUrl"
            :alt="req.poolTitle ?? t('demandes.untitledPool')"
            width="36"
            height="36"
            format="webp"
            class="req-pool-thumb"
          />
          <span v-else class="req-pool-thumb req-pool-thumb-empty" aria-hidden="true" />
          <div class="req-pool-text">
            <strong class="req-pool-title">{{
              req.poolTitle ?? t('demandes.untitledPool')
            }}</strong>
            <span v-if="req.cityName" class="t-sm muted">{{ req.cityName }}</span>
          </div>
        </div>

        <!-- meta chips -->
        <div class="req-meta">
          <span class="mchip">
            <svg
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              stroke-width="2"
              stroke-linecap="round"
              stroke-linejoin="round"
              aria-hidden="true"
            >
              <rect x="3" y="4" width="18" height="18" rx="2.5" />
              <path d="M16 2v4M8 2v4M3 10h18" />
            </svg>
            {{ formatDate(req.date) }}
          </span>
          <span class="mchip">{{ slotLabel(req.slot) }}</span>
          <span class="mchip">
            <svg
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              stroke-width="2"
              stroke-linecap="round"
              stroke-linejoin="round"
              aria-hidden="true"
            >
              <circle cx="9" cy="8" r="3.4" />
              <path d="M3 20a6 6 0 0 1 12 0M16 5.5a3 3 0 0 1 0 5" />
            </svg>
            {{ t('demandes.guests', { count: req.guests }) }}
          </span>
          <span v-if="req.extras.length" class="mchip mchip-extra">
            {{ t('demandes.extrasCount', { count: req.extras.length }) }} · {{ extrasLabel(req) }}
          </span>
        </div>

        <!-- renter message -->
        <p v-if="req.message" class="req-msg">« {{ req.message }} »</p>

        <!-- total + actions (pending) -->
        <template v-if="req.status === 'pending'">
          <div class="req-foot">
            <div class="req-total">
              <span class="muted t-sm">{{ t('demandes.totalOnPlace') }}</span>
              <strong>{{ formatMad(req.totalEstimateMad, locale) }}</strong>
            </div>
            <div class="req-acts">
              <PButton
                variant="ghost"
                :disabled="responding && actingId === req.id"
                @click="askDecline(req)"
              >
                {{ t('demandes.decline.action') }}
              </PButton>
              <PButton
                variant="primary"
                :loading="responding && actingId === req.id"
                @click="onAccept(req)"
              >
                <template #icon>
                  <svg
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    stroke-width="2.2"
                    stroke-linecap="round"
                    stroke-linejoin="round"
                    aria-hidden="true"
                  >
                    <path d="M20 6 9 17l-5-5" />
                  </svg>
                </template>
                {{ t('demandes.accept.action') }}
              </PButton>
            </div>
          </div>
          <p class="req-hint">{{ t('demandes.accept.autoDeclineHint') }}</p>
        </template>

        <!-- responded: status + reason -->
        <div v-else class="req-resolved">
          <PBadge :class="STATUS_CLASS[req.status]">{{
            t(`demandes.status.${req.status}`)
          }}</PBadge>
          <span v-if="req.status === 'accepted'" class="t-sm muted">
            {{ t('demandes.acceptedNote') }}
          </span>
          <span v-else-if="req.status === 'declined' && req.declineReason" class="t-sm muted">
            {{ t('demandes.declineReason', { reason: req.declineReason }) }}
          </span>
          <span v-else-if="req.status === 'declined'" class="t-sm muted">
            {{ t('demandes.declinedNoReason') }}
          </span>
          <span v-else-if="req.status === 'expired'" class="t-sm muted">
            {{ t('demandes.expiredNote') }}
          </span>
          <span v-else-if="req.status === 'cancelled_by_renter'" class="t-sm muted">
            {{ t('demandes.cancelledNote') }}
          </span>
        </div>

        <!-- rate the renter (accepted + visit passed + not yet rated) -->
        <NuxtLink
          v-if="reviewableIds.has(req.id)"
          :to="localePath('/avis/' + req.id)"
          class="btn btn-secondary btn-sm rate-cta"
        >
          <svg viewBox="0 0 24 24" fill="var(--amber)" aria-hidden="true">
            <path
              d="m12 2 3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01z"
            />
          </svg>
          {{ t('reviews.rateRenter') }}
        </NuxtLink>
      </article>
    </div>

    <!-- decline dialog -->
    <PModal v-model:open="declineOpen" :title="t('demandes.decline.title')">
      <p class="t-sm muted">{{ t('demandes.decline.body') }}</p>
      <PInput
        v-model="declineReason"
        :label="t('demandes.decline.reasonLabel')"
        :placeholder="t('demandes.decline.reasonPlaceholder')"
        style="margin-top: 0.9rem"
      />
      <p v-if="respondError" class="hint-err" style="margin-top: 0.7rem">{{ t(respondError) }}</p>
      <template #footer>
        <PButton variant="ghost" :disabled="responding" @click="declineOpen = false">
          {{ t('common.cancel') }}
        </PButton>
        <PButton variant="destructive" :loading="responding" @click="confirmDecline">
          {{ t('demandes.decline.confirm') }}
        </PButton>
      </template>
    </PModal>
  </div>
</template>

<style scoped>
.demandes {
  max-width: 760px;
  margin-inline: auto;
}
.dm-head {
  margin-bottom: 0.3rem;
}
.dm-sub {
  margin-top: 0.25rem;
}

/* reassurance */
.dm-reassure {
  display: flex;
  align-items: center;
  gap: 0.55rem;
  margin-top: 0.9rem;
  background: var(--aqua-50);
  color: var(--aqua-800);
  border-radius: var(--r-lg);
  padding: 0.7rem 0.85rem;
}
.dm-reassure svg {
  width: 18px;
  height: 18px;
  flex: none;
}

/* tabs (mirrors bookings page) */
.tabs {
  display: flex;
  gap: 0.2rem;
  border-bottom: 1px solid var(--line);
  margin-top: 1.1rem;
}
.tabx {
  flex: 1;
  justify-content: center;
  padding: 0.8rem 0.2rem;
  font-weight: 700;
  font-size: 0.92rem;
  color: var(--ink-muted);
  border: none;
  border-bottom: 2.5px solid transparent;
  margin-bottom: -1px;
  cursor: pointer;
  background: none;
  display: inline-flex;
  align-items: center;
  gap: 0.4rem;
}
@media (min-width: 560px) {
  .tabx {
    flex: none;
    padding-inline: 1rem;
  }
}
.tabx.is-on {
  color: var(--aqua-800);
  border-bottom-color: var(--aqua-700);
}
.cnt {
  background: var(--sand-2);
  color: var(--ink-muted);
  font-size: 0.7rem;
  font-weight: 800;
  padding: 0.08rem 0.42rem;
  border-radius: 99px;
  min-width: 1.2rem;
  text-align: center;
}
.tabx.is-on .cnt {
  background: var(--aqua-100);
  color: var(--aqua-800);
}

/* list */
.list {
  display: flex;
  flex-direction: column;
  gap: 1rem;
  margin-top: 1.2rem;
}
.req-sk {
  height: 220px;
  border-radius: var(--r-2xl);
}
.req-card {
  background: #fff;
  border: 1px solid var(--line);
  border-radius: var(--r-2xl);
  box-shadow: var(--sh-sm);
  padding: 1.1rem;
}

/* renter row */
.req-renter {
  display: flex;
  gap: 0.8rem;
  align-items: flex-start;
}
.req-avatar {
  width: 48px;
  height: 48px;
  border-radius: 999px;
  object-fit: cover;
  flex: none;
  background: var(--sand-2);
}
.req-avatar-fallback {
  display: grid;
  place-items: center;
  color: #fff;
  font-weight: 700;
  font-size: 0.95rem;
  background: linear-gradient(135deg, #0e7490, #155e75);
}
.req-renter-info {
  flex: 1;
  min-width: 0;
}
.req-renter-top {
  display: flex;
  justify-content: space-between;
  gap: 0.5rem;
  flex-wrap: wrap;
  align-items: baseline;
}
.req-renter-sub {
  margin-top: 0.3rem;
}

/* pool */
.req-pool {
  display: flex;
  align-items: center;
  gap: 0.6rem;
  margin-top: 0.85rem;
  padding-top: 0.85rem;
  border-top: 1px solid var(--line);
}
.req-pool-thumb {
  width: 36px;
  height: 36px;
  border-radius: var(--r-md);
  object-fit: cover;
  flex: none;
  background: var(--sand-2);
}
.req-pool-thumb-empty {
  background: var(--sand-2);
}
.req-pool-text {
  min-width: 0;
  display: flex;
  flex-direction: column;
  gap: 0.05rem;
}
.req-pool-title {
  font-size: 0.95rem;
  line-height: 1.2;
}

/* meta chips */
.req-meta {
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
  margin-top: 0.85rem;
}
.mchip {
  display: inline-flex;
  align-items: center;
  gap: 0.35rem;
  background: var(--aqua-50);
  color: var(--aqua-800);
  font-weight: 600;
  font-size: 0.82rem;
  padding: 0.35rem 0.6rem;
  border-radius: var(--r-pill);
}
.mchip svg {
  width: 14px;
  height: 14px;
  flex: none;
}
.mchip-extra {
  background: var(--amber-soft);
  color: var(--amber-ink);
}

/* message */
.req-msg {
  background: var(--sand-2);
  border-radius: var(--r-lg);
  padding: 0.75rem 0.9rem;
  font-size: 0.9rem;
  line-height: 1.5;
  margin-top: 0.85rem;
}

/* foot / actions */
.req-foot {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 1rem;
  flex-wrap: wrap;
  margin-top: 0.9rem;
}
.req-total {
  display: flex;
  flex-direction: column;
  gap: 0.1rem;
}
.req-total strong {
  font-size: 1.1rem;
}
.req-acts {
  display: flex;
  gap: 0.6rem;
  flex: 1;
  justify-content: flex-end;
  flex-wrap: wrap;
}
.req-hint {
  font-size: 0.78rem;
  color: var(--ink-faint);
  margin-top: 0.6rem;
  text-align: end;
}

/* resolved */
.req-resolved {
  display: flex;
  align-items: center;
  gap: 0.6rem;
  flex-wrap: wrap;
  margin-top: 0.9rem;
  padding-top: 0.9rem;
  border-top: 1px solid var(--line);
}
.rate-cta {
  margin-top: 0.8rem;
}
.rate-cta svg {
  width: 16px;
  height: 16px;
  flex: none;
}

/* status chip colors (applied to PBadge root) */
.st-wait {
  background: var(--amber-soft);
  color: var(--amber-ink);
}
.st-ok {
  background: var(--success-soft);
  color: #0f7a38;
}
.st-no {
  background: var(--sand-2);
  color: var(--ink-muted);
}

/* empty / error */
.empty {
  text-align: center;
  padding: 3rem 1rem;
  margin-top: 1rem;
}
.empty-ill {
  width: 88px;
  height: 88px;
  border-radius: 50%;
  background: radial-gradient(circle at 50% 38%, var(--aqua-100), var(--aqua-50));
  display: grid;
  place-items: center;
  color: var(--aqua-600);
  margin-inline: auto;
}
.empty-ill svg {
  width: 40px;
  height: 40px;
}
.state-msg {
  text-align: center;
  padding: 2.5rem 1rem;
}
</style>
