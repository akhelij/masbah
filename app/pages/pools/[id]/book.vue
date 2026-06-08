<script setup lang="ts">
import type { SlotKey } from '~/types/db'

definePageMeta({ middleware: 'auth', layout: 'dashboard' })

const route = useRoute()
const { t, locale } = useI18n()
const localePath = useLocalePath()

const id = computed(() => String(route.params.id))
const { detail, pending } = usePool(id)

useSeoMeta({
  title: () => `${t('book.seoTitle')} · Masbah`,
  robots: 'noindex',
})

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

// ── Step machine ──────────────────────────────────────────────────────────
type Step = 1 | 2 | 3
const step = ref<Step>(1)
const submitted = ref(false)

const TOTAL_STEPS = 3
const stepTitle = computed(() => {
  if (step.value === 1) return t('book.step1.title')
  if (step.value === 2) return t('book.step2.title')
  return t('book.step3.title')
})

// ── Form state ────────────────────────────────────────────────────────────
const date = ref<string>('')
const selectedSlot = ref<string | undefined>(undefined)
const guests = ref(2)
const selectedExtraKeys = ref<string[]>([])
const message = ref('')

const maxGuests = computed(() => detail.value?.pool.max_guests ?? 1)
// Keep guests within the pool capacity once the pool loads.
watch(maxGuests, (max) => {
  if (guests.value > max) guests.value = Math.max(1, max)
})

// Default the slot to the first enabled one.
watch(
  () => detail.value?.slots,
  (slots) => {
    if (slots && slots.length && !selectedSlot.value) selectedSlot.value = slots[0]?.slot
  },
  { immediate: true }
)

// ── Availability (grey out blocked slots for the chosen date) ─────────────
const { availability } = usePoolDayAvailability(id, date)
const slotEnabledMap = computed(() =>
  slotAvailability(detail.value, date.value || null, availability.value.acceptedSlots)
)

interface SlotChoice {
  key: SlotKey
  label: string
  sub: string
  price: number
  available: boolean
}
const slotChoices = computed<SlotChoice[]>(() =>
  (detail.value?.slots ?? []).map((s) => ({
    key: s.slot,
    label: t(SLOT_LABELS[s.slot]),
    sub: t(SLOT_SUBS[s.slot]),
    price: s.price_mad,
    available: date.value ? slotEnabledMap.value[s.slot] : true,
  }))
)
const dayBlocked = computed(() => Boolean(date.value) && availability.value.dayBlocked)

// If the currently selected slot becomes unavailable for the chosen date, drop it.
watch([slotEnabledMap, date], () => {
  if (!date.value || !selectedSlot.value) return
  if (!slotEnabledMap.value[selectedSlot.value as SlotKey]) selectedSlot.value = undefined
})

function pickSlot(choice: SlotChoice): void {
  if (!choice.available) return
  selectedSlot.value = choice.key
}

// ── Paid extras (amenities with a price > 0, not included) ─────────────────
const paidExtras = computed(() =>
  (detail.value?.pool.amenities ?? []).filter((a) => !a.included && a.price > 0)
)
function amenityLabel(label_fr: string, label_ar: string): string {
  return locale.value === 'ar' ? label_ar : label_fr
}
function toggleExtra(key: string): void {
  const i = selectedExtraKeys.value.indexOf(key)
  if (i >= 0) selectedExtraKeys.value.splice(i, 1)
  else selectedExtraKeys.value.push(key)
}

// ── Live price ────────────────────────────────────────────────────────────
const price = useBookingPrice(
  () => detail.value,
  selectedSlot,
  date,
  guests,
  selectedExtraKeys
)

// ── Derived display ───────────────────────────────────────────────────────
const selectedSlotRow = computed(
  () => detail.value?.slots.find((s) => s.slot === selectedSlot.value) ?? null
)
function formatLongDate(iso: string): string {
  if (!iso) return ''
  const [y, m, d] = iso.split('-').map(Number)
  if (!y || !m || !d) return iso
  return new Date(y, m - 1, d).toLocaleDateString(locale.value === 'ar' ? 'ar-MA' : 'fr-MA', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  })
}
const slotLabelFull = computed(() => {
  const row = selectedSlotRow.value
  if (!row) return ''
  return `${t(SLOT_LABELS[row.slot])} · ${t(SLOT_SUBS[row.slot])}`
})
const ownerName = computed(() => detail.value?.owner?.full_name?.trim() || t('pool.owner.title'))
const locationLine = computed(() => {
  const n = detail.value?.pool.neighborhood
  const c = detail.value?.cityName ?? ''
  return n ? `${n} · ${c}` : c
})

