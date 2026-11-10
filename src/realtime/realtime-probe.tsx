import { useEffect, useState } from 'react'

import type { FoundationPongEvent } from '@/realtime/contracts'
import { createRealtimeSocket } from '@/realtime/socket-client'

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

  useEffect(() => {
    const socket = createRealtimeSocket()

    const handleConnect = () => {
      socket.emit('foundation.ping', { requestedAt: new Date().toISOString() })
    }
    const handlePong = (event: unknown) => {
      if (!isFoundationPongEvent(event)) {
        setState('failed')
        return
      }

      setMessage(event.message)
      setState('received')
    }
    const handleError = () => setState('failed')

    socket.on('connect', handleConnect)
    socket.on('foundation.pong', handlePong)
    socket.on('connect_error', handleError)
    socket.connect()

    return () => {
      socket.off('connect', handleConnect)
      socket.off('foundation.pong', handlePong)
      socket.off('connect_error', handleError)
      socket.disconnect()
    }
  }, [])

  return (
    <p aria-live="polite" data-testid="socket-status">
      Socket.IO/MSW: {state === 'received' ? message : state}
    </p>
  )
}
