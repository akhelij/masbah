/**
 * Post the pool owner's public reply to a review through the SECURITY DEFINER
 * `reply_to_review` RPC (migration 0006). The RPC authorises on the pool owner
 * (`target_type = 'pool'` and `auth.uid() = pool.owner_id`); there is no UPDATE
 * policy on `reviews`, so this RPC is the only reply path.
 */

// The generated Database type is a placeholder, so `supabase.rpc(...)` resolves
// to an `undefined`-args signature. Re-type just the one RPC we call.
type ReplyResult = Promise<{ error: { message: string } | null }>
type ReplyRpc = (
  // eslint-disable-next-line no-unused-vars
  fn: 'reply_to_review',
  // eslint-disable-next-line no-unused-vars
  args: { p_review_id: string; p_reply: string }
) => ReplyResult

export function useReplyToReview() {
  const supabase = useSupabaseClient()
  const callReply = supabase.rpc.bind(supabase) as unknown as ReplyRpc
  const user = useSupabaseUser()

  const pending = ref(false)
  const error = ref<string | null>(null)

  /**
   * Publish `text` as the reply to `reviewId`. Resolves to true on success,
   * false on failure (with a friendly i18n key set on `error`).
   */
  async function reply(reviewId: string, text: string): Promise<boolean> {
    // Truthy guard only — do NOT read user.value.id here (unreliable).
    if (!user.value) {
      error.value = 'reviews.errors.notAuthorized'
      return false
    }
    const trimmed = text.trim()
    if (!trimmed) {
      error.value = 'reviews.errors.replyEmpty'
      return false
    }

    pending.value = true
    error.value = null
    try {
      const { error: rpcErr } = await callReply('reply_to_review', {
        p_review_id: reviewId,
        p_reply: trimmed,
      })
      if (rpcErr) {
        error.value = rpcErr.message.toLowerCase().includes('only the pool owner')
          ? 'reviews.errors.notAuthorized'
          : 'reviews.errors.generic'
        return false
      }
      return true
    } finally {
      pending.value = false
    }
  }

  return { reply, pending, error }
}