// ── Step gating ───────────────────────────────────────────────────────────
const canContinue = computed(() => {
  if (step.value === 1) {
    return Boolean(date.value) && !dayBlocked.value && Boolean(selectedSlot.value)
  }
  return true
})

// ── Submit ────────────────────────────────────────────────────────────────
const { submit, pending: submitPending } = useCreateBooking()
const submitError = ref<string | null>(null)

function goNext(): void {
  if (step.value === 1) {
    if (!canContinue.value) return
    step.value = 2
  } else if (step.value === 2) {
    step.value = 3
  } else {
    void onSubmit()
  }
  scrollTop()
}
function goBack(): void {
  if (step.value > 1) {
    step.value = (step.value - 1) as Step
    scrollTop()
  }
}
function scrollTop(): void {
  if (import.meta.client) window.scrollTo({ top: 0, behavior: 'auto' })
}

async function onSubmit(): Promise<void> {
  const pool = detail.value
  if (!pool || !selectedSlot.value || !date.value) return
  submitError.value = null

  const extras = toBookingExtras(pool.pool.amenities, selectedExtraKeys.value)
  const result = await submit({
    poolId: id.value,
    date: date.value,
    slot: selectedSlot.value as SlotKey,
    guests: guests.value,
    extras,
    message: message.value,
    totalEstimate: price.value.total,
  })

  if (result.error) {
    submitError.value = t(result.error)
    return
  }
  submitted.value = true
  scrollTop()
}
</script>

