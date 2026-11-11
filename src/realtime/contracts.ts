import type { NftUpdatedEvent, OrderUpdatedEvent, RealtimeEvent } from '@/api/contracts/marketplace'

export interface FoundationPongEvent {
  eventId: string
  resourceId: 'foundation'
  version: number
  message: string
  userId?: string
}

export type { NftUpdatedEvent, OrderUpdatedEvent, RealtimeEvent }
