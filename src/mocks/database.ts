import type {
  Cart,
  CartMergeAdjustment,
  CartMergeResult,
  CartItem,
  CartItemInput,
  CouponValidation,
  Edition,
  Favorite,
  LoginInput,
  MockScenario,
  Nft,
  NftListParams,
  Order,
  OrderCreateInput,
  OrderStatus,
  Page,
  Profile,
  ProfileUpdateInput,
  Quote,
  QuoteInput,
  QuoteLine,
  Receipt,
  RegisterInput,
  RealtimeEvent,
  Session,
  User,
  Wallet,
  WalletInput,
} from '@/api/contracts/marketplace'
import { addEth, compareEth, eth, multiplyEth, subtractEth } from '@/shared/lib/money'

const STORAGE_KEY = 'jungle-mock-db-v2'
const SEED_TIME = '2026-01-01T00:00:00.000Z'
const SESSION_DURATION_MS = 60 * 60 * 1000
const QUOTE_DURATION_MS = 5 * 60 * 1000

type PasswordHash = string
interface StoredUser extends User { passwordHash: PasswordHash }
interface StoredSession extends Session { userId: string }
interface IdempotencyRecord { fingerprint: string; orderId: string }
interface QuoteCalculation {
  lines: QuoteLine[]
  couponCode: string | null
  subtotalEth: string
  discountEth: string
  networkFeeEth: string
  totalEth: string
  catalogFingerprint: string
}
interface StoredState {
  users: StoredUser[]
  profiles: Profile[]
  wallets: Record<string, Wallet[]>
  favorites: Record<string, Favorite[]>
  carts: Record<string, Cart>
  nfts: Nft[]
  sessions: StoredSession[]
  quotes: Quote[]
  orders: Order[]
  idempotency: Record<string, IdempotencyRecord>
  scenario: MockScenario
  sequence: number
}

export interface Persistence {
  load(): StoredState | null
  save(state: StoredState): void
  clear(): void
}

export class BrowserPersistence implements Persistence {
  load(): StoredState | null {
    if (typeof localStorage === 'undefined') return null
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return null
    try { return JSON.parse(raw) as StoredState } catch { return null }
  }
  save(state: StoredState): void {
    if (typeof localStorage !== 'undefined') localStorage.setItem(STORAGE_KEY, JSON.stringify(state))
  }
  clear(): void {
    if (typeof localStorage !== 'undefined') localStorage.removeItem(STORAGE_KEY)
  }
}

export class MemoryPersistence implements Persistence {
  value: StoredState | null = null
  load() { return this.value === null ? null : structuredClone(this.value) }
  save(state: StoredState) { this.value = structuredClone(state) }
  clear() { this.value = null }
}

const defaultScenario = (): MockScenario => ({
  emptyCatalog: false, latencyMs: 0, failNext: 'none', sessionExpired: false,
  registrationConflict: false, orderOutcome: 'confirmed', timeoutAfterCreate: false,
})