<template>
  <div class="book">
    <!-- ░░ NOT FOUND ░░ -->
    <div v-if="!detail && !pending" class="notfound">
      <h1 class="t-h2">{{ t('book.notFoundTitle') }}</h1>
      <p class="t-body muted" style="margin-top: 0.5rem; max-width: 42ch">
        {{ t('book.notFoundBody') }}
      </p>
      <NuxtLink :to="localePath('/search')" class="btn btn-primary" style="margin-top: 1.4rem">
        {{ t('bookings.empty.cta') }}
      </NuxtLink>
    </div>

    <!-- ░░ SKELETON ░░ -->
    <div v-else-if="pending" class="sk-wrap">
      <div class="skel" style="height: 22px; width: 40%" />
      <div class="skel" style="height: 320px; margin-top: 1.2rem; border-radius: var(--r-2xl)" />
    </div>

    <!-- ░░ SUCCESS ░░ -->
    <div v-else-if="submitted" class="success">
      <div class="burst-ok" aria-hidden="true">
        <svg
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          stroke-width="2.4"
          stroke-linecap="round"
          stroke-linejoin="round"
        >
          <path d="M20 6 9 17l-5-5" />
        </svg>
      </div>
      <h1 class="t-h2" style="margin-top: 1rem">{{ t('book.success.title') }}</h1>
      <p class="t-body muted success-body">{{ t('book.success.body') }}</p>

      <div class="cash-callout success-cash">
        <span class="cash-emoji" aria-hidden="true">💵</span>
        <span>{{ t('book.cashOnPlace') }}</span>
      </div>

      <div class="success-locked">
        <svg
          viewBox="0 0 24 24"
          fill="none"
          stroke="var(--aqua-700)"
          stroke-width="2"
          stroke-linecap="round"
          stroke-linejoin="round"
          aria-hidden="true"
        >
          <rect x="3" y="11" width="18" height="11" rx="2" />
          <path d="M7 11V7a5 5 0 0 1 10 0v4" />
        </svg>
        <div>
          <strong class="t-sm">{{ t('book.success.lockedTitle') }}</strong>
          <p class="t-sm muted" style="margin-top: 0.2rem">{{ t('book.success.lockedBody') }}</p>
        </div>
      </div>

      <div class="success-actions">
        <NuxtLink :to="localePath('/bookings')" class="btn btn-primary btn-lg btn-block">
          {{ t('book.success.viewBookings') }}
        </NuxtLink>
        <NuxtLink :to="localePath(`/pools/${id}`)" class="btn btn-ghost btn-block">
          {{ t('book.success.viewListing') }}
        </NuxtLink>
      </div>
    </div>

    <!-- ░░ FLOW ░░ -->
    <template v-else-if="detail">
      <div class="flow-head">
        <NuxtLink :to="localePath(`/pools/${id}`)" class="back-link">
          <svg
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            stroke-width="2"
            stroke-linecap="round"
            stroke-linejoin="round"
            aria-hidden="true"
          >
            <path d="m15 18-6-6 6-6" />
          </svg>
          {{ t('book.backToListing') }}
        </NuxtLink>
        <div class="step-count">{{ t('book.stepCount', { current: step, total: TOTAL_STEPS }) }}</div>
        <h1 class="t-h2 flow-title">{{ stepTitle }}</h1>
        <div class="progress-seg" aria-hidden="true">
          <span :class="{ fill: step >= 1 }"><i /></span>
          <span :class="{ fill: step >= 2 }"><i /></span>
          <span :class="{ fill: step >= 3 }"><i /></span>
        </div>
        <!-- 💵 Paiement sur place — visible on every step -->
        <div class="cash-pill">
          <span aria-hidden="true">💵</span>{{ t('common.cashOnPlace') }}
        </div>
      </div>

      <div class="flow-body">
        <!-- STEP 1 · DATE & CRÉNEAU -->
        <section v-show="step === 1">
          <PDatePicker v-model="date" :label="t('book.step1.dateLabel')" />

          <p v-if="dayBlocked" class="blocked-note">
            <svg
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              stroke-width="2"
              stroke-linecap="round"
              aria-hidden="true"
            >
              <circle cx="12" cy="12" r="9" />
              <path d="M12 8v5M12 16.5v.01" />
            </svg>
            {{ t('book.step1.dayBlocked') }}
          </p>

          <div class="field-label">{{ t('book.step1.slotLabel') }}</div>
          <div v-if="slotChoices.length" class="seg slot-seg" role="tablist">
            <button
              v-for="c in slotChoices"
              :key="c.key"
              class="seg-item"
              :class="{ 'is-on': selectedSlot === c.key, 'is-off': !c.available }"
              type="button"
              role="tab"
              :aria-selected="selectedSlot === c.key"
              :disabled="!c.available"
              @click="pickSlot(c)"
            >
              <span class="lab">{{ c.label }}</span>
              <span class="sub">{{ c.available ? formatMad(c.price, locale) : t('book.step1.slotTaken') }}</span>
            </button>
          </div>
          <p v-else class="t-sm muted">{{ t('book.step1.noSlots') }}</p>
          <p v-if="!date" class="t-sm muted" style="margin-top: 0.7rem">{{ t('book.step1.pickDate') }}</p>
        </section>

        <!-- STEP 2 · INVITÉS & EXTRAS -->
        <section v-show="step === 2">
          <div class="guests-row">
            <div>
              <div class="field-label" style="margin: 0">{{ t('book.step2.guestsLabel') }}</div>
              <div class="t-sm muted">{{ t('book.step2.guestsCap', { count: maxGuests }) }}</div>
            </div>
            <PCounter
              v-model="guests"
              :min="1"
              :max="maxGuests"
              :aria-label="t('book.step2.guestsLabel')"
            />
          </div>
          <p v-if="guests >= maxGuests" class="guests-max">
            <svg
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              stroke-width="2"
              stroke-linecap="round"
              aria-hidden="true"
            >
              <circle cx="12" cy="12" r="9" />
              <path d="M12 8v5M12 16.5v.01" />
            </svg>
            {{ t('book.step2.guestsMax') }}
          </p>

          <div class="field-label">
            {{ t('book.step2.extrasLabel') }}
            <span class="muted" style="font-weight: 400">· {{ t('book.step2.extrasPaid') }}</span>
          </div>
          <div v-if="paidExtras.length" class="extras">
            <button
              v-for="a in paidExtras"
              :key="a.key"
              class="x-row"
              :class="{ 'is-on': selectedExtraKeys.includes(a.key) }"
              type="button"
              :aria-pressed="selectedExtraKeys.includes(a.key)"
              @click="toggleExtra(a.key)"
            >
              <span class="x-left">
                <span class="x-check" :class="{ 'is-on': selectedExtraKeys.includes(a.key) }">
                  <svg
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    stroke-width="3"
                    stroke-linecap="round"
                    aria-hidden="true"
                  >
                    <path d="m5 12 5 5L20 6" />
                  </svg>
                </span>
                <span>{{ amenityLabel(a.label_fr, a.label_ar) }}</span>
              </span>
              <span class="x-price">
                +{{ formatMad(a.price, locale) }}<template v-if="a.per_person"> {{ t('book.step2.perPerson') }}</template>
              </span>
            </button>
          </div>
          <p v-else class="t-sm muted">{{ t('book.step2.extrasNone') }}</p>

          <div class="field-label">{{ t('book.step2.messageLabel') }}</div>
          <textarea
            v-model="message"
            class="ta"
            :placeholder="t('book.step2.messagePlaceholder')"
          />
          <p class="t-sm muted message-hint">{{ t('book.step2.messageHint') }}</p>
        </section>

        <!-- STEP 3 · RÉCAPITULATIF -->
        <section v-show="step === 3">
          <div class="recap-pool">
            <NuxtImg
              v-if="detail.coverUrl"
              :src="detail.coverUrl"
              :alt="detail.pool.title"
              width="64"
              height="64"
              format="webp"
              class="recap-thumb"
            />
            <div v-else class="recap-thumb recap-thumb-empty" aria-hidden="true" />
            <div style="min-width: 0">
              <strong>{{ detail.pool.title }}</strong>
              <div class="t-sm muted">{{ locationLine }} · {{ t('book.step3.host', { name: ownerName }) }}</div>
            </div>
          </div>

          <div class="recap">
            <div class="recap-row">
              <span class="muted">{{ t('book.step3.date') }}</span>
              <strong>{{ formatLongDate(date) }}</strong>
            </div>
            <div class="recap-row">
              <span class="muted">{{ t('book.step3.slot') }}</span>
              <strong>{{ slotLabelFull }}</strong>
            </div>
            <div class="recap-row">
              <span class="muted">{{ t('book.step3.guests') }}</span>
              <strong>{{ t('book.step3.guestsValue', { count: guests }) }}</strong>
            </div>
            <div class="recap-row">
              <span class="muted">{{ t('book.step3.extras') }}</span>
              <span class="recap-extras">
                <template v-if="price.lines.some((l) => l.kind === 'extra')">
                  <span v-for="l in price.lines.filter((x) => x.kind === 'extra')" :key="l.key">
                    {{ amenityLabel(
                      paidExtras.find((a) => a.key === l.key)?.label_fr ?? l.key,
                      paidExtras.find((a) => a.key === l.key)?.label_ar ?? l.key
                    ) }}
                    +{{ formatMad(l.amount, locale) }}
                  </span>
                </template>
                <template v-else>{{ t('book.step3.extrasNone') }}</template>
              </span>
            </div>
            <div v-if="price.weekendPremium > 0" class="recap-row">
              <span class="muted">{{ t('book.step3.weekendPremium', { pct: price.weekendPct }) }}</span>
              <strong>+{{ formatMad(price.weekendPremium, locale) }}</strong>
            </div>
            <div class="recap-row recap-total">
              <span>{{ t('book.step3.total') }}</span>
              <strong>{{ formatMad(price.total, locale) }}</strong>
            </div>
          </div>

          <!-- 💵 cash callout -->
          <div class="cash-callout">
            <span class="cash-emoji" aria-hidden="true">💵</span>
            <span>{{ t('book.cashOnPlace') }}</span>
          </div>
          <p class="t-sm muted request-note">{{ t('book.step3.requestNote') }}</p>

          <p v-if="submitError" class="hint-err submit-error">
            <svg
              viewBox="0 0 24 24"
              width="14"
              height="14"
              fill="none"
              stroke="currentColor"
              stroke-width="2"
              stroke-linecap="round"
              aria-hidden="true"
            >
              <circle cx="12" cy="12" r="9" />
              <path d="M12 8v5M12 16.5v.01" />
            </svg>
            {{ submitError }}
          </p>
        </section>
      </div>

      <!-- STICKY FOOTER · total + nav -->
      <footer class="flow-foot">
        <div class="foot-total">
          <div class="muted t-sm">{{ t('book.totalEstimate') }}</div>
          <strong class="foot-amount">{{ formatMad(price.total, locale) }}</strong>
        </div>
        <div class="foot-actions">
          <PButton v-if="step > 1" variant="ghost" @click="goBack">
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
                <path d="m15 18-6-6 6-6" />
              </svg>
            </template>
            {{ t('book.back') }}
          </PButton>
          <PButton
            size="lg"
            class="foot-next"
            :disabled="!canContinue"
            :loading="submitPending"
            @click="goNext"
          >
            {{ step === 3 ? t('book.submit') : t('book.continue') }}
          </PButton>
        </div>
      </footer>
    </template>
  </div>
