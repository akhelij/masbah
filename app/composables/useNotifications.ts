/**
 * The signed-in user's in-app notifications (RLS = own rows), with live updates.
 *
 * List is read newest-first (limit 50); RLS scopes `notifications` SELECT to
 * `user_id = auth.uid()`, so we never filter by user id (the user ref's id is
 * unreliable — see useOwnerPools). Rows are written only by SECURITY DEFINER
 * functions, so the client never inserts; `markRead`/`markAllRead` set
 * `read_at` (the own-row UPDATE policy authorises them).
 *
 * Realtime: `subscribe()` opens a single postgres_changes channel on INSERTs to
 * `public.notifications` (in the supabase_realtime publication). RLS authorises
 * delivery of ONLY the user's own rows, so no user_id filter is needed; we just
 * `refresh()` on any event. `unsubscribe()` removes the channel.
 */

/** The notification kinds (enum `notification_type`, migration 0001). */
export type NotificationType =
  | 'new_request'
  | 'request_accepted'
  | 'request_declined'
  | 'request_expired'
  | 'visit_reminder'
  | 'new_review'
  | 'system'

/** Free-form payload attached to a notification (shape varies by type). */
export interface NotificationPayload {
  request_id?: string
  pool_id?: string
  pool_title?: string
  date?: string
  slot?: string
  reason?: string | null
  auto?: boolean
  rating?: number
  event?: string
  [key: string]: unknown
}

/** Row of `public.notifications` (own rows only). */
export interface NotificationRow {
  id: string
  user_id: string
  type: NotificationType
  payload: NotificationPayload
  read_at: string | null
  created_at: string
}

// The generated Database type is a placeholder, so the realtime channel API and
// the `notifications` update chain resolve to `never`/`undefined`. Re-type just
// the bits we use (mirrors the casting approach across the data composables).
interface RealtimeChannelLike {
  on(
    // eslint-disable-next-line no-unused-vars
    event: 'postgres_changes',
    // eslint-disable-next-line no-unused-vars
    filter: { event: 'INSERT'; schema: 'public'; table: 'notifications' },
    // eslint-disable-next-line no-unused-vars
    cb: () => void
  ): RealtimeChannelLike
  subscribe(): RealtimeChannelLike
}
interface NotificationsClient {
  // eslint-disable-next-line no-unused-vars
  channel(name: string): RealtimeChannelLike
  // eslint-disable-next-line no-unused-vars
  removeChannel(channel: RealtimeChannelLike): void
}

// Unique suffix per subscriber so multiple concurrent consumers (e.g. the header
// bell + the notifications page) don't collide on the same realtime topic name.
let channelSeq = 0

export function useNotifications() {
  const supabase = useSupabaseClient()
  const realtime = supabase as unknown as NotificationsClient
  const user = useSupabaseUser()

  const key = computed(() => `notifications:${user.value ? 'me' : 'anon'}`)

  const { data, pending, error, refresh } = useAsyncData<NotificationRow[]>(
    key,
    async () => {
      if (!user.value) return []
      // RLS scopes SELECT to own rows — no user_id filter needed.
      const { data: rows, error: err } = await supabase
        .from('notifications')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(50)
      if (err) throw err
      return (rows ?? []) as unknown as NotificationRow[]
    },
    { watch: [user] }
  )

  const notifications = computed<NotificationRow[]>(() => data.value ?? [])
  const unreadCount = computed(() => notifications.value.filter((n) => n.read_at == null).length)

  /** Mark a single notification read (own-row UPDATE policy authorises it). */
  async function markRead(id: string): Promise<void> {
    if (!user.value) return
    // Optimistic local update for an instant badge change.
    if (data.value) {
      const now = new Date().toISOString()
      data.value = data.value.map((n) =>
        n.id === id && n.read_at == null ? { ...n, read_at: now } : n
      )
    }
    const { error: err } = await supabase
      .from('notifications')
      .update({ read_at: new Date().toISOString() } as never)
      .eq('id', id)
    if (err) await refresh()
  }

  /** Mark every unread notification read in one call. */
  async function markAllRead(): Promise<void> {
    if (!user.value) return
    const unreadIds = notifications.value.filter((n) => n.read_at == null).map((n) => n.id)
    if (unreadIds.length === 0) return
    if (data.value) {
      const now = new Date().toISOString()
      data.value = data.value.map((n) => (n.read_at == null ? { ...n, read_at: now } : n))
    }
    const { error: err } = await supabase
      .from('notifications')
      .update({ read_at: new Date().toISOString() } as never)
      .is('read_at', null)
    if (err) await refresh()
  }

  // ── Realtime ─────────────────────────────────────────────────────────────
  let channel: RealtimeChannelLike | null = null

  /** Open the realtime channel; refreshes the list on any INSERT for this user. */
  function subscribe(): void {
    if (import.meta.server) return
    if (!user.value || channel) return
    channel = realtime
      .channel(`notifications-rt-${++channelSeq}`)
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'notifications' }, () => {
        void refresh()
      })
      .subscribe()
  }

  /** Tear down the realtime channel. */
  function unsubscribe(): void {
    if (channel) {
      realtime.removeChannel(channel)
      channel = null
    }
  }

  return {
    notifications,
    unreadCount,
    pending,
    error,
    markRead,
    markAllRead,
    subscribe,
    unsubscribe,
    refresh,
  }
}