const fixtureNfts = (): Nft[] => [
  nft('nft-jaguar', 'Emerald Ape #042', 'Kurio Editions', 'Kurio', 'animals', '1.19', 8, 9),
  nft('nft-toucan', 'Sage Nomad #009', 'Kurio Editions', 'Kurio', 'animals', '1.69', 12, 8),
  nft('nft-orchid', 'Neon Vessel #552', 'Kurio Editions', 'Kurio', 'nature', '1.99', 3, 7),
  nft('nft-river', 'Cosmic Bloom #118', 'Kurio Editions', 'Kurio', 'nature', '1.29', 9, 6),
  nft('nft-panther', 'Violet Nomad #314', 'Kurio Editions', 'Kurio', 'warriors', '1.39', 2, 5),
  nft('nft-vine', 'Ivory Baron #088', 'Kurio Editions', 'Kurio', 'warriors', '1.79', 20, 4),
  nft('nft-golden-beat', 'Golden Beat #207', 'Kurio Editions', 'Kurio', 'nature', '0.99', 6, 3),
  nft('nft-golden-echo', 'Golden Echo #109', 'Kurio Editions', 'Kurio', 'warriors', '0.59', 6, 2),
  nft('nft-golden-signal', 'Golden Signal #160', 'Kurio Editions', 'Kurio', 'animals', '0.39', 6, 1),

  // Older deterministic records keep the original nine fixtures on the first
  // "recent" page while providing four complete catalog pages for the UI.
  nft('nft-amber-canopy', 'Amber Canopy #021', 'Jungle Editions', 'Arua', 'animals', '0.79', 10, -1, 'artwork-02'),
  nft('nft-copper-talon', 'Copper Talon #037', 'Jungle Editions', 'Arua', 'animals', '1.09', 5, -2, 'artwork-01'),
  nft('nft-moss-sentinel', 'Moss Sentinel #114', 'Jungle Editions', 'Arua', 'animals', '1.49', 7, -3, 'artwork-02'),
  nft('nft-lunar-macaque', 'Lunar Macaque #228', 'Jungle Editions', 'Arua', 'animals', '1.89', 4, -4, 'artwork-01'),
  nft('nft-raincall', 'Raincall #301', 'Jungle Editions', 'Arua', 'animals', '2.19', 8, -5, 'artwork-02'),
  nft('nft-verdant-mask', 'Verdant Mask #404', 'Jungle Editions', 'Arua', 'animals', '2.49', 3, -6, 'artwork-01'),
  nft('nft-cinder-ibis', 'Cinder Ibis #516', 'Jungle Editions', 'Arua', 'animals', '2.79', 6, -7, 'artwork-02'),
  nft('nft-forest-oracle', 'Forest Oracle #640', 'Jungle Editions', 'Arua', 'animals', '3.09', 9, -8, 'artwork-01'),
  nft('nft-ember-puma', 'Ember Puma #711', 'Jungle Editions', 'Arua', 'animals', '3.39', 2, -9, 'artwork-02'),

  nft('nft-solar-bloom', 'Solar Bloom #014', 'Canopy Studio', 'Maya', 'nature', '0.69', 11, -10, 'hero-art'),
  nft('nft-tidal-fern', 'Tidal Fern #067', 'Canopy Studio', 'Maya', 'nature', '0.89', 7, -11, 'artwork-03'),
  nft('nft-echo-garden', 'Echo Garden #121', 'Canopy Studio', 'Maya', 'nature', '1.19', 6, -12, 'hero-art'),
  nft('nft-lichen-light', 'Lichen Light #198', 'Canopy Studio', 'Maya', 'nature', '1.49', 5, -13, 'artwork-03'),
  nft('nft-celestial-seed', 'Celestial Seed #247', 'Canopy Studio', 'Maya', 'nature', '1.79', 8, -14, 'hero-art'),
  nft('nft-verdant-noon', 'Verdant Noon #352', 'Canopy Studio', 'Maya', 'nature', '2.09', 4, -15, 'artwork-03'),
  nft('nft-river-mirror', 'River Mirror #418', 'Canopy Studio', 'Maya', 'nature', '2.39', 10, -16, 'hero-art'),
  nft('nft-wild-orbit', 'Wild Orbit #523', 'Canopy Studio', 'Maya', 'nature', '2.69', 3, -17, 'artwork-03'),
  nft('nft-orchid-dawn', 'Orchid Dawn #607', 'Canopy Studio', 'Maya', 'nature', '2.99', 9, -18, 'hero-art'),

  nft('nft-iron-vow', 'Iron Vow #026', 'Signal Forge', 'Nilo', 'warriors', '0.49', 12, -19, 'artwork-03'),
  nft('nft-silent-ward', 'Silent Ward #075', 'Signal Forge', 'Nilo', 'warriors', '0.79', 6, -20, 'artwork-01'),
  nft('nft-pulse-armor', 'Pulse Armor #144', 'Signal Forge', 'Nilo', 'warriors', '1.09', 5, -21, 'artwork-03'),
  nft('nft-cobalt-banner', 'Cobalt Banner #231', 'Signal Forge', 'Nilo', 'warriors', '1.29', 8, -22, 'artwork-01'),
  nft('nft-ember-guard', 'Ember Guard #319', 'Signal Forge', 'Nilo', 'warriors', '1.59', 7, -23, 'artwork-03'),
  nft('nft-prism-keeper', 'Prism Keeper #426', 'Signal Forge', 'Nilo', 'warriors', '1.89', 4, -24, 'artwork-01'),
  nft('nft-bronze-relic', 'Bronze Relic #538', 'Signal Forge', 'Nilo', 'warriors', '2.19', 9, -25, 'artwork-03'),
  nft('nft-signal-rider', 'Signal Rider #689', 'Signal Forge', 'Nilo', 'warriors', '2.49', 3, -26, 'artwork-01'),
  nft('nft-violet-watch', 'Violet Watch #754', 'Signal Forge', 'Nilo', 'warriors', '2.89', 6, -27, 'artwork-03'),
]

