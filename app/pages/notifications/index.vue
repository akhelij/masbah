<script setup lang="ts">
import type { NotificationRow, NotificationType } from '~/composables/useNotifications'
import type { SlotKey } from '~/types/db'

definePageMeta({ middleware: 'auth', layout: 'dashboard' })

const { t, locale } = useI18n()
const localePath = useLocalePath()

useSeoMeta({
  title: () => `${t('notifications.seoTitle')} · Masbah`,
  robots: 'noindex',
})

const {
  notifications,
  unreadCount,
  pending,
  error,
  markRead,
  markAllRead,
  subscribe,
  unsubscribe,
  refresh,
} = useNotifications()

onMounted(subscribe)
onUnmounted(unsubscribe)

// ── Per-type visuals ─────────────────────────────────────────────────────────
type IconKey = 'request' | 'accepted' | 'declined' | 'expired' | 'reminder' | 'review' | 'system'
const TYPE_ICON: Record<NotificationType, IconKey> = {
  new_request: 'request',
  request_accepted: 'accepted',
  request_declined: 'declined',
  request_expired: 'expired',
  visit_reminder: 'reminder',
  new_review: 'review',
  system: 'system',
}
// [background, foreground] color tokens per icon key.
const ICON_COLORS: Record<IconKey, [string, string]> = {
  request: ['var(--aqua-50)', 'var(--aqua-700)'],
  accepted: ['var(--success-soft)', 'var(--success)'],
  declined: ['var(--sand-2)', 'var(--ink-muted)'],
  expired: ['var(--sand-2)', 'var(--ink-muted)'],
  reminder: ['var(--amber-soft)', 'var(--amber-ink)'],
  review: ['var(--amber-soft)', 'var(--amber)'],
  system: ['var(--coral-soft)', 'var(--coral-deep)'],
}

// ── Slot labels (for sentence interpolation) ─────────────────────────────────
const SLOT_LABELS: Record<SlotKey, string> = {
  morning: 'slots.morning',
  afternoon: 'slots.afternoon',
  evening: 'slots.evening',
  full_day: 'slots.fullDay',
}
function slotText(slot: string | undefined): string {
  if (slot && slot in SLOT_LABELS) return t(SLOT_LABELS[slot as SlotKey])
  return ''
}
function dateText(iso: string | undefined): string {
  if (!iso) return ''
  const [y, m, d] = iso.split('-').map(Number)
  if (!y || !m || !d) return iso
  return new Date(y, m - 1, d).toLocaleDateString(locale.value === 'ar' ? 'ar-MA' : 'fr-MA', {
    day: 'numeric',
    month: 'short',
  })
}

// ── Title + body sentence from type + payload ────────────────────────────────
function poolText(n: NotificationRow): string {
  return n.payload.pool_title || t('notifications.thePool')
}
function notifTitle(n: NotificationRow): string {
  return t(`notifications.types.${n.type}.title`)
}
function notifBody(n: NotificationRow): string {
  const p = n.payload
  const params = {
    pool: poolText(n),
    date: dateText(p.date),
    slot: slotText(p.slot),
    reason: p.reason ?? '',
  }
  switch (n.type) {
    case 'new_request':
      return t('notifications.types.new_request.body', params)
    case 'request_accepted':
      return t('notifications.types.request_accepted.body', params)
    case 'request_declined':
      return p.reason
        ? t('notifications.types.request_declined.bodyReason', params)
        : t('notifications.types.request_declined.body', params)
    case 'request_expired':
      return t('notifications.types.request_expired.body', params)
    case 'visit_reminder':
      return t('notifications.types.visit_reminder.body', params)
    case 'new_review':
      return t('notifications.types.new_review.body', params)
    case 'system':
      if (p.event === 'booking_cancelled')
        return t('notifications.types.system.bookingCancelled', params)
      return t('notifications.types.system.body', params)
    default:
      return ''
  }
}

// Where tapping a notification leads. Owner-side events → /demandes; renter-side
// events (and reminders) → /bookings; reviews → owner listings.
function notifLink(n: NotificationRow): string {
  switch (n.type) {
    case 'new_request':
      return localePath('/demandes')
    case 'request_accepted':
    case 'request_declined':
    case 'request_expired':
    case 'visit_reminder':
      return localePath('/bookings')
    case 'new_review':
      return localePath('/annonces')
    case 'system':
      return n.payload.event === 'booking_cancelled'
        ? localePath('/demandes')
        : localePath('/bookings')
    default:
      return localePath('/bookings')
  }
}

