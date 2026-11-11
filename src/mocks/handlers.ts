import { toSocketIo } from '@mswjs/socket.io-binding'
import { HttpResponse, http, ws } from 'msw'

import type { CartItemInput, MockScenario, NftListParams, QuoteInput, WalletInput } from '@/api/contracts/marketplace'
import { MockDatabase, MockDomainError } from '@/mocks/database'

export const mockDatabase = new MockDatabase()
// MSW normalizes Socket.IO's Engine.IO `/socket.io/` path to `/` before
// matching WebSocket handlers. Keep this link origin-agnostic so it works in
// local preview and on the deployed SPA as well.
const realtime = ws.link('*')
let realtimeConnectionCount = 0

interface ConnectedSocket {
  emit(event: string, payload: unknown): void
  on(event: string, listener: (event: MessageEvent, payload: unknown) => void): void
}
interface SocketSubscription { token?: string }
const sockets = new Map<ConnectedSocket, SocketSubscription>()

function subscribeSocket(socket: ConnectedSocket, candidate: unknown): string | undefined {
  if (typeof candidate !== 'string') { sockets.set(socket, {}); return undefined }
  const session = mockDatabase.getSession(candidate)
  sockets.set(socket, session ? { token: candidate } : {})
  return session?.user.id
}

mockDatabase.subscribe((event) => {
  for (const [socket, subscription] of sockets) {
    if (event.type === 'order.updated') {
      const session = subscription.token ? mockDatabase.getSession(subscription.token) : null
      if (!session) { sockets.set(socket, {}); continue }
      if (session.user.id !== event.payload.userId) continue
    }
    socket.emit(event.type, event)
  }
})