</template>

<style scoped>
.book {
  max-width: 600px;
  margin-inline: auto;
  padding-bottom: calc(96px + env(safe-area-inset-bottom));
}

/* not found / skeleton */
.notfound {
  text-align: center;
  display: flex;
  flex-direction: column;
  align-items: center;
  padding-block: clamp(3rem, 8vw, 5rem);
}
.sk-wrap {
  padding-top: 1rem;
}
.skel {
  background: linear-gradient(100deg, var(--sand-2) 30%, #fff 50%, var(--sand-2) 70%);
  background-size: 200% 100%;
  border-radius: var(--r-md);
  animation: shimmer 1.4s infinite;
}
@keyframes shimmer {
  to {
    background-position: -200% 0;
  }
}

/* head */
.flow-head {
  padding-top: 0.4rem;
}
.back-link {
  display: inline-flex;
  align-items: center;
  gap: 0.3rem;
  font-size: 0.85rem;
  font-weight: 600;
  color: var(--ink-muted);
  margin-bottom: 0.8rem;
}
.back-link:hover {
  color: var(--aqua-700);
}
.back-link svg {
  width: 16px;
  height: 16px;
}
.step-count {
  font-size: 0.8125rem;
  font-weight: 700;
  color: var(--aqua-700);
}
.flow-title {
  margin-top: 0.15rem;
}
.progress-seg {
  display: flex;
  gap: 0.35rem;
  margin-top: 0.8rem;
}
.progress-seg span {
  height: 5px;
  border-radius: 99px;
  background: var(--sand-2);
  flex: 1;
  overflow: hidden;
}
.progress-seg span i {
  display: block;
  height: 100%;
  width: 0;
  background: var(--aqua-600);
  border-radius: 99px;
  transition: width var(--dur-3) var(--ease-water);
}
.progress-seg span.fill i {
  width: 100%;
}
.cash-pill {
  display: inline-flex;
  align-items: center;
  gap: 0.4rem;
  margin-top: 0.9rem;
  background: var(--amber-soft);
  color: var(--amber-ink);
  border-radius: var(--r-pill);
  padding: 0.4rem 0.75rem;
  font-size: 0.8rem;
  font-weight: 700;
}

/* body */
.flow-body {
  padding-top: 1.4rem;
}
.field-label {
  font-weight: 700;
  margin: 1.4rem 0 0.6rem;
}

/* step 1 */
.slot-seg {
  flex-wrap: wrap;
}
.slot-seg .seg-item {
  min-width: 5rem;
}
.seg-item.is-off {
  opacity: 0.45;
  cursor: not-allowed;
}
.seg-item.is-off .sub {
  text-decoration: line-through;
}
.blocked-note,
.guests-max {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  margin-top: 0.8rem;
  background: var(--amber-soft);
  color: var(--amber-ink);
  border-radius: var(--r-md);
  padding: 0.6rem 0.8rem;
  font-size: 0.84rem;
  font-weight: 600;
}
.blocked-note svg,
.guests-max svg {
  width: 16px;
  height: 16px;
  flex: none;
}

/* step 2 */
.guests-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 1rem;
}
.extras {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}
.x-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 0.7rem;
  padding: 0.7rem 0.85rem;
  border: 1.5px solid var(--line-strong);
  border-radius: var(--r-lg);
  cursor: pointer;
  transition: all var(--dur-1);
  background: #fff;
  text-align: start;
}
.x-row.is-on {
  border-color: var(--aqua-700);
  background: var(--aqua-50);
}
.x-left {
  display: flex;
  align-items: center;
  gap: 0.7rem;
}
.x-check {
  width: 24px;
  height: 24px;
  border-radius: 7px;
  border: 1.8px solid var(--line-strong);
  background: #fff;
  display: grid;
  place-items: center;
  flex: none;
  transition: all var(--dur-1);
}
.x-check svg {
  width: 16px;
  height: 16px;
  color: #fff;
  opacity: 0;
  transform: scale(0.6);
  transition: all var(--dur-1) var(--ease-water);
}
.x-check.is-on {
  background: var(--aqua-700);
  border-color: var(--aqua-700);
}
.x-check.is-on svg {
  opacity: 1;
  transform: scale(1);
}
.x-price {
  font-weight: 700;
  color: var(--aqua-800);
  font-size: 0.85rem;
  white-space: nowrap;
}
.ta {
  width: 100%;
  border: 1.5px solid var(--line-strong);
  border-radius: var(--r-md);
  padding: 0.8rem 0.9rem;
  font-family: inherit;
  font-size: 0.95rem;
  color: var(--ink);
  min-height: 104px;
  resize: vertical;
  line-height: 1.5;
}
.ta::placeholder {
  color: var(--ink-faint);
}
.ta:focus {
  outline: none;
  border-color: var(--aqua-500);
  box-shadow: var(--focus);
}
.message-hint {
  margin-top: 0.55rem;
}

