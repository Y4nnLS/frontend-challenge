import { beforeEach, describe, expect, it } from 'vitest'

import { MockDatabase, MockDomainError, MemoryPersistence } from '@/mocks/database'

let db: MockDatabase

function loginAna() { return db.login({ email: 'ana@jungle.test', password: 'Jungle#123' }) }
function wallet() { return db.listWallets('user-ana')[0] }

beforeEach(() => { db = new MockDatabase(new MemoryPersistence()) })

describe('catalog contract', () => {
  it('composes search, filters, sorting and pagination deterministically', () => {
    const result = db.listNfts({ query: 'Sage', category: 'animals', available: true, sort: 'price-asc', page: 1, pageSize: 1 })
    expect(result.total).toBe(1)
    expect(result.totalPages).toBe(1)
    expect(result.items.map((item) => item.id)).toEqual(['nft-toucan'])
    expect(db.listNfts({ query: 'not-present' }).items).toEqual([])
    const filteredPrice = db.listNfts({ maxPriceEth: '1.00', pageSize: 20 })
    expect(filteredPrice.items.every((item) => Number(item.editions[0]?.priceEth) <= 1)).toBe(true)
    const fourthPage = db.listNfts({ page: 4, pageSize: 9 })
    expect(fourthPage).toMatchObject({ page: 4, pageSize: 9, total: 36, totalPages: 4 })
    expect(fourthPage.items).toHaveLength(9)
  })

  it('sorts ETH values that differ beyond Number precision', () => {
    db.updateNft('nft-jaguar', { priceEth: '0.100000000000000002' })
    db.updateNft('nft-toucan', { priceEth: '0.100000000000000001' })

    const ascending = db.listNfts({ sort: 'price-asc', pageSize: 50 }).items
    const descending = db.listNfts({ sort: 'price-desc', pageSize: 50 }).items

    expect(ascending.findIndex((item) => item.id === 'nft-toucan')).toBeLessThan(ascending.findIndex((item) => item.id === 'nft-jaguar'))
    expect(descending.findIndex((item) => item.id === 'nft-jaguar')).toBeLessThan(descending.findIndex((item) => item.id === 'nft-toucan'))
  })
})

describe('private state and sessions', () => {
  it('isolates favorites and carts between fixture users', () => {
    db.addFavorite('user-ana', 'nft-orchid')
    expect(db.listFavorites('user-bruno').map((favorite) => favorite.nftId)).toEqual(['nft-toucan'])
    db.setCartItem('user-ana', { nftId: 'nft-jaguar', editionId: 'nft-jaguar-standard', quantity: 2 })
    expect(db.getCart('user-bruno').items).toHaveLength(0)
  })

  it('recovers persisted sessions and invalidates an expired scenario', () => {
    const persistence = new MemoryPersistence()
    const first = new MockDatabase(persistence)
    const session = first.login({ email: 'ana@jungle.test', password: 'Jungle#123' })
    const reloaded = new MockDatabase(persistence)
    expect(reloaded.getSession(session.token)?.user.id).toBe('user-ana')
    reloaded.setScenario({ sessionExpired: true })
    expect(reloaded.getSession(session.token)).toBeNull()
    reloaded.reset()
    expect(reloaded.getSession(session.token)).toBeNull()
  })

  it('expires a session from a controlled clock without requiring a mutation', () => {
    let now = Date.parse('2026-01-01T00:00:00.000Z')
    const timedDb = new MockDatabase(new MemoryPersistence(), () => now)
    const session = timedDb.login({ email: 'ana@jungle.test', password: 'Jungle#123' })

    now += 60 * 60 * 1000

    expect(timedDb.getSession(session.token)).toBeNull()
  })
})

describe('cart, quote and exact money', () => {
  it('uses exact decimal values and rejects stock overflow', () => {
    db.setCartItem('user-ana', { nftId: 'nft-jaguar', editionId: 'nft-jaguar-standard', quantity: 2 })
    db.setCartCoupon('user-ana', 'JUNGLE10')
    const quote = db.createQuote('user-ana')
    expect(quote.subtotalEth).toBe('2.380000000000000000')
    expect(quote.discountEth).toBe('0.238000000000000000')
    expect(quote.totalEth).toBe('2.144500000000000000')
    expect(() => db.setCartItem('user-ana', { nftId: 'nft-jaguar', editionId: 'nft-jaguar-standard', quantity: 9 })).toThrow(MockDomainError)
    expect(db.validateCoupon('EXPIRED')).toMatchObject({ valid: false, reason: 'EXPIRED' })
  })

  it('expires a quote from a controlled clock before an order is created', () => {
    let now = Date.parse('2026-01-01T00:00:00.000Z')
    const timedDb = new MockDatabase(new MemoryPersistence(), () => now)
    timedDb.setCartItem('user-ana', { nftId: 'nft-jaguar', editionId: 'nft-jaguar-standard', quantity: 1 })
    const quote = timedDb.createQuote('user-ana')

    now += 5 * 60 * 1000

    expect(() => timedDb.createOrder('user-ana', { quoteId: quote.id, walletId: 'wallet-ana-main' }, 'expired-quote')).toThrow(MockDomainError)
  })
})