function errorResponse(error: unknown): Response {
  if (error instanceof MockDomainError) return HttpResponse.json({ code: error.code, message: error.message, fields: error.fields }, { status: error.status })
  return HttpResponse.json({ code: 'NETWORK_FAILURE', message: 'Unexpected mock backend failure.' }, { status: 500 })
}
async function withScenario<T>(callback: () => T | Promise<T>): Promise<Response> {
  const scenario = mockDatabase.consumeRequestScenario()
  if (scenario.latencyMs) await new Promise((resolve) => setTimeout(resolve, scenario.latencyMs))
  if (scenario.failNext === 'network') return HttpResponse.error()
  if (scenario.failNext === 'server') return HttpResponse.json({ code: 'NETWORK_FAILURE', message: 'Configured server failure.' }, { status: 500 })
  if (scenario.failNext === 'validation') return HttpResponse.json({ code: 'VALIDATION_ERROR', message: 'Configured validation failure.' }, { status: 422 })
  try { return HttpResponse.json(await callback() as never) } catch (error) { return errorResponse(error) }
}
function token(request: Request): string | undefined { return request.headers.get('x-session-token') ?? undefined }
function userId(request: Request): string { const session = mockDatabase.getSession(token(request)); if (!session) throw new MockDomainError(401, 'UNAUTHENTICATED', 'A valid session is required.'); return session.user.id }
function cartOwner(request: Request): string { const session = mockDatabase.getSession(token(request)); if (session) return session.user.id; const guest = request.headers.get('x-guest-id'); if (guest) return `guest:${guest}`; throw new MockDomainError(401, 'UNAUTHENTICATED', 'A valid session or guest cart id is required.') }
function invalid(message: string, field: string): MockDomainError { return new MockDomainError(422, 'VALIDATION_ERROR', message, { [field]: message }) }
function record(value: unknown, field = 'body'): Record<string, unknown> {
  if (typeof value !== 'object' || value === null || Array.isArray(value)) throw invalid('Expected an object.', field)
  return value as Record<string, unknown>
}
async function body(request: Request): Promise<Record<string, unknown>> {
  try { return record(await request.json()) } catch (error) { if (error instanceof MockDomainError) throw error; throw invalid('Invalid JSON body.', 'body') }
}
function requiredString(value: unknown, field: string): string { if (typeof value !== 'string' || !value.trim()) throw invalid('Expected a non-empty string.', field); return value.trim() }
function nullableString(value: unknown, field: string): string | null { if (value === null) return null; if (typeof value !== 'string') throw invalid('Expected a string or null.', field); return value.trim() }
function optionalBoolean(value: unknown, field: string): boolean | undefined { if (value === undefined) return undefined; if (typeof value !== 'boolean') throw invalid('Expected a boolean.', field); return value }
function requiredInteger(value: unknown, field: string): number { if (typeof value !== 'number' || !Number.isInteger(value) || value < 1) throw invalid('Expected a positive integer.', field); return value }
function identifier(value: unknown, field: string): string { return requiredString(value, field) }
function cartItem(value: unknown): CartItemInput { const input = record(value); return { nftId: identifier(input.nftId, 'nftId'), editionId: identifier(input.editionId, 'editionId'), quantity: requiredInteger(input.quantity, 'quantity') } }
function quoteInput(value: unknown): QuoteInput {
  const input = record(value)
  if (input.items !== undefined && !Array.isArray(input.items)) throw invalid('Expected an array.', 'items')
  return { items: input.items?.map(cartItem), couponCode: input.couponCode === undefined ? undefined : nullableString(input.couponCode, 'couponCode') }
}
function walletInput(value: unknown): WalletInput {
  const input = record(value), network = requiredString(input.network, 'network')
  if (network !== 'ethereum' && network !== 'polygon') throw invalid('Unknown network.', 'network')
  return { label: requiredString(input.label, 'label'), address: requiredString(input.address, 'address'), network, isPrimary: optionalBoolean(input.isPrimary, 'isPrimary') }
}
function scenarioPatch(value: unknown): Partial<MockScenario> {
  const input = record(value), patch: Partial<MockScenario> = {}
  if (input.emptyCatalog !== undefined) patch.emptyCatalog = optionalBoolean(input.emptyCatalog, 'emptyCatalog')
  if (input.sessionExpired !== undefined) patch.sessionExpired = optionalBoolean(input.sessionExpired, 'sessionExpired')
  if (input.registrationConflict !== undefined) patch.registrationConflict = optionalBoolean(input.registrationConflict, 'registrationConflict')
  if (input.timeoutAfterCreate !== undefined) patch.timeoutAfterCreate = optionalBoolean(input.timeoutAfterCreate, 'timeoutAfterCreate')
  if (input.latencyMs !== undefined) { if (typeof input.latencyMs !== 'number' || !Number.isInteger(input.latencyMs) || input.latencyMs < 0) throw invalid('Expected a non-negative integer.', 'latencyMs'); patch.latencyMs = input.latencyMs }
  if (input.failNext !== undefined) { if (input.failNext !== 'none' && input.failNext !== 'network' && input.failNext !== 'server' && input.failNext !== 'validation') throw invalid('Unknown failure scenario.', 'failNext'); patch.failNext = input.failNext }
  if (input.orderOutcome !== undefined) { if (input.orderOutcome !== 'pending' && input.orderOutcome !== 'confirmed' && input.orderOutcome !== 'declined') throw invalid('Unknown order outcome.', 'orderOutcome'); patch.orderOutcome = input.orderOutcome }
  return patch
}
function pageNumber(value: string | null, field: string): number | undefined { if (value === null) return undefined; if (!/^\d+$/.test(value) || Number(value) < 1) throw invalid('Expected a positive integer.', field); return Number(value) }
function queryParams(request: Request): NftListParams {
  const url = new URL(request.url)
  const category = url.searchParams.get('category')
  const sort = url.searchParams.get('sort')
  const available = url.searchParams.get('available')
  if (category !== null && category !== 'animals' && category !== 'nature' && category !== 'warriors') throw invalid('Unknown category.', 'category')
  if (sort !== null && sort !== 'recent' && sort !== 'price-asc' && sort !== 'price-desc' && sort !== 'name-asc') throw invalid('Unknown sort order.', 'sort')
  if (available !== null && available !== 'true' && available !== 'false') throw invalid('Expected true or false.', 'available')
  const pageSize = pageNumber(url.searchParams.get('pageSize'), 'pageSize')
  if (pageSize !== undefined && pageSize > 50) throw invalid('Must be at most 50.', 'pageSize')
  const maxPriceEth = url.searchParams.get('maxPriceEth')
  if (maxPriceEth !== null && !/^(?:0|[1-9]\d*)(?:\.\d{1,18})?$/.test(maxPriceEth)) throw invalid('Invalid decimal ETH price.', 'maxPriceEth')
  return { query: url.searchParams.get('query') ?? undefined, category: category ?? undefined, available: available === 'true' || undefined, sort: sort ?? undefined, page: pageNumber(url.searchParams.get('page'), 'page'), pageSize, maxPriceEth: maxPriceEth ?? undefined }
}

