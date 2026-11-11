import type { RealtimeEvent } from '@/api/contracts/marketplace'

/** Drops replayed events and version regressions before feature caches see them. */
export class RealtimeEventGate {
  private readonly eventIds = new Set<string>()
  private readonly versions = new Map<string, number>()

  accepts(event: RealtimeEvent): boolean {
    const current = this.versions.get(`${event.type}:${event.resourceId}`) ?? -1
    if (this.eventIds.has(event.id) || event.version <= current) return false
    this.eventIds.add(event.id)
    this.versions.set(`${event.type}:${event.resourceId}`, event.version)
    return true
  }
  reset(): void { this.eventIds.clear(); this.versions.clear() }
}