/* step 3 */
.recap-pool {
  display: flex;
  gap: 0.8rem;
  align-items: center;
  background: #fff;
  border: 1px solid var(--line);
  border-radius: var(--r-lg);
  padding: 0.7rem;
  margin-bottom: 1rem;
}
.recap-thumb {
  width: 64px;
  height: 64px;
  border-radius: var(--r-md);
  object-fit: cover;
  flex: none;
}
.recap-thumb-empty {
  background: var(--sand-2);
}
.recap {
  background: #fff;
  border: 1px solid var(--line);
  border-radius: var(--r-lg);
  padding: 0.4rem 1rem 0.9rem;
}
.recap-row {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 1rem;
  padding: 0.55rem 0;
}
.recap-row + .recap-row {
  border-top: 1px solid var(--line-2);
}
.recap-row strong,
.recap-extras {
  text-align: end;
}
.recap-extras {
  font-weight: 600;
  display: flex;
  flex-direction: column;
  gap: 0.2rem;
}
.recap-total {
  border-top: 1.5px solid var(--line);
  margin-top: 0.3rem;
  padding-top: 0.8rem;
  align-items: center;
}
.recap-total span {
  font-weight: 800;
  font-size: 1.05rem;
}
.recap-total strong {
  font-size: 1.4rem;
}
.cash-callout {
  display: flex;
  gap: 0.6rem;
  align-items: flex-start;
  background: var(--amber-soft);
  border: 1px solid #f3e2b3;
  border-radius: var(--r-lg);
  padding: 0.85rem 0.95rem;
  color: var(--amber-ink);
  margin-top: 1rem;
  font-weight: 600;
  font-size: 0.9rem;
  line-height: 1.45;
}
.cash-emoji {
  font-size: 1.2rem;
  line-height: 1;
  flex: none;
}
.request-note {
  margin-top: 0.8rem;
}
.submit-error {
  margin-top: 0.9rem;
}

