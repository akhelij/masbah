import type { ProfilePublic, ReviewRow, ReviewWithAuthor } from '~/types/db'

/** A received review, enriched with its author and (for host reviews) the pool title. */
export interface UserReviewItem extends ReviewWithAuthor {
  /** 'host' = a review left on one of the member's pools; 'guest' = a renter review of the member. */
  role: 'host' | 'guest'
  /** Title of the reviewed pool (host reviews only). */
  poolTitle: string | null
}

export interface UserReviews {
  asHost: UserReviewItem[]
  asGuest: UserReviewItem[]
}

const EMPTY: UserReviews = { asHost: [], asGuest: [] }

/**
 * Reviews RECEIVED by a member id, newest first, in two buckets:
 *   • asHost  — reviews on the pools they own (target_type='pool')
 *   • asGuest — renter reviews of them (target_type='renter', target_user_id=id)
 * Each is hydrated with the author's public profile; host reviews also carry the
 * pool title. `reviews` is public-read, so no auth is required. Keyed on the
 * member id + locale.
 */
export function useUserReviews(idRef: MaybeRefOrGetter<string>) {
  const supabase = useSupabaseClient()
  const { locale } = useI18n()

  const memberId = computed(() => toValue(idRef))

  const { data, pending, error, refresh } = useAsyncData<UserReviews>(
    () => `user-reviews:${memberId.value}:${locale.value}`,
    async () => {
      const id = memberId.value
      if (!id) return EMPTY

      // The member's published pools (to scope host reviews + show pool titles).
      const { data: poolsData, error: poolsErr } = await supabase
        .from('pools_public')
        .select('id, title')
        .eq('owner_id', id)
      if (poolsErr) throw poolsErr
      const pools = (poolsData ?? []) as unknown as { id: string; title: string }[]
      const poolIds = pools.map((p) => p.id)
      const poolTitleById = new Map(pools.map((p) => [p.id, p.title]))

      // Host reviews (on their pools) + guest reviews (of them), newest first.
      const [hostRes, guestRes] = await Promise.all([
        poolIds.length
          ? supabase
              .from('reviews')
              .select(
                'id, booking_id, author_id, target_type, pool_id, target_user_id, rating, categories, comment, reply, created_at'
              )
              .eq('target_type', 'pool')
              .in('pool_id', poolIds)
              .order('created_at', { ascending: false })
          : Promise.resolve({ data: [], error: null }),
        supabase
          .from('reviews')
          .select(
            'id, booking_id, author_id, target_type, pool_id, target_user_id, rating, categories, comment, reply, created_at'
          )
          .eq('target_type', 'renter')
          .eq('target_user_id', id)
          .order('created_at', { ascending: false }),
      ])
      if (hostRes.error) throw hostRes.error
      if (guestRes.error) throw guestRes.error

      const hostRows = (hostRes.data ?? []) as unknown as ReviewRow[]
      const guestRows = (guestRes.data ?? []) as unknown as ReviewRow[]

      // Resolve all distinct authors in one query.
      const authorIds = [...new Set([...hostRows, ...guestRows].map((r) => r.author_id))]
      let authorById = new Map<string, ProfilePublic>()
      if (authorIds.length) {
        const { data: authorsData, error: authorsErr } = await supabase
          .from('profiles_public')
          .select('id, full_name, avatar_url, phone_verified, created_at')
          .in('id', authorIds)
        if (authorsErr) throw authorsErr
        const authors = (authorsData ?? []) as unknown as ProfilePublic[]
        authorById = new Map(authors.map((a) => [a.id, a]))
      }

      const asHost: UserReviewItem[] = hostRows.map((r) => ({
        ...r,
        author: authorById.get(r.author_id) ?? null,
        role: 'host',
        poolTitle: r.pool_id ? (poolTitleById.get(r.pool_id) ?? null) : null,
      }))
      const asGuest: UserReviewItem[] = guestRows.map((r) => ({
        ...r,
        author: authorById.get(r.author_id) ?? null,
        role: 'guest',
        poolTitle: null,
      }))

      return { asHost, asGuest }
    },
    { watch: [memberId, locale] }
  )

  const reviews = computed<UserReviews>(() => data.value ?? EMPTY)
  return { reviews, pending, error, refresh }
}
