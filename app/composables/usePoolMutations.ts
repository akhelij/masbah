import type { PoolPhoto, PoolSlot } from '~/types/db'
import {
  computeCompletionScore,
  publishReadiness,
  type PoolDraft,
} from './useCompletionScore'

/** Columns of `pools` the wizard may write. status/completion are managed here. */
export type PoolPatch = Partial<
  Omit<PoolDraft, 'id' | 'status' | 'completion_score'>
> & { completion_score?: number }

interface MutationResult {
  error: { message: string } | null
}
interface InsertSelectResult {
  data: { id: string } | null
  error: { message: string } | null
}

// Re-type the (placeholder-Database) client to the narrow write chains we use,
// mirroring useProfiles / useToggleFavorite.
interface PoolMutationsQuery {
  from(table: 'pools'): {
    insert(row: Record<string, unknown>): {
      select(cols: 'id'): { single(): Promise<InsertSelectResult> }
    }
    update(patch: Record<string, unknown>): {
      eq(col: 'id', value: string): Promise<MutationResult>
    }
    delete(): { eq(col: 'id', value: string): Promise<MutationResult> }
  }
}

export interface PublishBlocked {
  ok: false
  blocked: true
  /** i18n keys for what's still missing. */
  missing: string[]
}
export type SetStatusResult = MutationResult | PublishBlocked

export function usePoolMutations() {
  const supabase = useSupabaseClient()
  const writeClient = supabase as unknown as PoolMutationsQuery
  const user = useSupabaseUser()

  const pending = ref(false)

  /** Insert a blank draft owned by the current user; returns its new id. */
  async function createDraft(): Promise<{ id: string | null; error: string | null }> {
    if (!user.value) return { id: null, error: 'not-authenticated' }
    pending.value = true
    try {
      const { data, error } = await writeClient
        .from('pools')
        .insert({
          // owner_id defaults to auth.uid() at the DB (migration 0010).
          title: '',
          type: 'villa',
          status: 'draft',
          max_guests: 10,
          direct_contact_enabled: true,
          completion_score: 0,
        })
        .select('id')
        .single()
      if (error) return { id: null, error: error.message }
      return { id: data?.id ?? null, error: null }
    } finally {
      pending.value = false
    }
  }

  /** Patch arbitrary writable columns on a draft (used by autosave). */
  async function updatePool(id: string, patch: PoolPatch): Promise<MutationResult> {
    pending.value = true
    try {
      return await writeClient.from('pools').update(patch).eq('id', id)
    } finally {
      pending.value = false
    }
  }

  /**
   * Flip the status. Publishing recomputes the completion score and refuses if
   * the minimum (title, ≥1 photo, ≥1 priced slot, city, max_guests) is unmet,
   * returning a PublishBlocked with the missing i18n keys.
   */
  async function setStatus(
    id: string,
    status: 'draft' | 'published' | 'paused',
    context?: {
      draft: Parameters<typeof computeCompletionScore>[0] &
        Parameters<typeof publishReadiness>[0]
      photos: Pick<PoolPhoto, 'id'>[]
      slots: Pick<PoolSlot, 'enabled' | 'price_mad'>[]
    }
  ): Promise<SetStatusResult> {
    const patch: Record<string, unknown> = { status }

    if (context) {
      patch.completion_score = computeCompletionScore(
        context.draft,
        context.photos.length,
        context.slots
      )
    }

    if (status === 'published' && context) {
      const readiness = publishReadiness(context.draft, context.photos.length, context.slots)
      if (!readiness.ready) {
        return { ok: false, blocked: true, missing: readiness.missing }
      }
    }

    pending.value = true
    try {
      return await writeClient.from('pools').update(patch).eq('id', id)
    } finally {
      pending.value = false
    }
  }

  /**
   * Delete a pool. pool_photos / pool_slots / blocked_dates cascade via FKs, but
   * the storage objects are not, so we remove the `<pool_id>/` folder first.
   */
  async function deletePool(id: string): Promise<MutationResult> {
    pending.value = true
    try {
      // Best-effort storage cleanup: list then remove every object under the folder.
      const { data: files } = await supabase.storage.from('pool-photos').list(id)
      if (files && files.length) {
        await supabase.storage
          .from('pool-photos')
          .remove(files.map((f) => `${id}/${f.name}`))
      }
      return await writeClient.from('pools').delete().eq('id', id)
    } finally {
      pending.value = false
    }
  }

  return { createDraft, updatePool, setStatus, deletePool, pending }
}