function nft(id: string, name: string, collection: string, creator: string, category: Nft['category'], price: string, available: number, offset: number, artwork?: string): Nft {
  return {
    id, slug: id.slice(4), name, collection, creator, category,
    imageUrl: `/assets/figma/${artwork ?? ({'nft-jaguar':'artwork-02','nft-toucan':'artwork-01','nft-orchid':'hero-art','nft-river':'artwork-01','nft-panther':'artwork-01','nft-vine':'hero-art','nft-golden-beat':'artwork-03','nft-golden-echo':'artwork-03','nft-golden-signal':'artwork-03'} as Record<string, string>)[id]}.png`, description: `${name} is a simulated Jungle Gaming collectible.`,
    editions: [{ id: `${id}-standard`, name: 'Standard Edition', priceEth: eth(price), available, version: 1 }],
    version: 1, createdAt: new Date(Date.parse(SEED_TIME) + offset * 1_000).toISOString(),
  }
}

function seed(): StoredState {
  const users: StoredUser[] = [
    { id: 'user-ana', email: 'ana@jungle.test', displayName: 'Ana Collector', passwordHash: hashPassword('Jungle#123') },
    { id: 'user-bruno', email: 'bruno@jungle.test', displayName: 'Bruno Explorer', passwordHash: hashPassword('Jungle#456') },
  ]
  return {
    users,
    profiles: users.map((user) => ({ userId: user.id, displayName: user.displayName, bio: '', avatarUrl: null, updatedAt: SEED_TIME })),
    wallets: {
      'user-ana': [{ id: 'wallet-ana-main', label: 'Ana Main', address: '0xA11CE00000000000000000000000000000000001', network: 'ethereum', isPrimary: true, version: 1 }],
      'user-bruno': [{ id: 'wallet-bruno-main', label: 'Bruno Main', address: '0xB0B0000000000000000000000000000000000002', network: 'polygon', isPrimary: true, version: 1 }],
    },
    favorites: { 'user-ana': [{ nftId: 'nft-jaguar', createdAt: SEED_TIME }], 'user-bruno': [{ nftId: 'nft-toucan', createdAt: SEED_TIME }] },
    carts: {}, nfts: fixtureNfts(), sessions: [], quotes: [], orders: [], idempotency: {},
    scenario: defaultScenario(), sequence: 0,
  }
}

/** A deterministic in-memory backend. Every mutating method persists atomically. */
export class MockDatabase {
  private state: StoredState
  private readonly listeners = new Set<(event: RealtimeEvent) => void>()

  constructor(
    private readonly persistence: Persistence = new BrowserPersistence(),
    private readonly nowMs: () => number = () => Date.now(),
  ) {
    this.state = persistence.load() ?? seed()
  }

  reset(): void { this.state = seed(); this.persistence.clear(); this.persist() }
  setScenario(patch: Partial<MockScenario>): MockScenario { this.state.scenario = { ...this.state.scenario, ...patch }; this.persist(); return structuredClone(this.state.scenario) }
  getScenario(): MockScenario { return structuredClone(this.state.scenario) }
  consumeRequestScenario(): Pick<MockScenario, 'latencyMs' | 'failNext'> {
    const { latencyMs, failNext } = this.state.scenario
    if (failNext !== 'none') { this.state.scenario.failNext = 'none'; this.persist() }
    return { latencyMs, failNext }
  }
  subscribe(listener: (event: RealtimeEvent) => void): () => void { this.listeners.add(listener); return () => this.listeners.delete(listener) }