/* sticky footer */
.flow-foot {
  position: fixed;
  inset-inline: 0;
  bottom: 0;
  z-index: 45;
  background: #fff;
  border-top: 1px solid var(--line);
  box-shadow: 0 -8px 24px -12px rgba(15, 61, 76, 0.25);
  padding: 0.8rem 1rem calc(0.8rem + env(safe-area-inset-bottom));
  display: flex;
  align-items: center;
  gap: 0.9rem;
  max-width: 600px;
  margin-inline: auto;
}
.foot-total {
  flex: none;
  line-height: 1.1;
}
.foot-amount {
  font-size: 1.2rem;
}
.foot-actions {
  margin-inline-start: auto;
  display: flex;
  align-items: center;
  gap: 0.6rem;
}
.foot-next {
  min-width: 9rem;
}

/* On mobile the page sits above the app tab bar too. */
@media (max-width: 767px) {
  .flow-foot {
    bottom: calc(64px + env(safe-area-inset-bottom));
  }
}

/* success */
.success {
  text-align: center;
  display: flex;
  flex-direction: column;
  align-items: center;
  padding-block: clamp(1.5rem, 6vw, 3rem);
}
.burst-ok {
  width: 92px;
  height: 92px;
  border-radius: 50%;
  background: var(--success-soft);
  color: var(--success);
  display: grid;
  place-items: center;
}
.burst-ok svg {
  width: 46px;
  height: 46px;
}
.success-body {
  max-width: 34ch;
  margin: 0.5rem auto 0;
}
.success-cash {
  text-align: start;
  max-width: 30rem;
}
.success-locked {
  display: flex;
  gap: 0.7rem;
  align-items: flex-start;
  text-align: start;
  background: #fff;
  border: 1px solid var(--line);
  border-radius: var(--r-lg);
  padding: 0.95rem;
  margin-top: 0.8rem;
  max-width: 30rem;
}
.success-locked svg {
  width: 22px;
  height: 22px;
  flex: none;
  margin-top: 1px;
}
.success-actions {
  display: flex;
  flex-direction: column;
  gap: 0.6rem;
  margin-top: 1.2rem;
  width: 100%;
  max-width: 30rem;
}
</style>
