<script setup lang="ts">
import type { RenterBookingItem, BookingStatus } from '~/composables/useRenterBookings'
import type { PoolContact } from '~/composables/usePoolContact'
import type { SlotKey } from '~/types/db'

definePageMeta({ middleware: 'auth', layout: 'dashboard' })

const { t, locale } = useI18n()
const localePath = useLocalePath()

useSeoMeta({
  title: () => `${t('bookings.seoTitle')} · Masbah`,
  robots: 'noindex',
})

const { bookings, pending, error, refresh } = useRenterBookings()

// ── Slot labels ───────────────────────────────────────────────────────────
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

// ── Tabs / grouping ───────────────────────────────────────────────────────
type Tab = 'pending' | 'accepted' | 'past'
const tab = ref<Tab>('pending')

const grouped = computed(() => {
  const out: Record<Tab, RenterBookingItem[]> = { pending: [], accepted: [], past: [] }
  for (const b of bookings.value) {
    if (b.status === 'pending') out.pending.push(b)
    else if (b.status === 'accepted') out.accepted.push(b)
    else out.past.push(b)
  }
  return out
})
const visible = computed(() => grouped.value[tab.value])

// Land on the first non-empty tab once data loads.
watch(bookings, () => {
  if (grouped.value.pending.length) tab.value = 'pending'
  else if (grouped.value.accepted.length) tab.value = 'accepted'
  else if (grouped.value.past.length) tab.value = 'past'
})

// ── Status badge ──────────────────────────────────────────────────────────
const STATUS_CLASS: Record<BookingStatus, string> = {
  pending: 'st-wait',
  accepted: 'st-ok',
  declined: 'st-no',
  expired: 'st-no',
  cancelled_by_renter: 'st-no',
}

// ── Date formatting ───────────────────────────────────────────────────────
function formatDate(iso: string): string {
  const [y, m, d] = iso.split('-').map(Number)
  if (!y || !m || !d) return iso
  return new Date(y, m - 1, d).toLocaleDateString(locale.value === 'ar' ? 'ar-MA' : 'fr-MA', {
    weekday: 'short',
    day: 'numeric',
    month: 'short',
  })
}

// ── Live "expires in" countdown (pending only) ────────────────────────────
const now = ref(Date.now())
let timer: ReturnType<typeof setInterval> | null = null
onMounted(() => {
  timer = setInterval(() => {
    now.value = Date.now()
  }, 60_000)
})
onBeforeUnmount(() => {
  if (timer) clearInterval(timer)
})
function expiresLabel(expiresAt: string): string {
  const ms = new Date(expiresAt).getTime() - now.value
  if (ms <= 0) return t('bookings.expired')
  const minutes = Math.floor(ms / 60_000)
  if (minutes >= 60) return t('bookings.expiresIn', { time: t('bookings.hoursShort', { count: Math.floor(minutes / 60) }) })
  return t('bookings.expiresIn', { time: t('bookings.minutesShort', { count: Math.max(1, minutes) }) })
}

// ── Cancel flow (PModal confirm → RPC) ────────────────────────────────────
const { cancel, pending: cancelPending, error: cancelError } = useCancelBooking()
const cancelTarget = ref<RenterBookingItem | null>(null)
const cancelOpen = computed({
  get: () => cancelTarget.value !== null,
  set: (v: boolean) => {
    if (!v) cancelTarget.value = null
  },
})
function askCancel(b: RenterBookingItem): void {
  cancelError.value = null
  cancelTarget.value = b
}
async function confirmCancel(): Promise<void> {
  const target = cancelTarget.value
  if (!target) return
  const ok = await cancel(target.id)
  if (ok) {
    cancelTarget.value = null
    await refresh()
  }
}

// ── Contact reveal (accepted → RPC) ───────────────────────────────────────
const { reveal } = usePoolContact()
const contactByBooking = ref<Record<string, PoolContact>>({})
const contactPendingId = ref<string | null>(null)
const contactErrorId = ref<string | null>(null)

async function revealContact(b: RenterBookingItem): Promise<PoolContact | null> {
  if (contactByBooking.value[b.id]) return contactByBooking.value[b.id] ?? null
  contactPendingId.value = b.id
  contactErrorId.value = null
  try {
    const contact = await reveal(b.poolId)
    if (contact) {
      contactByBooking.value = { ...contactByBooking.value, [b.id]: contact }
      return contact
    }
    contactErrorId.value = b.id
    return null
  } finally {
    contactPendingId.value = null
  }
}
// Auto-reveal accepted bookings as they appear so the contact block is ready.
watch(
  () => grouped.value.accepted.map((b) => b.id).join(','),
  () => {
    for (const b of grouped.value.accepted) {
      if (!contactByBooking.value[b.id]) void revealContact(b)
    }
  },
  { immediate: true }
)