  listNfts(params: NftListParams = {}): Page<Nft> {
    const page = Math.max(1, params.page ?? 1), pageSize = Math.min(50, Math.max(1, params.pageSize ?? 12))
    let values = this.state.scenario.emptyCatalog ? [] : [...this.state.nfts]
    const query = params.query?.trim().toLocaleLowerCase()
    if (query) values = values.filter((item) => `${item.name} ${item.collection} ${item.creator}`.toLowerCase().includes(query))
    if (params.category) values = values.filter((item) => item.category === params.category)
    if (params.available) values = values.filter((item) => item.editions.some((edition) => edition.available > 0))
    if (params.maxPriceEth) values = values.filter((item) => item.editions.some((edition) => compareEth(edition.priceEth, params.maxPriceEth!) <= 0))
    const firstPrice = (item: Nft) => item.editions[0]?.priceEth ?? eth(0)
    if (params.sort === 'price-asc') values.sort((a, b) => compareEth(firstPrice(a), firstPrice(b)))
    if (params.sort === 'price-desc') values.sort((a, b) => compareEth(firstPrice(b), firstPrice(a)))
    if (params.sort === 'name-asc') values.sort((a, b) => a.name.localeCompare(b.name))
    if (!params.sort || params.sort === 'recent') values.sort((a, b) => b.createdAt.localeCompare(a.createdAt))
    const total = values.length
    return { items: structuredClone(values.slice((page - 1) * pageSize, page * pageSize)), page, pageSize, total, totalPages: Math.ceil(total / pageSize) }
  }
  getNft(id: string): Nft | null { const item = this.state.nfts.find((nft) => nft.id === id || nft.slug === id); return item ? structuredClone(item) : null }

  register(input: RegisterInput): Session {
    this.assertEmail(input.email); this.assertPassword(input.password)
    if (this.state.scenario.registrationConflict || this.state.users.some((user) => user.email.toLowerCase() === input.email.toLowerCase())) throw conflict('An account with this email already exists.', 'email')
    const user: StoredUser = { id: this.id('user'), email: input.email.toLowerCase(), displayName: input.displayName.trim(), passwordHash: hashPassword(input.password) }
    this.state.users.push(user); this.state.profiles.push({ userId: user.id, displayName: user.displayName, bio: '', avatarUrl: null, updatedAt: this.now() }); this.state.wallets[user.id] = []; this.state.favorites[user.id] = []
    const session = this.createSession(user); this.persist(); return session
  }
  login(input: LoginInput): Session {
    const user = this.state.users.find((value) => value.email.toLowerCase() === input.email.toLowerCase())
    if (!user || user.passwordHash !== hashPassword(input.password)) throw unauthenticated('Invalid email or password.')
    const session = this.createSession(user); this.persist(); return session
  }
  getSession(token: string | undefined): Session | null {
    if (!token || this.state.scenario.sessionExpired) return null
    const session = this.state.sessions.find((value) => value.token === token)
    if (!session || Date.parse(session.expiresAt) <= this.nowMs()) return null
    return { token: session.token, user: this.publicUser(session.userId), expiresAt: session.expiresAt }
  }
  logout(token: string | undefined): void { if (token) { this.state.sessions = this.state.sessions.filter((session) => session.token !== token); this.persist() } }
  /** Test-control only: creates a recoverable fixture session without exposing passwords. */
  createDevelopmentSession(userId: string): Session { const user = this.state.users.find((item) => item.id === userId); if (!user) throw notFound('Fixture user not found.'); const session = this.createSession(user); this.persist(); return session }

  listFavorites(userId: string): Favorite[] { return structuredClone(this.state.favorites[userId] ?? []) }
  addFavorite(userId: string, nftId: string): Favorite[] { if (!this.getNft(nftId)) throw notFound('NFT not found.'); const favorites = this.state.favorites[userId] ?? []; if (!favorites.some((item) => item.nftId === nftId)) favorites.push({ nftId, createdAt: this.now() }); this.state.favorites[userId] = favorites; this.persist(); return structuredClone(favorites) }
  removeFavorite(userId: string, nftId: string): Favorite[] { this.state.favorites[userId] = (this.state.favorites[userId] ?? []).filter((item) => item.nftId !== nftId); this.persist(); return this.listFavorites(userId) }