export const handlers = [
  http.get('*/api/health', () => HttpResponse.json({ status: 'ok', service: 'mock-api' })),
  http.post('*/api/auth/:action', async ({ request, params }) => withScenario(async () => {
    if (params.action === 'logout') { mockDatabase.logout(token(request)); return { ok: true } }
    const input = await body(request)
    if (params.action === 'login') return mockDatabase.login({ email: requiredString(input.email, 'email'), password: requiredString(input.password, 'password') })
    if (params.action === 'register') return mockDatabase.register({ email: requiredString(input.email, 'email'), password: requiredString(input.password, 'password'), displayName: requiredString(input.displayName, 'displayName') })
    throw new MockDomainError(404, 'NOT_FOUND', 'Authentication action not found.')
  })),
  http.get('*/api/auth/session', ({ request }) => withScenario(() => { const session = mockDatabase.getSession(token(request)); if (!session) throw new MockDomainError(401, 'UNAUTHENTICATED', 'Session expired or invalid.'); return session })),
  http.get('*/api/nfts', ({ request }) => withScenario(() => mockDatabase.listNfts(queryParams(request)))),
  http.get('*/api/nfts/:id', ({ params }) => withScenario(() => { const nft = mockDatabase.getNft(String(params.id)); if (!nft) throw new MockDomainError(404, 'NOT_FOUND', 'NFT not found.'); return nft })),
  http.get('*/api/favorites', ({ request }) => withScenario(() => mockDatabase.listFavorites(userId(request)))),
  http.put('*/api/favorites/:nftId', ({ request, params }) => withScenario(() => mockDatabase.addFavorite(userId(request), identifier(params.nftId, 'nftId')))),
  http.delete('*/api/favorites/:nftId', ({ request, params }) => withScenario(() => mockDatabase.removeFavorite(userId(request), identifier(params.nftId, 'nftId')))),
  http.get('*/api/cart', ({ request }) => withScenario(() => mockDatabase.getCart(cartOwner(request)))),
  http.put('*/api/cart/items', async ({ request }) => withScenario(async () => mockDatabase.setCartItem(cartOwner(request), cartItem(await body(request))))),
  http.patch('*/api/cart/items/:nftId/:editionId', async ({ request, params }) => withScenario(async () => { const input = await body(request); return mockDatabase.setCartItem(cartOwner(request), { nftId: identifier(params.nftId, 'nftId'), editionId: identifier(params.editionId, 'editionId'), quantity: requiredInteger(input.quantity, 'quantity') }) })),
  http.delete('*/api/cart/items/:nftId/:editionId', ({ request, params }) => withScenario(() => mockDatabase.removeCartItem(cartOwner(request), identifier(params.nftId, 'nftId'), identifier(params.editionId, 'editionId')))),
  http.put('*/api/cart/coupon', async ({ request }) => withScenario(async () => { const input = await body(request); return mockDatabase.setCartCoupon(cartOwner(request), nullableString(input.couponCode, 'couponCode')) })),
  http.post('*/api/cart/merge-guest', async ({ request }) => withScenario(async () => mockDatabase.mergeGuestCart(userId(request), identifier((await body(request)).guestId, 'guestId')))),
  http.post('*/api/coupons/validate', async ({ request }) => withScenario(async () => mockDatabase.validateCoupon(nullableString((await body(request)).code, 'code')))),
  http.post('*/api/quotes', async ({ request }) => withScenario(async () => mockDatabase.createQuote(cartOwner(request), quoteInput(await body(request))))),
  http.post('*/api/orders', async ({ request }) => { const response = await withScenario(async () => { const input = await body(request); return mockDatabase.createOrder(userId(request), { quoteId: identifier(input.quoteId, 'quoteId'), walletId: identifier(input.walletId, 'walletId') }, requiredString(request.headers.get('idempotency-key'), 'Idempotency-Key')) }); const scenario = mockDatabase.getScenario(); if (scenario.timeoutAfterCreate && response.status === 200) { mockDatabase.setScenario({ timeoutAfterCreate: false }); return HttpResponse.error() } return response }),
  http.get('*/api/orders', ({ request }) => withScenario(() => mockDatabase.listOrders(userId(request)))),
  http.get('*/api/orders/:orderId', ({ request, params }) => withScenario(() => { const order = mockDatabase.getOrder(userId(request), identifier(params.orderId, 'orderId')); if (!order) throw new MockDomainError(404, 'NOT_FOUND', 'Order not found.'); return order })),
  http.get('*/api/profile', ({ request }) => withScenario(() => mockDatabase.getProfile(userId(request)))),
  http.patch('*/api/profile', async ({ request }) => withScenario(async () => { const input = await body(request); return mockDatabase.updateProfile(userId(request), { displayName: requiredString(input.displayName, 'displayName'), bio: requiredString(input.bio, 'bio'), avatarUrl: input.avatarUrl === undefined ? undefined : nullableString(input.avatarUrl, 'avatarUrl') }) })),
  http.post('*/api/profile/password', async ({ request }) => withScenario(async () => { const input = await body(request); mockDatabase.changePassword(userId(request), requiredString(input.currentPassword, 'currentPassword'), requiredString(input.nextPassword, 'nextPassword')); return { ok: true } })),
  http.get('*/api/wallets', ({ request }) => withScenario(() => mockDatabase.listWallets(userId(request)))),
  http.post('*/api/wallets', async ({ request }) => withScenario(async () => mockDatabase.createWallet(userId(request), walletInput(await body(request))))),
  http.patch('*/api/wallets/:walletId', async ({ request, params }) => withScenario(async () => mockDatabase.updateWallet(userId(request), identifier(params.walletId, 'walletId'), walletInput(await body(request))))),
  // Development/E2E controls. No application feature client calls these endpoints.
  http.post('*/api/__mock/reset', ({ request }) => {
    mockDatabase.reset()
    const userId = new URL(request.url).searchParams.get('session')
    return HttpResponse.json(userId ? mockDatabase.createDevelopmentSession(userId) : { ok: true })
  }),
  http.post('*/api/__mock/sessions/:userId', ({ params }) => withScenario(() => mockDatabase.createDevelopmentSession(identifier(params.userId, 'userId')))),
  http.get('*/api/__mock/realtime-connections', () => HttpResponse.json({ count: realtimeConnectionCount })),
  http.patch('*/api/__mock/scenario', async ({ request }) => withScenario(async () => mockDatabase.setScenario(scenarioPatch(await body(request))))),
  http.patch('*/api/__mock/nfts/:id', async ({ params, request }) => withScenario(async () => { const input = await body(request); if (input.priceEth !== undefined && typeof input.priceEth !== 'string') throw invalid('Expected a decimal string.', 'priceEth'); if (input.available !== undefined && (!Number.isInteger(input.available) || typeof input.available !== 'number')) throw invalid('Expected a non-negative integer.', 'available'); return mockDatabase.updateNft(identifier(params.id, 'nftId'), { priceEth: input.priceEth as string | undefined, available: input.available as number | undefined }) })),
  realtime.addEventListener('connection', (connection) => {
    realtimeConnectionCount += 1
    const socket = (toSocketIo(connection) as unknown as { client: ConnectedSocket }).client
    sockets.set(socket, {})
    connection.client.addEventListener('close', () => sockets.delete(socket))
    socket.on('session.subscribe', (_event, payload) => {
      const candidate = typeof payload === 'object' && payload !== null ? (payload as { token?: unknown }).token : undefined
      subscribeSocket(socket, candidate)
    })
    socket.on('session.unsubscribe', () => sockets.set(socket, {}))
    socket.on('foundation.ping', (_event, payload) => {
      const sessionToken = typeof payload === 'object' && payload !== null ? (payload as { sessionToken?: unknown }).sessionToken : undefined
      const userId = subscribeSocket(socket, sessionToken)
      socket.emit('foundation.pong', { eventId: 'foundation-pong-v1', resourceId: 'foundation', version: 1, message: 'event received', userId })
    })
  }),
]