describe('guest cart merge', () => {
  it('sums matching items, preserves distinct items and keeps the authenticated coupon', () => {
    db.setCartItem('user-ana', { nftId: 'nft-jaguar', editionId: 'nft-jaguar-standard', quantity: 2 })
    db.setCartCoupon('user-ana', 'JUNGLE10')
    db.setCartItem('guest:browser-1', { nftId: 'nft-jaguar', editionId: 'nft-jaguar-standard', quantity: 3 })
    db.setCartItem('guest:browser-1', { nftId: 'nft-toucan', editionId: 'nft-toucan-standard', quantity: 1 })
    db.setCartCoupon('guest:browser-1', 'EXPIRED')

    const result = db.mergeGuestCart('user-ana', 'browser-1')

    expect(result.adjustments).toEqual([])
    expect(result.cart.couponCode).toBe('JUNGLE10')
    expect(result.cart.items.map((item) => [item.id, item.quantity])).toEqual([
      ['nft-jaguar:nft-jaguar-standard', 5],
      ['nft-toucan:nft-toucan-standard', 1],
    ])
    expect(db.getCart('guest:browser-1').items).toEqual([])
  })

  it('caps a summed matching item at stock and reports the adjustment', () => {
    db.setCartItem('user-ana', { nftId: 'nft-jaguar', editionId: 'nft-jaguar-standard', quantity: 7 })
    db.setCartItem('guest:browser-2', { nftId: 'nft-jaguar', editionId: 'nft-jaguar-standard', quantity: 3 })

    const result = db.mergeGuestCart('user-ana', 'browser-2')

    expect(result.cart.items).toMatchObject([{ id: 'nft-jaguar:nft-jaguar-standard', quantity: 8 }])
    expect(result.adjustments).toEqual([{
      nftId: 'nft-jaguar', editionId: 'nft-jaguar-standard', requestedQuantity: 10, acceptedQuantity: 8, reason: 'STOCK_LIMIT',
    }])
  })
})