  getCart(ownerId: string): Cart { return structuredClone(this.ensureCart(ownerId)) }
  setCartItem(ownerId: string, input: CartItemInput): Cart {
    if (!Number.isInteger(input.quantity) || input.quantity < 1) throw validation('Quantity must be a positive integer.', 'quantity')
    const edition = this.findEdition(input.nftId, input.editionId)
    if (input.quantity > edition.available) throw insufficient('Requested quantity is no longer available.')
    const cart = this.ensureCart(ownerId), id = `${input.nftId}:${input.editionId}`, existing = cart.items.find((item) => item.id === id)
    const value = this.toCartItem(input, edition)
    if (existing) Object.assign(existing, value); else cart.items.push(value)
    cart.updatedAt = this.now(); cart.version += 1; this.persist(); return structuredClone(cart)
  }
  removeCartItem(ownerId: string, nftId: string, editionId: string): Cart { const cart = this.ensureCart(ownerId); cart.items = cart.items.filter((item) => item.id !== `${nftId}:${editionId}`); cart.updatedAt = this.now(); cart.version += 1; this.persist(); return structuredClone(cart) }
  setCartCoupon(ownerId: string, couponCode: string | null): Cart { const cart = this.ensureCart(ownerId); cart.couponCode = couponCode?.trim().toUpperCase() || null; cart.updatedAt = this.now(); cart.version += 1; this.persist(); return structuredClone(cart) }
  mergeGuestCart(userId: string, guestId: string): CartMergeResult {
    const guestOwnerId = `guest:${guestId}`
    const guest = this.ensureCart(guestOwnerId)
    const cart = this.ensureCart(userId)
    const adjustments: CartMergeAdjustment[] = []

    for (const guestItem of guest.items) {
      const edition = this.findEdition(guestItem.nftId, guestItem.editionId)
      const existing = cart.items.find((item) => item.id === guestItem.id)
      const requestedQuantity = (existing?.quantity ?? 0) + guestItem.quantity
      const acceptedQuantity = Math.min(requestedQuantity, edition.available)

      if (acceptedQuantity > 0) {
        const mergedItem = this.toCartItem({ ...guestItem, quantity: acceptedQuantity }, edition)
        if (existing) Object.assign(existing, mergedItem)
        else cart.items.push(mergedItem)
      } else if (existing) {
        cart.items = cart.items.filter((item) => item !== existing)
      }

      if (acceptedQuantity !== requestedQuantity) {
        adjustments.push({ nftId: guestItem.nftId, editionId: guestItem.editionId, requestedQuantity, acceptedQuantity, reason: 'STOCK_LIMIT' })
      }
    }

    if (!cart.couponCode) cart.couponCode = guest.couponCode
    cart.updatedAt = this.now(); cart.version += 1
    this.state.carts[guestOwnerId] = this.emptyCart(guestOwnerId)
    this.persist()
    return { cart: structuredClone(cart), adjustments }
  }

  validateCoupon(code: string | null | undefined): CouponValidation {
    const normalized = code?.trim().toUpperCase() ?? ''
    if (normalized === 'JUNGLE10') return { code: normalized, valid: true, discountPercent: 10 }
    if (normalized === 'EXPIRED') return { code: normalized, valid: false, reason: 'EXPIRED' }
    return { code: normalized, valid: false, reason: 'INVALID' }
  }
  createQuote(ownerId: string, input: QuoteInput = {}): Quote {
    const calculation = this.calculateQuote(ownerId, input)
    const quote: Quote = { id: this.id('quote'), ownerId, ...calculation, validUntil: new Date(this.nowMs() + QUOTE_DURATION_MS).toISOString() }
    this.state.quotes.push(quote); this.persist(); return structuredClone(quote)
  }

