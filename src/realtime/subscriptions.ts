import type { Socket } from 'socket.io-client'

import type { RealtimeEvent } from '@/api/contracts/marketplace'
import { RealtimeEventGate } from '@/realtime/event-gate'

export interface SubscriptionOptions {
  token: string | null
  onEvent(event: RealtimeEvent): void
  /** Callers invalidate their active REST queries here after a transport reconnect. */
  reconcile(): void
}

function isRealtimeEvent(value: unknown): value is RealtimeEvent {
  if (typeof value !== 'object' || value === null) return false
  const candidate = value as Record<string, unknown>
  return typeof candidate.id === 'string' && typeof candidate.type === 'string' && typeof candidate.resourceId === 'string' && typeof candidate.version === 'number' && typeof candidate.occurredAt === 'string' && typeof candidate.payload === 'object'
}

export function subscribeRealtime(socket: Socket, options: SubscriptionOptions): () => void {
  const gate = new RealtimeEventGate()
  const receive = (value: unknown) => { if (isRealtimeEvent(value) && gate.accepts(value)) options.onEvent(value) }
  const connect = () => { socket.emit('foundation.ping', { sessionToken: options.token }); options.reconcile() }
  socket.on('connect', connect)
  socket.on('nft.updated', receive)
  socket.on('order.updated', receive)
  socket.connect()
  return () => {
    socket.off('connect', connect)
    socket.off('nft.updated', receive)
    socket.off('order.updated', receive)
    socket.disconnect()
  }
}
