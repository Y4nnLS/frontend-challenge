import { afterAll, afterEach, beforeAll, beforeEach, describe, expect, it } from 'vitest'

import { marketplaceApi } from '@/api/marketplace-api'
import { httpClient } from '@/api/http/client'
import { mockDatabase } from '@/mocks/handlers'
import { server } from '@/mocks/server'

beforeAll(() => server.listen({ onUnhandledRequest: 'error' }))
afterEach(() => { server.resetHandlers(); mockDatabase.reset(); delete httpClient.defaults.headers.common['x-session-token'] })
afterAll(() => server.close())
beforeEach(() => { httpClient.defaults.baseURL = 'http://localhost' })

describe('Axios through MSW REST handlers', () => {
  it('handles auth, private isolation, and idempotent timeout recovery', async () => {
    const session = await marketplaceApi.login({ email: 'ana@jungle.test', password: 'Jungle#123' })
    httpClient.defaults.headers.common['x-session-token'] = session.token
    const catalog = await marketplaceApi.listNfts({ query: 'Emerald', page: 1, pageSize: 5 })
    expect(catalog.items).toHaveLength(1)
    await marketplaceApi.setCartItem({ nftId: 'nft-jaguar', editionId: 'nft-jaguar-standard', quantity: 1 })
    const quote = await marketplaceApi.quote({})
    mockDatabase.setScenario({ timeoutAfterCreate: true })
    await expect(marketplaceApi.createOrder({ quoteId: quote.id, walletId: 'wallet-ana-main' }, 'timeout-attempt')).rejects.toThrow()
    const recovered = await marketplaceApi.createOrder({ quoteId: quote.id, walletId: 'wallet-ana-main' }, 'timeout-attempt')
    expect(recovered.status).toBe('confirmed')
    expect((await marketplaceApi.orders()).map((order) => order.id)).toEqual([recovered.id])
  })

  it('consumes failNext once under concurrent requests without overwriting a later scenario', async () => {
    mockDatabase.setScenario({ failNext: 'network' })
    const concurrent = await Promise.allSettled([marketplaceApi.listNfts({}), marketplaceApi.listNfts({})])
    expect(concurrent.filter((result) => result.status === 'rejected')).toHaveLength(1)
    expect(concurrent.filter((result) => result.status === 'fulfilled')).toHaveLength(1)

    mockDatabase.setScenario({ failNext: 'server', latencyMs: 20 })
    const delayed = marketplaceApi.listNfts({})
    await new Promise((resolve) => setTimeout(resolve, 0))
    mockDatabase.setScenario({ failNext: 'validation' })
    const immediate = marketplaceApi.listNfts({})
    const [delayedResult, immediateResult] = await Promise.allSettled([delayed, immediate])
    expect(delayedResult).toMatchObject({ status: 'rejected', reason: { response: { status: 500 } } })
    expect(immediateResult).toMatchObject({ status: 'rejected', reason: { response: { status: 422 } } })
    await expect(marketplaceApi.listNfts({})).resolves.toMatchObject({ total: 36, totalPages: 3 })
  })

  it('rejects malformed HTTP payloads and invalid query values as 422 responses', async () => {
    await expect(httpClient.post('/api/auth/register', { email: null })).rejects.toMatchObject({ response: { status: 422, data: { code: 'VALIDATION_ERROR' } } })
    await expect(httpClient.get('/api/nfts?page=zero&pageSize=999')).rejects.toMatchObject({ response: { status: 422, data: { code: 'VALIDATION_ERROR' } } })

    const session = await marketplaceApi.login({ email: 'ana@jungle.test', password: 'Jungle#123' })
    httpClient.defaults.headers.common['x-session-token'] = session.token
    await expect(httpClient.put('/api/cart/items', { nftId: null, editionId: 'nft-jaguar-standard', quantity: '2' })).rejects.toMatchObject({ response: { status: 422, data: { code: 'VALIDATION_ERROR' } } })
    await expect(httpClient.post('/api/orders', { quoteId: null, walletId: 42 }, { headers: { 'Idempotency-Key': 'invalid-order' } })).rejects.toMatchObject({ response: { status: 422, data: { code: 'VALIDATION_ERROR' } } })
  })
})