  createOrder(userId: string, input: OrderCreateInput, idempotencyKey: string): Order {
    if (!idempotencyKey) throw validation('Idempotency-Key is required.', 'Idempotency-Key')
    const fingerprint = JSON.stringify(input), scopedKey = this.idempotencyKey(userId, idempotencyKey), prior = this.state.idempotency[scopedKey]
    if (prior) { if (prior.fingerprint !== fingerprint) throw conflict('Idempotency key was reused with a different payload.'); const order = this.state.orders.find((item) => item.id === prior.orderId); if (!order) throw new Error('Broken idempotency record.'); return structuredClone(order) }
    const quote = this.state.quotes.find((item) => item.id === input.quoteId && item.ownerId === userId)
    if (!quote || Date.parse(quote.validUntil) <= this.nowMs()) throw staleQuote('Quote is no longer valid.')
    const wallet = (this.state.wallets[userId] ?? []).find((item) => item.id === input.walletId); if (!wallet) throw validation('A wallet belonging to the session is required.', 'walletId')
    const actual = this.calculateQuote(userId, { items: quote.lines, couponCode: quote.couponCode })
    if (actual.catalogFingerprint !== quote.catalogFingerprint || actual.totalEth !== quote.totalEth) throw staleQuote('Catalog changed; request a new quote.')
    const createdAt = this.now(), receipt: Receipt = { orderId: this.id('receipt'), createdAt, transactionReference: `mock-tx-${this.state.sequence + 1}`, walletAddress: wallet.address, lines: structuredClone(quote.lines), subtotalEth: quote.subtotalEth, discountEth: quote.discountEth, networkFeeEth: quote.networkFeeEth, totalEth: quote.totalEth }
    const order: Order = { id: this.id('order'), userId, status: this.state.scenario.orderOutcome, version: 1, createdAt, updatedAt: createdAt, receipt: { ...receipt, orderId: '' } }
    order.receipt.orderId = order.id
    const changedNfts = order.status === 'confirmed' ? this.confirmOrder(userId, quote.lines) : []
    this.state.orders.push(order); this.state.idempotency[scopedKey] = { fingerprint, orderId: order.id }
    this.persist(); changedNfts.forEach((nft) => this.emitNft(nft)); this.emitOrder(order); return structuredClone(order)
  }
  listOrders(userId: string): Order[] { return structuredClone(this.state.orders.filter((order) => order.userId === userId)) }
  getOrder(userId: string, orderId: string): Order | null { const value = this.state.orders.find((order) => order.id === orderId && order.userId === userId); return value ? structuredClone(value) : null }
  updateOrderStatus(userId: string, orderId: string, status: OrderStatus): Order {
    const order = this.state.orders.find((item) => item.id === orderId && item.userId === userId); if (!order) throw notFound('Order not found.'); if (order.status !== 'pending') return structuredClone(order)
    const changedNfts = status === 'confirmed' ? this.confirmOrder(userId, order.receipt.lines) : []
    order.status = status; order.version += 1; order.updatedAt = this.now()
    this.persist(); changedNfts.forEach((nft) => this.emitNft(nft)); this.emitOrder(order); return structuredClone(order)
  }

  getProfile(userId: string): Profile { const profile = this.state.profiles.find((item) => item.userId === userId); if (!profile) throw notFound('Profile not found.'); return structuredClone(profile) }
  updateProfile(userId: string, input: ProfileUpdateInput): Profile { if (!input.displayName.trim()) throw validation('Display name is required.', 'displayName'); const profile = this.state.profiles.find((item) => item.userId === userId); if (!profile) throw notFound('Profile not found.'); Object.assign(profile, { ...input, displayName: input.displayName.trim(), updatedAt: this.now() }); const user = this.state.users.find((item) => item.id === userId); if (user) user.displayName = profile.displayName; this.persist(); return structuredClone(profile) }
  changePassword(userId: string, current: string, next: string): void { const user = this.state.users.find((item) => item.id === userId); if (!user || user.passwordHash !== hashPassword(current)) throw validation('Current password is incorrect.', 'currentPassword'); this.assertPassword(next); user.passwordHash = hashPassword(next); this.persist() }
  listWallets(userId: string): Wallet[] { return structuredClone(this.state.wallets[userId] ?? []) }
  createWallet(userId: string, input: WalletInput): Wallet { this.assertWallet(input); const wallets = this.state.wallets[userId] ?? []; const wallet: Wallet = { id: this.id('wallet'), label: input.label.trim(), address: input.address.trim(), network: input.network, isPrimary: input.isPrimary ?? wallets.length === 0, version: 1 }; if (wallet.isPrimary) wallets.forEach((item) => { item.isPrimary = false; item.version += 1 }); wallets.push(wallet); this.state.wallets[userId] = wallets; this.persist(); return structuredClone(wallet) }
  updateWallet(userId: string, walletId: string, input: WalletInput): Wallet { this.assertWallet(input); const wallet = (this.state.wallets[userId] ?? []).find((item) => item.id === walletId); if (!wallet) throw notFound('Wallet not found.'); Object.assign(wallet, { ...input, label: input.label.trim(), address: input.address.trim(), isPrimary: input.isPrimary ?? wallet.isPrimary, version: wallet.version + 1 }); if (wallet.isPrimary) (this.state.wallets[userId] ?? []).filter((item) => item.id !== wallet.id).forEach((item) => { item.isPrimary = false; item.version += 1 }); this.persist(); return structuredClone(wallet) }
  updateNft(id: string, patch: Partial<Pick<Edition, 'priceEth' | 'available'>>): Nft { const nft = this.state.nfts.find((item) => item.id === id); if (!nft) throw notFound('NFT not found.'); const edition = nft.editions[0]; if (!edition) throw notFound('Edition not found.'); if (patch.available !== undefined && (!Number.isInteger(patch.available) || patch.available < 0)) throw validation('Available must be a non-negative integer.', 'available'); Object.assign(edition, patch); edition.version += 1; nft.version += 1; this.persist(); this.emitNft(nft); return structuredClone(nft) }

