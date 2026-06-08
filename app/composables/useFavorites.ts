import type { PoolListItem } from '~/types/db'

/**
 * The signed-in user's favorite pools, as `PoolListItem[]`.
 *
 * favorites is RLS-scoped to the caller (renter_id = auth.uid()). We read the
 * user's pool_ids then reuse usePools to hydrate them into cards (so the
 * favorites grid matches the browse grid). Returns an empty list when logged
 * out. The set of favorited ids is exposed as `favoriteIds` for quick lookups.
 */
export function useFavorites() {
  const supabase = useSupabaseClient()
  const user = useSupabaseUser()

  const { data, pending, error, refresh } = useAsyncData<string[]>(
    () => `favorite-ids:${user.value?.id ?? 'anon'}`,
    async () => {
      if (!user.value) return []
      const { data, error } = await supabase
        .from('favorites')
        .select('pool_id')
        .order('created_at', { ascending: false })
      if (error) throw error
      return ((data ?? []) as unknown as { pool_id: string }[]).map((r) => r.pool_id)
    },
    { watch: [user] }
  )

  const favoriteIds = computed<string[]>(() => data.value ?? [])
  const favoriteIdSet = computed<Set<string>>(() => new Set(favoriteIds.value))

  // Hydrate the ids into full cards via usePools, filtered client-side.
  const { pools: allPools, pending: poolsPending } = usePools({})
  const favorites = computed<PoolListItem[]>(() =>
    allPools.value.filter((p) => favoriteIdSet.value.has(p.id))
  )

  function isFavorite(poolId: string): boolean {
    return favoriteIdSet.value.has(poolId)
  }

  return {
    favorites,
    favoriteIds,
    favoriteIdSet,
    isFavorite,
    pending: computed(() => pending.value || poolsPending.value),
    error,
    refresh,
  }
}