// ── Relative time ────────────────────────────────────────────────────────────
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
    if (Math.abs(duration) < division.amount) return rtf.format(Math.round(duration), division.unit)
    duration /= division.amount
  }
  return ''
}

// ── Grouping: unread first, then read ────────────────────────────────────────
const unread = computed(() => notifications.value.filter((n) => n.read_at == null))
const read = computed(() => notifications.value.filter((n) => n.read_at != null))

// Mark a notification read, then navigate to its target.
async function openNotification(n: NotificationRow): Promise<void> {
  if (n.read_at == null) await markRead(n.id)
  await navigateTo(notifLink(n))
}
</script>

<template>
  <div class="notifs">
    <header class="nf-head">
      <h1 class="t-h1">{{ t('notifications.title') }}</h1>
      <PButton v-if="unreadCount" variant="ghost" size="sm" @click="markAllRead">
        <template #icon>
          <svg
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            stroke-width="2"
            stroke-linecap="round"
            stroke-linejoin="round"
            aria-hidden="true"
          >
            <path d="M20 6 9 17l-5-5" />
          </svg>
        </template>
        {{ t('notifications.markAll') }}
      </PButton>
    </header>

    <!-- error -->
    <div v-if="error" class="state-msg">
      <p class="t-body muted">{{ t('notifications.error') }}</p>
      <PButton variant="secondary" size="sm" style="margin-top: 0.8rem" @click="refresh()">
        {{ t('common.retry') }}
      </PButton>
    </div>

    <!-- skeleton -->
    <div v-else-if="pending" class="list">
      <div v-for="i in 4" :key="i" class="skel nf-sk" />
    </div>

    <!-- empty -->
    <div v-else-if="!notifications.length" class="empty">
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
          <path d="M18 8a6 6 0 0 0-12 0c0 7-3 9-3 9h18s-3-2-3-9" />
          <path d="M13.7 21a2 2 0 0 1-3.4 0" />
          <path d="m4 4 16 16" opacity=".5" />
        </svg>
      </span>
      <h2 class="t-h3" style="margin-top: 1rem">{{ t('notifications.empty.title') }}</h2>
      <p class="t-body muted" style="max-width: 26rem; margin: 0.5rem auto 0">
        {{ t('notifications.empty.body') }}
      </p>
      <NuxtLink
        :to="localePath('/search')"
        class="btn btn-primary btn-lg"
        style="margin-top: 1.2rem"
      >
        {{ t('notifications.empty.cta') }}
      </NuxtLink>
    </div>

    <!-- list -->
    <template v-else>
      <template v-for="group in ['unread', 'read'] as const" :key="group">
        <template v-if="(group === 'unread' ? unread : read).length">
          <div class="daygroup">{{ t(`notifications.groups.${group}`) }}</div>
          <div class="list">
            <button
              v-for="n in group === 'unread' ? unread : read"
              :key="n.id"
              type="button"
              class="nitem"
              :class="{ unread: n.read_at == null }"
              @click="openNotification(n)"
            >
              <span
                class="nicon"
                :style="{
                  background: ICON_COLORS[TYPE_ICON[n.type]][0],
                  color: ICON_COLORS[TYPE_ICON[n.type]][1],
                }"
                aria-hidden="true"
              >
                <!-- request -->
                <svg
                  v-if="TYPE_ICON[n.type] === 'request'"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  stroke-width="2"
                  stroke-linecap="round"
                  stroke-linejoin="round"
                >
                  <path d="M22 12h-5l-1.5 3h-7L7 12H2" />
                  <path
                    d="M5.4 5.1 2 12v6a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2v-6l-3.4-6.9A2 2 0 0 0 16.8 4H7.2a2 2 0 0 0-1.8 1.1Z"
                  />
                </svg>
                <!-- accepted -->
                <svg
                  v-else-if="TYPE_ICON[n.type] === 'accepted'"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  stroke-width="2.2"
                  stroke-linecap="round"
                  stroke-linejoin="round"
                >
                  <path d="M20 6 9 17l-5-5" />
                </svg>
                <!-- declined -->
                <svg
                  v-else-if="TYPE_ICON[n.type] === 'declined'"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  stroke-width="2"
                  stroke-linecap="round"
                  stroke-linejoin="round"
                >
                  <circle cx="12" cy="12" r="9" />
                  <path d="M15 9l-6 6M9 9l6 6" />
                </svg>
                <!-- expired -->
                <svg
                  v-else-if="TYPE_ICON[n.type] === 'expired'"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  stroke-width="2"
                  stroke-linecap="round"
                  stroke-linejoin="round"
                >
                  <circle cx="12" cy="12" r="9" />
                  <path d="M12 8v4l3 2" />
                </svg>
                <!-- reminder -->
                <svg
                  v-else-if="TYPE_ICON[n.type] === 'reminder'"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  stroke-width="2"
                  stroke-linecap="round"
                  stroke-linejoin="round"
                >
                  <path d="M18 8a6 6 0 0 0-12 0c0 7-3 9-3 9h18s-3-2-3-9" />
                  <path d="M13.7 21a2 2 0 0 1-3.4 0" />
                </svg>
                <!-- review -->
                <svg
                  v-else-if="TYPE_ICON[n.type] === 'review'"
                  viewBox="0 0 24 24"
                  fill="currentColor"
                >
                  <path
                    d="m12 2 3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01z"
                  />
                </svg>
                <!-- system -->
                <svg
                  v-else
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  stroke-width="2"
                  stroke-linecap="round"
                  stroke-linejoin="round"
                >
                  <circle cx="12" cy="12" r="9" />
                  <path d="M12 16v-4M12 8h.01" />
                </svg>
              </span>

              <div class="nbody">
                <div class="ntop">
                  <strong class="ntitle">
                    <span v-if="n.read_at == null" class="ndot" aria-hidden="true" />
                    {{ notifTitle(n) }}
                  </strong>
                  <span class="t-sm faint nntime">{{ timeAgo(n.created_at) }}</span>
                </div>
                <p class="t-sm nmsg">{{ notifBody(n) }}</p>
              </div>
            </button>
          </div>
        </template>
      </template>
    </template>
  </div>
