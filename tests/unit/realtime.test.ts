import { describe, expect, it } from 'vitest'

import type { RealtimeEvent } from '@/api/contracts/marketplace'
import { RealtimeEventGate } from '@/realtime/event-gate'
import { subscribeRealtime } from '@/realtime/subscriptions'

class FakeSocket {
  readonly emitted: Array<[string, unknown]> = []
  private readonly listeners = new Map<string, Set<(value: unknown) => void>>()
  connect() { this.trigger('connect') }
  disconnect() { this.trigger('disconnect') }
  on(event: string, listener: (value: unknown) => void) { const listeners = this.listeners.get(event) ?? new Set(); listeners.add(listener); this.listeners.set(event, listeners); return this }
  off(event: string, listener: (value: unknown) => void) { this.listeners.get(event)?.delete(listener); return this }
  emit(event: string, payload?: unknown) { this.emitted.push([event, payload]); return this }
  trigger(event: string, payload?: unknown) { this.listeners.get(event)?.forEach((listener) => listener(payload)) }
  listenerCount(event: string) { return this.listeners.get(event)?.size ?? 0 }
}

const orderEvent = (id: string, version: number): RealtimeEvent => ({
  id, type: 'order.updated', resourceId: 'order-1', version, occurredAt: '2026-01-01T00:00:00.000Z',
  payload: { id: 'order-1', userId: 'user-ana', status: 'pending', version, createdAt: '2026-01-01T00:00:00.000Z', updatedAt: '2026-01-01T00:00:00.000Z', receipt: { orderId: 'order-1', createdAt: '2026-01-01T00:00:00.000Z', transactionReference: 'tx', walletAddress: '0x0', lines: [], subtotalEth: '0.000000000000000000', discountEth: '0.000000000000000000', networkFeeEth: '0.000000000000000000', totalEth: '0.000000000000000000' } },
})

describe('realtime lifecycle', () => {
  it('drops duplicate and stale resource events', () => {
    const gate = new RealtimeEventGate()
    expect(gate.accepts(orderEvent('event-1', 1))).toBe(true)
    expect(gate.accepts(orderEvent('event-1', 1))).toBe(false)
    expect(gate.accepts(orderEvent('event-2', 1))).toBe(false)
    expect(gate.accepts(orderEvent('event-3', 2))).toBe(true)
  })

  it('subscribes, reconciles after reconnect and releases all listeners', () => {
    const socket = new FakeSocket(), received: RealtimeEvent[] = []
    let reconciliations = 0
    const cleanup = subscribeRealtime(socket as never, { token: 'session-ana', onEvent: (event) => received.push(event), reconcile: () => { reconciliations += 1 } })

    socket.trigger('order.updated', orderEvent('event-1', 1))
    socket.trigger('order.updated', orderEvent('event-1', 1))
    socket.trigger('connect')
    cleanup()
    socket.trigger('order.updated', orderEvent('event-2', 2))

    expect(received).toHaveLength(1)
    expect(reconciliations).toBe(2)
    expect(socket.emitted.filter(([event]) => event === 'foundation.ping')).toHaveLength(2)
    expect(socket.listenerCount('order.updated')).toBe(0)
    expect(socket.listenerCount('nft.updated')).toBe(0)
  })
})
