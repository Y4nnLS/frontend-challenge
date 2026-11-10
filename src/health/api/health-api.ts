import type { HealthResponse } from '@/api/contracts/health'
import { httpClient } from '@/api/http/client'

export async function getHealth(signal?: AbortSignal): Promise<HealthResponse> {
  const response = await httpClient.get<HealthResponse>('/api/health', { signal })
  return response.data
}
