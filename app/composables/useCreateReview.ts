import type { ReviewCategories, ReviewTarget } from '~/types/db'

/**
 * Submit a two-way review through the SECURITY DEFINER `create_review` RPC
 * (migration 0006). The RPC enforces the trust loop server-side: the booking
 * must be accepted, the visit date must have passed, and the caller must be the
 * correct author (renter → reviews the 'pool'; owner → reviews the 'renter').
 * There is no INSERT policy on `reviews`, so this RPC is the only write path.
 *
 * Errors are mapped to `reviews.errors.*` i18n keys; the unique
 * (booking_id, target_type) constraint surfaces as "already reviewed".
 */

// The generated Database type is a placeholder, so `supabase.rpc(...)` resolves
// to an `undefined`-args signature. Re-type just the one RPC we call (mirrors
// the casting approach in useCancelBooking / useRespondBooking).
type CreateReviewResult = Promise<{
  data: string | null
  error: { message: string } | null
}>
type CreateReviewRpc = (
  // eslint-disable-next-line no-unused-vars
  fn: 'create_review',
  // eslint-disable-next-line no-unused-vars
  args: {
    p_booking_id: string
    p_target_type: ReviewTarget
    p_rating: number
    p_categories: ReviewCategories
    p_comment: string | null
  }
) => CreateReviewResult

export interface CreateReviewInput {
  bookingId: string
  targetType: ReviewTarget
  rating: number
  categories: ReviewCategories
  comment?: string | null
}

export function useCreateReview() {
  const supabase = useSupabaseClient()
  const callCreate = supabase.rpc.bind(supabase) as unknown as CreateReviewRpc
  const user = useSupabaseUser()

  const pending = ref(false)
  const error = ref<string | null>(null)

  /** Map a Postgres error message to a friendly `reviews.errors.*` i18n key. */
  function mapError(message: string): string {
    const m = message.toLowerCase()
    // The unique (booking_id, target_type) constraint → already reviewed.
    if (m.includes('duplicate') || m.includes('unique') || m.includes('reviews_booking')) {
      return 'reviews.errors.duplicate'
    }
    if (m.includes('accepted booking') || m.includes('not found')) {
      return 'reviews.errors.notAccepted'
    }
    if (m.includes('after the visit')) return 'reviews.errors.notYet'
    if (m.includes('only the')) return 'reviews.errors.notAuthorized'
    return 'reviews.errors.generic'
  }

  /**
   * Publish the review. Resolves to the new review id on success, or null on
   * failure (with a friendly i18n key set on `error`).
   */
  async function submit(input: CreateReviewInput): Promise<string | null> {
    // Truthy guard only — do NOT read user.value.id here (unreliable).
    if (!user.value) {
      error.value = 'reviews.errors.notAuthorized'
      return null
    }

    pending.value = true
    error.value = null
    try {
      const { data, error: rpcErr } = await callCreate('create_review', {
        p_booking_id: input.bookingId,
        p_target_type: input.targetType,
        p_rating: input.rating,
        p_categories: input.categories ?? {},
        p_comment: input.comment?.trim() || null,
      })
      if (rpcErr) {
        error.value = mapError(rpcErr.message)
        return null
      }
      return data ?? null
    } finally {
      pending.value = false
    }
  }

  return { submit, pending, error }
}
