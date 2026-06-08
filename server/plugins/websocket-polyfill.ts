import { WebSocket as WsWebSocket } from 'ws'

/**
 * @supabase/realtime-js requires a global `WebSocket` constructor.
 * Node 22+ (Vercel production) ships one natively, so this is a no-op there.
 * Node 20 (local dev) does not, so we polyfill it with `ws`.
 */
export default defineNitroPlugin(() => {
  if (typeof (globalThis as { WebSocket?: unknown }).WebSocket === 'undefined') {
    ;(globalThis as { WebSocket?: unknown }).WebSocket = WsWebSocket
  }
})