</template>

<style scoped>
.notifs {
  max-width: 760px;
  margin-inline: auto;
}
.nf-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 1rem;
}

/* group label */
.daygroup {
  font-size: 0.74rem;
  font-weight: 800;
  letter-spacing: 0.06em;
  text-transform: uppercase;
  color: var(--ink-muted);
  margin: 1.4rem 0 0.6rem;
  padding-inline: 0.2rem;
}

/* list */
.list {
  display: flex;
  flex-direction: column;
  gap: 0.6rem;
}
.nf-sk {
  height: 74px;
  border-radius: var(--r-xl);
}
.nitem {
  position: relative;
  width: 100%;
  text-align: start;
  background: #fff;
  border: 1px solid var(--line);
  border-radius: var(--r-xl);
  padding: 0.9rem;
  display: flex;
  gap: 0.8rem;
  cursor: pointer;
  transition:
    border-color var(--dur-1),
    background-color var(--dur-1);
}
.nitem:hover {
  border-color: var(--aqua-300);
}
.nitem:focus-visible {
  outline: none;
  box-shadow: var(--focus);
}
.nitem.unread {
  background: var(--aqua-50);
  border-color: var(--aqua-200);
}
.nicon {
  width: 42px;
  height: 42px;
  border-radius: var(--r-md);
  display: grid;
  place-items: center;
  flex: none;
}
.nicon svg {
  width: 21px;
  height: 21px;
}
.nbody {
  flex: 1;
  min-width: 0;
}
.ntop {
  display: flex;
  justify-content: space-between;
  gap: 0.5rem;
  align-items: baseline;
}
.ntitle {
  font-size: 0.92rem;
}
.ndot {
  display: inline-block;
  width: 8px;
  height: 8px;
  border-radius: 99px;
  background: var(--coral-deep);
  margin-inline-end: 0.4rem;
}
.nntime {
  flex: none;
}
.nmsg {
  margin-top: 0.2rem;
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