describe('orders and immutable receipt', () => {
  it('is idempotent, conflicts on altered payload, and removes only confirmed items', () => {
    loginAna()
    db.setCartItem('user-ana', { nftId: 'nft-jaguar', editionId: 'nft-jaguar-standard', quantity: 2 })
    const quote = db.createQuote('user-ana')
    const first = db.createOrder('user-ana', { quoteId: quote.id, walletId: wallet().id }, 'attempt-1')
    const retry = db.createOrder('user-ana', { quoteId: quote.id, walletId: wallet().id }, 'attempt-1')
    expect(retry.id).toBe(first.id)
    expect(() => db.createOrder('user-ana', { quoteId: 'different', walletId: wallet().id }, 'attempt-1')).toThrow(MockDomainError)
    expect(db.getCart('user-ana').items).toHaveLength(0)
    const receipt = db.getOrder('user-ana', first.id)!.receipt
    db.updateNft('nft-jaguar', { priceEth: '9.000000000000000000' })
    expect(db.getOrder('user-ana', first.id)!.receipt).toEqual(receipt)
  })

  it('scopes idempotency keys by user and retains same-user retry/conflict rules', () => {
    db.setCartItem('user-ana', { nftId: 'nft-jaguar', editionId: 'nft-jaguar-standard', quantity: 1 })
    db.setCartItem('user-bruno', { nftId: 'nft-toucan', editionId: 'nft-toucan-standard', quantity: 1 })
    const anaQuote = db.createQuote('user-ana')
    const brunoQuote = db.createQuote('user-bruno')
    const anaOrder = db.createOrder('user-ana', { quoteId: anaQuote.id, walletId: 'wallet-ana-main' }, 'same-key')
    const brunoOrder = db.createOrder('user-bruno', { quoteId: brunoQuote.id, walletId: 'wallet-bruno-main' }, 'same-key')

    expect(anaOrder.id).not.toBe(brunoOrder.id)
    expect(db.createOrder('user-ana', { quoteId: anaQuote.id, walletId: 'wallet-ana-main' }, 'same-key').id).toBe(anaOrder.id)
    expect(() => db.createOrder('user-ana', { quoteId: 'another-quote', walletId: 'wallet-ana-main' }, 'same-key')).toThrow(MockDomainError)
    expect(db.getOrder('user-bruno', anaOrder.id)).toBeNull()
  })

  it('leaves multi-item order state untouched when confirmation preconditions fail', () => {
    db.setCartItem('user-ana', { nftId: 'nft-jaguar', editionId: 'nft-jaguar-standard', quantity: 1 })
    db.setCartItem('user-ana', { nftId: 'nft-toucan', editionId: 'nft-toucan-standard', quantity: 2 })
    const quote = db.createQuote('user-ana')
    db.updateNft('nft-toucan', { available: 0 })
    const beforeJaguar = db.getNft('nft-jaguar')!.editions[0]!.available
    const beforeCart = db.getCart('user-ana')

    expect(() => db.createOrder('user-ana', { quoteId: quote.id, walletId: 'wallet-ana-main' }, 'atomic-failure')).toThrow(MockDomainError)

    expect(db.getNft('nft-jaguar')!.editions[0]!.available).toBe(beforeJaguar)
    expect(db.getCart('user-ana')).toEqual(beforeCart)
    expect(db.listOrders('user-ana')).toEqual([])
    db.updateNft('nft-toucan', { available: 12 })
    const recovered = db.createOrder('user-ana', { quoteId: db.createQuote('user-ana').id, walletId: 'wallet-ana-main' }, 'atomic-failure')
    expect(recovered.status).toBe('confirmed')
  })

  it('preserves declined carts and transitions pending only once', () => {
    db.setScenario({ orderOutcome: 'declined' })
    db.setCartItem('user-ana', { nftId: 'nft-toucan', editionId: 'nft-toucan-standard', quantity: 1 })
    const declined = db.createOrder('user-ana', { quoteId: db.createQuote('user-ana').id, walletId: wallet().id }, 'declined')
    expect(declined.status).toBe('declined')
    expect(db.getCart('user-ana').items).toHaveLength(1)
    db.setScenario({ orderOutcome: 'pending' })
    const pending = db.createOrder('user-ana', { quoteId: db.createQuote('user-ana').id, walletId: wallet().id }, 'pending')
    expect(db.updateOrderStatus('user-ana', pending.id, 'confirmed').status).toBe('confirmed')
    expect(db.updateOrderStatus('user-ana', pending.id, 'declined').status).toBe('confirmed')
  })

  it('does not partially confirm a pending multi-item order when stock changed', () => {
    db.setScenario({ orderOutcome: 'pending' })
    db.setCartItem('user-ana', { nftId: 'nft-jaguar', editionId: 'nft-jaguar-standard', quantity: 1 })
    db.setCartItem('user-ana', { nftId: 'nft-toucan', editionId: 'nft-toucan-standard', quantity: 1 })
    const pending = db.createOrder('user-ana', { quoteId: db.createQuote('user-ana').id, walletId: 'wallet-ana-main' }, 'pending-atomic')
    db.updateNft('nft-toucan', { available: 0 })
    const beforeJaguar = db.getNft('nft-jaguar')!.editions[0]!.available

    expect(() => db.updateOrderStatus('user-ana', pending.id, 'confirmed')).toThrow(MockDomainError)

    expect(db.getOrder('user-ana', pending.id)?.status).toBe('pending')
    expect(db.getNft('nft-jaguar')!.editions[0]!.available).toBe(beforeJaguar)
  })
})

describe('realtime source', () => {
  it('emits versioned NFT and order updates from real database mutations', () => {
    const events: string[] = []
    db.subscribe((event) => events.push(`${event.type}:${event.resourceId}@${event.version}`))
    db.updateNft('nft-jaguar', { available: 7 })
    db.setCartItem('user-ana', { nftId: 'nft-toucan', editionId: 'nft-toucan-standard', quantity: 1 })
    const order = db.createOrder('user-ana', { quoteId: db.createQuote('user-ana').id, walletId: wallet().id }, 'realtime-order')
    expect(events).toEqual(['nft.updated:nft-jaguar@2', `nft.updated:nft-toucan@2`, `order.updated:${order.id}@1`])
  })
})