  private calculateQuote(ownerId: string, input: QuoteInput): QuoteCalculation {
    const cart = this.ensureCart(ownerId)
    const couponCode = input.couponCode ?? cart.couponCode
    const quantities = new Map<string, CartItemInput>()
    for (const item of input.items ?? cart.items) {
      if (!Number.isInteger(item.quantity) || item.quantity < 1) throw insufficient('An item in this quote has an invalid quantity.')
      const key = `${item.nftId}:${item.editionId}`, current = quantities.get(key)
      quantities.set(key, { nftId: item.nftId, editionId: item.editionId, quantity: (current?.quantity ?? 0) + item.quantity })
    }
    const lines = [...quantities.values()].map((item) => {
      const edition = this.findEdition(item.nftId, item.editionId)
      if (item.quantity > edition.available) throw insufficient('An item in this quote is unavailable.')
      return { nftId: item.nftId, editionId: item.editionId, quantity: item.quantity, unitPriceEth: edition.priceEth, lineTotalEth: multiplyEth(edition.priceEth, item.quantity), available: edition.available }
    })
    const coupon = this.validateCoupon(couponCode)
    if (couponCode && !coupon.valid) throw validation(coupon.reason === 'EXPIRED' ? 'Coupon has expired.' : 'Coupon is invalid.', 'couponCode')
    const subtotalEth = addEth(...lines.map((line) => line.lineTotalEth))
    const discountEth = coupon.valid ? multiplyEth(subtotalEth, (coupon.discountPercent ?? 0) / 100) : eth(0)
    const networkFeeEth = lines.length ? eth('0.0025') : eth(0)
    return { lines, couponCode: couponCode ?? null, subtotalEth, discountEth, networkFeeEth, totalEth: addEth(subtractEth(subtotalEth, discountEth), networkFeeEth), catalogFingerprint: JSON.stringify(lines.map((line) => [line.editionId, line.unitPriceEth, line.available])) }
  }
  private emitNft(nft: Nft) { this.emit({ id: this.id('event'), type: 'nft.updated', resourceId: nft.id, version: nft.version, occurredAt: this.now(), payload: structuredClone(nft) }) }
  private emitOrder(order: Order) { this.emit({ id: this.id('event'), type: 'order.updated', resourceId: order.id, version: order.version, occurredAt: this.now(), payload: structuredClone(order) }) }
  private emit(event: RealtimeEvent) { this.listeners.forEach((listener) => listener(event)) }
  private confirmOrder(userId: string, lines: QuoteLine[]): Nft[] {
    const quantities = new Map<string, QuoteLine>()
    for (const line of lines) {
      const key = `${line.nftId}:${line.editionId}`, current = quantities.get(key)
      quantities.set(key, { ...line, quantity: (current?.quantity ?? 0) + line.quantity })
    }
    for (const line of quantities.values()) {
      const edition = this.findEdition(line.nftId, line.editionId)
      if (edition.available < line.quantity) throw insufficient('Stock is no longer available.')
    }
    const changedNfts: Nft[] = []
    for (const line of quantities.values()) {
      const edition = this.findEdition(line.nftId, line.editionId)
      edition.available -= line.quantity; edition.version += 1
      const nft = this.state.nfts.find((item) => item.id === line.nftId)
      if (nft) { nft.version += 1; changedNfts.push(nft) }
    }
    this.removePurchasedCartItems(userId, [...quantities.values()])
    return changedNfts
  }
  private removePurchasedCartItems(userId: string, lines: Quote['lines']) { const cart = this.ensureCart(userId); for (const line of lines) { const item = cart.items.find((value) => value.id === `${line.nftId}:${line.editionId}`); if (!item) continue; item.quantity -= line.quantity; if (item.quantity <= 0) cart.items = cart.items.filter((value) => value !== item) } cart.version += 1; cart.updatedAt = this.now() }
  private ensureCart(ownerId: string): Cart { return this.state.carts[ownerId] ?? (this.state.carts[ownerId] = this.emptyCart(ownerId)) }
  private emptyCart(ownerId: string): Cart { return { ownerId, items: [], couponCode: null, updatedAt: this.now(), version: 1 } }
  private toCartItem(input: CartItemInput, edition: Edition): CartItem { const nft = this.state.nfts.find((item) => item.id === input.nftId); if (!nft) throw notFound('NFT not found.'); return { id: `${input.nftId}:${input.editionId}`, ...input, name: nft.name, editionName: edition.name, unitPriceEth: edition.priceEth, available: edition.available, nftVersion: nft.version } }
  private findEdition(nftId: string, editionId: string): Edition { const nft = this.state.nfts.find((item) => item.id === nftId); const edition = nft?.editions.find((item) => item.id === editionId); if (!edition) throw notFound('NFT edition not found.'); return edition }
  private createSession(user: StoredUser): Session { const token = this.id('session'); const value: StoredSession = { token, userId: user.id, user: this.publicUser(user.id), expiresAt: new Date(this.nowMs() + SESSION_DURATION_MS).toISOString() }; this.state.sessions.push(value); return { token, user: value.user, expiresAt: value.expiresAt } }
  private publicUser(userId: string): User { const user = this.state.users.find((item) => item.id === userId); if (!user) throw notFound('User not found.'); return { id: user.id, email: user.email, displayName: user.displayName } }
  private id(prefix: string): string { this.state.sequence += 1; return `${prefix}-${this.state.sequence}` }
  private idempotencyKey(userId: string, key: string): string { return `${userId}:${key}` }
  private now(): string { return new Date(this.nowMs()).toISOString() }
  private persist() { this.persistence.save(this.state) }
  private assertEmail(email: string) { if (!/^\S+@\S+\.\S+$/.test(email)) throw validation('Email is invalid.', 'email') }
  private assertPassword(password: string) { if (password.length < 8) throw validation('Password must have at least 8 characters.', 'password') }
  private assertWallet(input: WalletInput) { if (!input.label.trim()) throw validation('Wallet label is required.', 'label'); if (!/^0x[a-fA-F0-9]{40}$/.test(input.address)) throw validation('Wallet address must be a 20-byte hex address.', 'address') }
}

export class MockDomainError extends Error { constructor(readonly status: number, readonly code: string, message: string, readonly fields?: Record<string, string>) { super(message) } }
const validation = (message: string, field: string) => new MockDomainError(422, 'VALIDATION_ERROR', message, { [field]: message })
const conflict = (message: string, field?: string) => new MockDomainError(409, 'CONFLICT', message, field ? { [field]: message } : undefined)
const insufficient = (message: string) => new MockDomainError(409, 'INSUFFICIENT_STOCK', message)
const staleQuote = (message: string) => new MockDomainError(409, 'QUOTE_STALE', message)
const unauthenticated = (message: string) => new MockDomainError(401, 'UNAUTHENTICATED', message)
const notFound = (message: string) => new MockDomainError(404, 'NOT_FOUND', message)
const hashPassword = (password: string): PasswordHash => `mock-sha256:${[...password].reduce((value, char) => ((value * 31) + char.charCodeAt(0)) >>> 0, 2166136261).toString(16)}`
