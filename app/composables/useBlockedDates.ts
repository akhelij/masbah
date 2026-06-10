import type { BlockedDate, SlotKey } from '~/types/db'

/** Local YYYY-MM-DD for "today" (used as the lower bound of upcoming blocks). */
export function todayIso(): string {
  const d = new Date()
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${y}-${m}-${day}`
}

// The placeholder Database type makes write chains on `blocked_dates` expect
// `never` payloads. Re-type just the insert/delete chains we use (mirrors
// useToggleFavorite).
interface BlockedDateInsert {
  pool_id: string
  date: string
  /** null = whole day blocked. */
  slot: SlotKey | null
  reason: string | null
}
interface BlockedDatesWriteQuery {
  from(table: 'blocked_dates'): {
    insert(row: BlockedDateInsert): Promise<{ error: { message: string } | null }>
    delete(): {
      eq(column: 'id', value: string): Promise<{ error: { message: string } | null }>
    }
  }
}

/**
 * Owner-side manager for a pool's upcoming `blocked_dates`.
 *
 * Reads rows for `poolId` from today onward (the owner-CRUD RLS policy scopes
 * writes; SELECT returns the owner's rows). `poolId` may be a ref/getter — the
 * list refetches when it changes (e.g. the "Disponibilités" sheet switching
 * pools) and clears when it goes null.
 */
export function useBlockedDates(poolId: MaybeRefOrGetter<string | null>) {
  const supabase = useSupabaseClient()
  const supabaseWrite = supabase as unknown as BlockedDatesWriteQuery

  const pid = computed(() => toValue(poolId))

  const blocked = ref<BlockedDate[]>([])
  const pending = ref(false)
  /** Raw Supabase message of the last failed fetch/mutation (null when ok). */
  const error = ref<string | null>(null)
  /** True while addBlock/removeBlock is in flight (drives button spinners). */
  const saving = ref(false)

  async function refresh(): Promise<void> {
    if (!pid.value) {
      blocked.value = []
      return
    }
    pending.value = true
    error.value = null
    try {
      const { data, error: selErr } = await supabase
        .from('blocked_dates')
        .select('id, pool_id, date, slot, reason')
        .eq('pool_id', pid.value)
        .gte('date', todayIso())
        .order('date')
      if (selErr) {
        error.value = selErr.message
        return
      }
      blocked.value = (data ?? []) as unknown as BlockedDate[]
    } finally {
      pending.value = false
    }
  }

  watch(pid, () => void refresh(), { immediate: true })

  /** Insert a block for the current pool. Resolves true on success. */
  async function addBlock(input: {
    date: string
    /** Omit/null to block the whole day. */
    slot?: SlotKey | null
    reason?: string | null
  }): Promise<boolean> {
    if (!pid.value || !input.date) return false
    saving.value = true
    error.value = null
    try {
      const { error: insErr } = await supabaseWrite.from('blocked_dates').insert({
        pool_id: pid.value,
        date: input.date,
        slot: input.slot ?? null,
        reason: input.reason?.trim() || null,
      })
      if (insErr) {
        error.value = insErr.message
        return false
      }
      await refresh()
      return true
    } finally {
      saving.value = false
    }
  }

  /** Delete one block by id (RLS restricts to the owner). Resolves true on success. */
  async function removeBlock(id: string): Promise<boolean> {
    saving.value = true
    error.value = null
    try {
      const { error: delErr } = await supabaseWrite.from('blocked_dates').delete().eq('id', id)
      if (delErr) {
        error.value = delErr.message
        return false
      }
      await refresh()
      return true
    } finally {
      saving.value = false
    }
  }

  return { blocked, pending, error, saving, refresh, addBlock, removeBlock }
}
