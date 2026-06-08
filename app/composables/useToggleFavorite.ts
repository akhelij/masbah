/**
 * Add/remove a pool from the signed-in user's favorites.
 *
 * Auth-gated: when logged out, the contextual AuthSheet opens (reason
 * 'favorite') and the toggle is replayed once the user signs in (via
 * useAuthGate's pending-action mechanism). favorites is RLS-scoped to the
 * caller, so we only ever pass renter_id = auth.uid().
 */
// The placeholder Database type makes `from('favorites').insert(...)` expect
// `never[]`. Re-type just the insert chain we use (mirrors useProfiles), so
// the payload is checked against the real favorites shape instead.
interface FavoriteInsert {
  renter_id: string
  pool_id: string
}
interface FavoritesInsertQuery {
  from(table: 'favorites'): {
    insert(row: FavoriteInsert): Promise<{ error: { message: string } | null }>
  }
}

export function useToggleFavorite() {
  const supabase = useSupabaseClient()
  const supabaseInsert = supabase as unknown as FavoritesInsertQuery
  const user = useSupabaseUser()
  const { requireAuth } = useAuthGate()

  const pending = ref(false)
  const error = ref<string | null>(null)

  /**
   * Toggle `poolId`. `currentlyFavorite` is the optimistic current state.
   * Resolves to the new state (true = now favorited), or null when the action
   * was deferred to sign-in / failed.
   */
  async function toggle(poolId: string, currentlyFavorite: boolean): Promise<boolean | null> {
    // Logged out → open the gate and defer the toggle until authenticated.
    if (!user.value) {
      requireAuth('favorite', () => {
        void toggle(poolId, currentlyFavorite)
      })
      return null
    }

    pending.value = true
    error.value = null
    try {
      if (currentlyFavorite) {
        const { error: delErr } = await supabase
          .from('favorites')
          .delete()
          .eq('pool_id', poolId)
          .eq('renter_id', user.value.id)
        if (delErr) {
          error.value = delErr.message
          return null
        }
        return false
      } else {
        const { error: insErr } = await supabaseInsert
          .from('favorites')
          .insert({ pool_id: poolId, renter_id: user.value.id })
        // Ignore duplicate-key (already favorited) as a success.
        if (insErr && !/duplicate key|conflict/i.test(insErr.message)) {
          error.value = insErr.message
          return null
        }
        return true
      }
    } finally {
      pending.value = false
    }
  }

  return { toggle, pending, error }
}
