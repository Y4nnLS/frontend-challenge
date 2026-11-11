import { useEffect, useState } from 'react'

import type { FoundationPongEvent } from '@/realtime/contracts'
import { createRealtimeSocket } from '@/realtime/socket-client'
import { RealtimeEventGate } from '@/realtime/event-gate'

type ProbeState = 'connecting' | 'received' | 'failed'

function isFoundationPongEvent(value: unknown): value is FoundationPongEvent {
  if (typeof value !== 'object' || value === null) {
    return false
  }

  const event = value as Record<string, unknown>
  return (
    typeof event.eventId === 'string' &&
    event.resourceId === 'foundation' &&
    typeof event.version === 'number' &&
    typeof event.message === 'string'
  )
}

export function RealtimeProbe() {
  const [state, setState] = useState<ProbeState>('connecting')
  const [message, setMessage] = useState('')
  const [nftEvent, setNftEvent] = useState('waiting')
  const [orderEvent, setOrderEvent] = useState('waiting')
  const [sessionUser, setSessionUser] = useState('anonymous')
  const [sessionRevision, setSessionRevision] = useState(0)

  useEffect(() => {
    const handleSessionChange = () => setSessionRevision((value) => value + 1)
    window.addEventListener('jungle-session-changed', handleSessionChange)
    return () => window.removeEventListener('jungle-session-changed', handleSessionChange)
  }, [])

  useEffect(() => {
    const socket = createRealtimeSocket()
    const gate = new RealtimeEventGate()

    const handleConnect = () => {
      socket.emit('foundation.ping', { requestedAt: new Date().toISOString(), sessionToken: localStorage.getItem('jungle-session-token') })
    }
    const handlePong = (event: unknown) => {
      if (!isFoundationPongEvent(event)) {
        setState('failed')
        return
      }

      setMessage(event.message)
      setSessionUser(event.userId ?? 'anonymous')
      setState('received')
    }
    const handleError = () => setState('failed')
    const handleNftUpdate = (event: unknown) => {
      if (typeof event !== 'object' || event === null) return
      const candidate = event as { id?: unknown; type?: unknown; resourceId?: unknown; version?: unknown }
      if (typeof candidate.id === 'string' && candidate.type === 'nft.updated' && typeof candidate.resourceId === 'string' && typeof candidate.version === 'number' && gate.accepts(event as never)) {
        setNftEvent(`${candidate.resourceId}@${candidate.version}`)
      }
    }
    const handleOrderUpdate = (event: unknown) => {
      if (typeof event !== 'object' || event === null) return
      const candidate = event as { id?: unknown; type?: unknown; resourceId?: unknown; version?: unknown }
      if (typeof candidate.id === 'string' && candidate.type === 'order.updated' && typeof candidate.resourceId === 'string' && typeof candidate.version === 'number' && gate.accepts(event as never)) {
        setOrderEvent(`${candidate.resourceId}@${candidate.version}`)
      }
    }

    socket.on('connect', handleConnect)
    socket.on('foundation.pong', handlePong)
    socket.on('connect_error', handleError)
    socket.on('nft.updated', handleNftUpdate)
    socket.on('order.updated', handleOrderUpdate)
    socket.connect()

    return () => {
      socket.off('connect', handleConnect)
      socket.off('foundation.pong', handlePong)
      socket.off('connect_error', handleError)
      socket.off('nft.updated', handleNftUpdate)
      socket.off('order.updated', handleOrderUpdate)
      socket.disconnect()
    }
  }, [sessionRevision])

  return (
    <>
    <p aria-live="polite" data-testid="socket-status">
      Socket.IO/MSW: {state === 'received' ? message : state}
    </p>
    <p aria-live="polite" data-testid="socket-nft-event">NFT event: {nftEvent}</p>
    <p aria-live="polite" data-testid="socket-order-event">Order event: {orderEvent}</p>
    <p aria-live="polite" data-testid="socket-session">Socket session: {sessionUser}</p>
    </>
  )
}