function digitsOnly(phone: string): string {
  return phone.replace(/[^\d]/g, '')
}
function whatsappHref(phone: string): string {
  return `https://wa.me/${digitsOnly(phone)}`
}
function mapsHref(contact: PoolContact): string {
  if (contact.lat != null && contact.lng != null) {
    return `https://www.google.com/maps/search/?api=1&query=${contact.lat},${contact.lng}`
  }
  return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(contact.address ?? '')}`
}

// ── Empty-state copy per tab ──────────────────────────────────────────────
const emptyCopy = computed(() => ({
  title: t(`bookings.empty.${tab.value}.title`),
  body: t(`bookings.empty.${tab.value}.body`),
}))
</script>

<template>
  <div class="bookings">
    <h1 class="t-h1">{{ t('bookings.title') }}</h1>

    <!-- tabs -->
    <div class="tabs" role="tablist">
      <button
        v-for="key in (['pending', 'accepted', 'past'] as const)"
        :key="key"
        class="tabx"
        :class="{ 'is-on': tab === key }"
        type="button"
        role="tab"
        :aria-selected="tab === key"
        @click="tab = key"
      >
        {{ t(`bookings.tabs.${key}`) }}
        <span v-if="grouped[key].length" class="cnt">{{ grouped[key].length }}</span>
      </button>
    </div>

    <!-- error -->
    <div v-if="error" class="state-msg">
      <p class="t-body muted">{{ t('bookings.error') }}</p>
      <PButton variant="secondary" size="sm" style="margin-top: 0.8rem" @click="refresh()">
        {{ t('common.retry') }}
      </PButton>
    </div>

    <!-- skeleton -->
    <div v-else-if="pending" class="list">
      <div v-for="i in 3" :key="i" class="skel bcard-sk" />
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
          <rect x="3" y="4" width="18" height="18" rx="2.5" />
          <path d="M16 2v4M8 2v4M3 10h18" />
          <path d="m9 16 2 2 4-4" />
        </svg>
      </span>
      <h2 class="t-h3" style="margin-top: 1rem">{{ emptyCopy.title }}</h2>
      <p class="t-body muted" style="max-width: 28rem; margin: 0.5rem auto 0">{{ emptyCopy.body }}</p>
      <NuxtLink :to="localePath('/search')" class="btn btn-primary btn-lg" style="margin-top: 1.2rem">
        {{ t('bookings.empty.cta') }}
      </NuxtLink>
    </div>

    <!-- list -->
    <div v-else class="list">
      <article v-for="b in visible" :key="b.id" class="bcard">
        <div class="bcard-main">
          <NuxtImg
            v-if="b.coverUrl"
            :src="b.coverUrl"
            :alt="b.poolTitle ?? t('bookings.untitled')"
            width="88"
            height="88"
            format="webp"
            class="bcard-thumb"
          />
          <div v-else class="bcard-thumb bcard-thumb-empty" aria-hidden="true" />

          <div class="bcard-info">
            <div class="bcard-top">
              <strong class="bcard-title">{{ b.poolTitle ?? t('bookings.untitled') }}</strong>
              <PBadge :class="STATUS_CLASS[b.status]">{{ t(`bookings.status.${b.status}`) }}</PBadge>
            </div>
            <div class="bmeta">
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
              {{ formatDate(b.date) }} · {{ slotLabel(b.slot) }}
            </div>
            <div class="bmeta">
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
                <path d="M3 20a6 6 0 0 1 12 0M16 5.5a3 3 0 0 1 0 5M19 20a5.5 5.5 0 0 0-4-5.3" />
              </svg>
              <span v-if="b.cityName">{{ b.cityName }} · </span>{{ t('bookings.guests', { count: b.guests }) }}
              · <strong style="color: var(--ink)">{{ formatMad(b.totalEstimateMad, locale) }}</strong>
            </div>
          </div>
        </div>

        <!-- PENDING · countdown + cancel -->
        <template v-if="b.status === 'pending'">
          <div class="pending-bar">
            <span class="t-sm muted">{{ t('bookings.pendingNote') }}</span>
            <span class="countdown">
              <svg
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                stroke-width="2"
                stroke-linecap="round"
                stroke-linejoin="round"
                aria-hidden="true"
              >
                <circle cx="12" cy="13" r="8" />
                <path d="M12 9v4l2.5 1.5M9 2h6" />
              </svg>
              {{ expiresLabel(b.expiresAt) }}
            </span>
          </div>
          <div class="bcard-acts">
            <PButton variant="ghost" size="sm" @click="askCancel(b)">
              {{ t('bookings.cancel.action') }}
            </PButton>
          </div>
        </template>

        <!-- ACCEPTED · reveal contact + address + cash reminder -->
        <div v-else-if="b.status === 'accepted'" class="reveal">
          <template v-if="contactByBooking[b.id]">
            <!-- address -->
            <div class="reveal-addr">
              <svg
                viewBox="0 0 24 24"
                fill="none"
                stroke="var(--aqua-700)"
                stroke-width="2"
                stroke-linecap="round"
                stroke-linejoin="round"
                aria-hidden="true"
              >
                <path d="M21 10c0 6-9 12-9 12s-9-6-9-12a9 9 0 0 1 18 0Z" />
                <circle cx="12" cy="10" r="3" />
              </svg>
              <div>
                <strong>{{ contactByBooking[b.id]?.address || t('bookings.reveal.address') }}</strong>
                <div class="t-sm muted">{{ t('bookings.reveal.addressHint') }}</div>
              </div>
            </div>
            <a
              :href="mapsHref(contactByBooking[b.id]!)"
              target="_blank"
              rel="noopener"
              class="btn btn-primary btn-sm btn-block"
              style="margin-top: 0.7rem"
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
                <path d="M9 5 3 7v12l6-2 6 2 6-2V5l-6 2-6-2Z" />
                <path d="M9 5v12M15 7v12" />
              </svg>
              {{ t('bookings.reveal.openMaps') }}
            </a>

            <!-- host contact -->
            <div class="reveal-host">
              <div class="reveal-host-name">
                <strong>{{ contactByBooking[b.id]?.ownerName || t('bookings.reveal.host') }}</strong>
                <div v-if="contactByBooking[b.id]?.ownerPhone" class="t-sm muted">
                  {{ contactByBooking[b.id]?.ownerPhone }}
                </div>
              </div>
              <div v-if="contactByBooking[b.id]?.ownerPhone" class="reveal-host-acts">
                <a
                  :href="`tel:${contactByBooking[b.id]?.ownerPhone}`"
                  class="btn btn-secondary btn-sm"
                >
                  <svg
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    stroke-width="1.9"
                    stroke-linecap="round"
                    stroke-linejoin="round"
                    aria-hidden="true"
                  >
                    <path
                      d="M22 16.92v3a2 2 0 0 1-2.18 2A19.8 19.8 0 0 1 3.1 4.18 2 2 0 0 1 5.1 2h3a2 2 0 0 1 2 1.72c.13.96.36 1.9.7 2.81a2 2 0 0 1-.45 2.11L8.1 9.9a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45c.9.34 1.85.57 2.81.7A2 2 0 0 1 22 16.92Z"
                    />
                  </svg>
                  {{ t('bookings.reveal.call') }}
                </a>
                <a
                  :href="whatsappHref(contactByBooking[b.id]!.ownerPhone!)"
                  target="_blank"
                  rel="noopener"
                  class="btn btn-wa btn-sm"
                >
                  <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
                    <path
                      d="M19.05 4.91A9.82 9.82 0 0 0 12.04 2C6.58 2 2.13 6.45 2.13 11.91c0 1.75.46 3.45 1.32 4.95L2 22l5.25-1.38a9.9 9.9 0 0 0 4.79 1.22c5.46 0 9.91-4.45 9.91-9.91 0-2.65-1.03-5.14-2.9-7.02z"
                    />
                  </svg>
                  {{ t('bookings.reveal.whatsapp') }}
                </a>
              </div>
            </div>

            <!-- cash reminder -->
            <div class="reveal-cash">
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
              {{ t('bookings.totalOnPlace', { total: formatMad(b.totalEstimateMad, locale) }) }} ·
              {{ t('bookings.reveal.cashReminder') }}
            </div>

            <div class="bcard-acts" style="margin-top: 0.8rem; padding: 0">
              <PButton variant="destructive" size="sm" block @click="askCancel(b)">
                {{ t('bookings.cancel.action') }}
              </PButton>
            </div>
          </template>

          <!-- locked / loading / error fallbacks -->
          <p v-else-if="contactPendingId === b.id" class="reveal-locked">
            {{ t('bookings.reveal.locked') }}
          </p>
          <p v-else-if="contactErrorId === b.id" class="reveal-locked">
            {{ t('bookings.reveal.error') }}
          </p>
          <p v-else class="reveal-locked">{{ t('bookings.reveal.locked') }}</p>
        </div>

        <!-- DECLINED · reason -->
        <div v-else-if="b.status === 'declined'" class="decline">
          <svg
            viewBox="0 0 24 24"
            fill="none"
            stroke="var(--ink-muted)"
            stroke-width="2"
            stroke-linecap="round"
            stroke-linejoin="round"
            aria-hidden="true"
          >
            <path d="M7.9 20A9 9 0 1 0 4 16.1L2 22Z" />
          </svg>
          <span class="t-sm">
            <template v-if="b.declineReason">{{ t('bookings.declineReason', { reason: b.declineReason }) }}</template>
            <template v-else>{{ t('bookings.declinedNoReason') }}</template>
          </span>
        </div>
      </article>
    </div>

    <!-- cancel confirm dialog -->
    <PModal v-model:open="cancelOpen" :title="t('bookings.cancel.title')">
      <p class="t-body muted">{{ t('bookings.cancel.body') }}</p>
      <p v-if="cancelError" class="hint-err" style="margin-top: 0.7rem">{{ t(cancelError) }}</p>
      <template #footer>
        <PButton variant="ghost" :disabled="cancelPending" @click="cancelOpen = false">
          {{ t('bookings.cancel.keep') }}
        </PButton>
        <PButton variant="destructive" :loading="cancelPending" @click="confirmCancel">
          {{ t('bookings.cancel.confirm') }}
        </PButton>
      </template>
    </PModal>
  </div>
</template>

<style scoped>
.bookings {
  max-width: 760px;
  margin-inline: auto;
}

/* tabs */
.tabs {
  display: flex;
  gap: 0.2rem;
  border-bottom: 1px solid var(--line);
  margin-top: 1rem;
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
.bcard-sk {
  height: 150px;
  border-radius: var(--r-2xl);
  background: linear-gradient(100deg, var(--sand-2) 30%, #fff 50%, var(--sand-2) 70%);
  background-size: 200% 100%;
  animation: shimmer 1.4s infinite;
}
@keyframes shimmer {
  to {
    background-position: -200% 0;
  }
}
.bcard {
  background: #fff;
  border: 1px solid var(--line);
  border-radius: var(--r-2xl);
  box-shadow: var(--sh-sm);
  overflow: hidden;
}
.bcard-main {
  display: flex;
  gap: 0.85rem;
  padding: 0.85rem;
}
.bcard-thumb {
  width: 88px;
  height: 88px;
  border-radius: var(--r-lg);
  object-fit: cover;
  flex: none;
  background: var(--sand-2);
}
.bcard-thumb-empty {
  background: var(--sand-2);
}
.bcard-info {
  flex: 1;
  min-width: 0;
}
.bcard-top {
  display: flex;
  justify-content: space-between;
  gap: 0.5rem;
  align-items: start;
}
.bcard-title {
  font-size: 1rem;
  line-height: 1.25;
}
.bmeta {
  display: flex;
  align-items: center;
  gap: 0.4rem;
  color: var(--ink-muted);
  font-size: 0.85rem;
  margin-top: 0.35rem;
}
.bmeta svg {
  width: 15px;
  height: 15px;
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

/* actions */
.bcard-acts {
  display: flex;
  gap: 0.5rem;
  padding: 0 0.85rem 0.85rem;
  flex-wrap: wrap;
}

/* pending */
.pending-bar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 0.6rem;
  padding: 0 0.85rem 0.6rem;
}
.countdown {
  display: inline-flex;
  align-items: center;
  gap: 0.35rem;
  font-size: 0.78rem;
  font-weight: 700;
  color: var(--amber-ink);
  background: var(--amber-soft);
  padding: 0.28rem 0.55rem;
  border-radius: var(--r-pill);
  white-space: nowrap;
}
.countdown svg {
  width: 13px;
  height: 13px;
}

/* accepted reveal */
.reveal {
  border-top: 1px solid var(--line);
  padding: 0.95rem 0.85rem;
  background: linear-gradient(180deg, var(--aqua-50), #fff 60%);
}
.reveal-addr {
  display: flex;
  gap: 0.6rem;
  align-items: flex-start;
}
.reveal-addr svg {
  width: 20px;
  height: 20px;
  flex: none;
  margin-top: 1px;
}
.reveal-host {
  display: flex;
  align-items: center;
  gap: 0.7rem;
  flex-wrap: wrap;
  margin-top: 1rem;
  padding-top: 0.9rem;
  border-top: 1px solid var(--line);
}
.reveal-host-name {
  flex: 1;
  min-width: 0;
}
.reveal-host-acts {
  display: flex;
  gap: 0.5rem;
}
.reveal-cash {
  display: flex;
  align-items: center;
  gap: 0.4rem;
  margin-top: 0.9rem;
  font-size: 0.82rem;
  font-weight: 600;
  color: var(--amber-ink);
}
.reveal-cash svg {
  width: 15px;
  height: 15px;
  flex: none;
}
.reveal-locked {
  font-size: 0.85rem;
  color: var(--ink-muted);
}

/* declined */
.decline {
  display: flex;
  gap: 0.5rem;
  align-items: flex-start;
  margin: 0 0.85rem 0.85rem;
  background: var(--sand-2);
  border-radius: var(--r-lg);
  padding: 0.6rem 0.8rem;
}
.decline svg {
  width: 16px;
  height: 16px;
  flex: none;
  margin-top: 1px;
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
