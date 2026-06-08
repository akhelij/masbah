import type { PoolSlot, SlotKey } from '~/types/db'

/** Editable per-slot config the wizard manages. */
export interface SlotConfig {
  slot: SlotKey
  price_mad: number
  enabled: boolean
  weekend_premium_pct: number
}

interface MutationResult {
  error: { message: string } | null
}

// Upsert chain on pool_slots (conflict target = unique(pool_id, slot)).
interface SlotUpsertRow {
  pool_id: string
  slot: SlotKey
  price_mad: number
  enabled: boolean
  weekend_premium_pct: number
}
interface PoolSlotsQuery {
  from(table: 'pool_slots'): {
    upsert(
      rows: SlotUpsertRow[],
      opts: { onConflict: string }
    ): Promise<MutationResult>
    delete(): {
      eq(col: 'pool_id', value: string): {
        eq(col: 'slot', value: SlotKey): Promise<MutationResult>
      }
    }
  }
}

export const SLOT_KEYS: SlotKey[] = ['morning', 'afternoon', 'evening', 'full_day']

/** Read + upsert + delete the slots for one owned pool. */
export function usePoolSlots(id: MaybeRefOrGetter<string>) {
  const supabase = useSupabaseClient()
  const writeClient = supabase as unknown as PoolSlotsQuery

  const poolId = computed(() => toValue(id))

  async function list(): Promise<PoolSlot[]> {
    const { data, error } = await supabase
      .from('pool_slots')
      .select('id, pool_id, slot, price_mad, enabled, weekend_premium_pct')
      .eq('pool_id', poolId.value)
    if (error) throw error
    return (data ?? []) as unknown as PoolSlot[]
  }

  /** Upsert one or more slot rows (idempotent on (pool_id, slot)). */
  async function upsert(configs: SlotConfig[]): Promise<MutationResult> {
    if (!configs.length) return { error: null }
    const rows: SlotUpsertRow[] = configs.map((c) => ({
      pool_id: poolId.value,
      slot: c.slot,
      price_mad: Math.max(0, Math.round(c.price_mad || 0)),
      enabled: c.enabled,
      weekend_premium_pct: Math.max(0, Math.round(c.weekend_premium_pct || 0)),
    }))
    return writeClient.from('pool_slots').upsert(rows, { onConflict: 'pool_id,slot' })
  }

  async function remove(slot: SlotKey): Promise<MutationResult> {
    return writeClient.from('pool_slots').delete().eq('pool_id', poolId.value).eq('slot', slot)
  }

  return { list, upsert, remove }
}
