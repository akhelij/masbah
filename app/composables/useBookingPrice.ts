import type { Amenity, BlockedDate, PoolDetail, PoolSlot, SlotKey } from '~/types/db'

// ── Weekend rule ──────────────────────────────────────────────────────
//
// Moroccan weekend premium applies on FRIDAY, SATURDAY and SUNDAY.
//   • Saturday + Sunday are the official Moroccan rest days.
//   • Friday (Jumu'ah) is the main day off for many families and the
//     busiest pool-rental day, so hosts price it at the weekend rate too.
// This matches the "Fri/Sat/Sun" hint in the spec. `Date.getDay()` →
// Sunday = 0 … Saturday = 6, so the premium days are {5, 6, 0}.
const WEEKEND_DAYS = new Set<number>([5, 6, 0])

/** True when `dateIso` (YYYY-MM-DD) falls on the Moroccan weekend (Fri/Sat/Sun). */
export function isWeekend(dateIso: string | null | undefined): boolean {
  if (!dateIso) return false
  // Parse as a *local* date (not UTC) so the weekday matches the user's calendar.
  const [y, m, d] = dateIso.split('-').map((n) => Number(n))
  if (!y || !m || !d) return false
  const day = new Date(y, m - 1, d).getDay()
  return WEEKEND_DAYS.has(day)
}

/** Itemised line of the price breakdown shown in the récap. */
export interface PriceLine {
  /** Stable key: 'slot', 'weekend', or the amenity key for an extra. */
  key: string
  kind: 'slot' | 'weekend' | 'extra'
  amount: number
  /** Per-person extras carry the unit price + multiplier for display. */
  perPerson?: boolean
  unit?: number
  count?: number
}

/** Result of `useBookingPrice`. */
export interface BookingPrice {
  /** Base slot price in MAD (0 when no/unknown slot). */
  base: number
  /** Weekend premium amount in MAD (0 when not a weekend / no premium). */
  weekendPremium: number
  /** Premium percentage applied (for display), 0 when none. */
  weekendPct: number
  /** Sum of the selected paid extras in MAD. */
  extrasTotal: number
  /** Grand total estimate in MAD. */
  total: number
  /** Itemised lines (slot, optional weekend, each extra). */
  lines: PriceLine[]
}

function findSlot(pool: PoolDetail | null, slotKey: string | null | undefined): PoolSlot | null {
  if (!pool || !slotKey) return null
  return pool.slots.find((s) => s.slot === slotKey) ?? null
}

/**
 * Pure, reactive booking-price calculator.
 *
 * total = slot.price_mad
 *       + slot.price_mad × slot.weekend_premium_pct/100   (only Fri/Sat/Sun)
 *       + Σ paid extras (price, ×guests when per_person)
 *
 * All inputs may be refs/getters so the récap updates live. Rounded to whole
 * MAD (cash on arrival — no centimes).
 */
export function useBookingPrice(
  pool: MaybeRefOrGetter<PoolDetail | null>,
  slotKey: MaybeRefOrGetter<string | null | undefined>,
  date: MaybeRefOrGetter<string | null | undefined>,
  guests: MaybeRefOrGetter<number>,
  selectedExtraKeys: MaybeRefOrGetter<string[]>
) {
  return computed<BookingPrice>(() => {
    const p = toValue(pool)
    const slot = findSlot(p, toValue(slotKey))
    const dateIso = toValue(date)
    const g = Math.max(1, Math.round(toValue(guests) || 1))
    const extraKeys = new Set(toValue(selectedExtraKeys) ?? [])

    const lines: PriceLine[] = []

    const base = slot ? Math.max(0, Math.round(slot.price_mad)) : 0
    if (slot) lines.push({ key: 'slot', kind: 'slot', amount: base })

    // Weekend premium: only when a slot is chosen, the date is a weekend, and
    // the slot carries a positive premium percentage.
    const weekendPct = slot ? Math.max(0, slot.weekend_premium_pct ?? 0) : 0
    let weekendPremium = 0
    if (slot && weekendPct > 0 && isWeekend(dateIso)) {
      weekendPremium = Math.round((base * weekendPct) / 100)
      lines.push({ key: 'weekend', kind: 'weekend', amount: weekendPremium })
    }

    // Paid extras: amenities that are not included and carry a price > 0.
    let extrasTotal = 0
    const amenities: Amenity[] = p?.pool.amenities ?? []
    for (const a of amenities) {
      if (a.included || !a.price || a.price <= 0) continue
      if (!extraKeys.has(a.key)) continue
      const unit = Math.max(0, Math.round(a.price))
      const amount = a.per_person ? unit * g : unit
      extrasTotal += amount
      lines.push({
        key: a.key,
        kind: 'extra',
        amount,
        perPerson: a.per_person,
        unit,
        count: a.per_person ? g : undefined,
      })
    }

    return {
      base,
      weekendPremium,
      weekendPct: weekendPremium > 0 ? weekendPct : 0,
      extrasTotal,
      total: base + weekendPremium + extrasTotal,
      lines,
    }
  })
}

/**
 * Which slot keys are bookable for `pool` on `dateIso`.
 *
 * Source of truth at submit time is the DB trigger; this is a UI helper to
 * grey out unavailable slots. It returns the enabled slots minus those blocked
 * by `blocked_dates` for that date (a row with `slot = null` blocks the whole
 * day). Accepted bookings are NOT publicly readable, so conflicts caused by
 * other renters' accepted bookings are caught by the trigger on submit, not here.
 *
 * `acceptedSlots` lets a caller that *can* see accepted bookings (e.g. via
 * `usePoolDayAvailability`) additionally subtract them.
 */
export function slotAvailability(
  pool: PoolDetail | null,
  dateIso: string | null | undefined,
  acceptedSlots: SlotKey[] = []
): Record<SlotKey, boolean> {
  const out = { morning: false, afternoon: false, evening: false, full_day: false } as Record<
    SlotKey,
    boolean
  >
  if (!pool) return out

  // Start from enabled slots.
  for (const s of pool.slots) out[s.slot] = true

  if (!dateIso) return out

  const blocked: BlockedDate[] = pool.blockedDates ?? []
  const dayBlocked = blocked.some((b) => b.date === dateIso && b.slot === null)
  if (dayBlocked) {
    return { morning: false, afternoon: false, evening: false, full_day: false }
  }

  // Per-slot blocks for this date.
  for (const b of blocked) {
    if (b.date === dateIso && b.slot) out[b.slot] = false
  }

  // Accepted bookings: a full_day booking occupies every slot; any other slot
  // booking blocks that slot AND full_day (which would overlap it).
  const accepted = new Set(acceptedSlots)
  if (accepted.has('full_day')) {
    return { morning: false, afternoon: false, evening: false, full_day: false }
  }
  for (const slot of accepted) out[slot] = false
  if (accepted.size > 0) out.full_day = false

  return out
}
