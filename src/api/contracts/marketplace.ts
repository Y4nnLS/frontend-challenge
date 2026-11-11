/** Transport contracts shared by Axios clients, MSW handlers and feature code. */

export type EthAmount = string
export type IsoDate = string
export type Id = string

export interface ApiError {
  code:
    | 'UNAUTHENTICATED'
    | 'FORBIDDEN'
    | 'NOT_FOUND'
    | 'VALIDATION_ERROR'
    | 'CONFLICT'
    | 'INSUFFICIENT_STOCK'
    | 'QUOTE_STALE'
    | 'NETWORK_FAILURE'
  message: string
  fields?: Record<string, string>
}

export interface Edition {
  id: Id
  name: string
  priceEth: EthAmount
  available: number
  version: number
}

export interface Nft {
  id: Id
  slug: string
  name: string
  collection: string
  creator: string
  category: 'animals' | 'nature' | 'warriors'
  imageUrl: string
  description: string
  editions: Edition[]
  version: number
  createdAt: IsoDate
}

export type NftSort = 'recent' | 'price-asc' | 'price-desc' | 'name-asc'

export interface NftListParams {
  query?: string
  category?: Nft['category']
  available?: boolean
  sort?: NftSort
  page?: number
  pageSize?: number
  maxPriceEth?: string
}

export interface Page<T> {
  items: T[]
  page: number
  pageSize: number
  total: number
  totalPages: number
}

export interface User {
  id: Id
  email: string
  displayName: string
}

export interface Session {
  token: string
  user: User
  expiresAt: IsoDate
}

export interface RegisterInput {
  email: string
  password: string
  displayName: string
}

export interface LoginInput {
  email: string
  password: string
}

export interface Profile {
  userId: Id
  displayName: string
  bio: string
  avatarUrl: string | null
  updatedAt: IsoDate
}

export interface ProfileUpdateInput {
  displayName: string
  bio: string
  avatarUrl?: string | null
}

export interface PasswordChangeInput {
  currentPassword: string
  nextPassword: string
}

export interface Wallet {
  id: Id
  label: string
  address: string
  network: 'ethereum' | 'polygon'
  isPrimary: boolean
  version: number
}

export interface WalletInput {
  label: string
  address: string
  network: Wallet['network']
  isPrimary?: boolean
}

export interface Favorite {
  nftId: Id
  createdAt: IsoDate
}

export interface CartItemInput {
  nftId: Id
  editionId: Id
  quantity: number
}

export interface CartItem extends CartItemInput {
  id: string
  name: string
  editionName: string
  unitPriceEth: EthAmount
  available: number
  nftVersion: number
}

export interface Cart {
  ownerId: string
  items: CartItem[]
  couponCode: string | null
  updatedAt: IsoDate
  version: number
}

export interface CartMergeAdjustment {
  nftId: Id
  editionId: Id
  requestedQuantity: number
  acceptedQuantity: number
  reason: 'STOCK_LIMIT'
}

export interface CartMergeResult {
  cart: Cart
  adjustments: CartMergeAdjustment[]
}

export interface CouponValidation {
  code: string
  valid: boolean
  discountPercent?: number
  reason?: 'INVALID' | 'EXPIRED'
}

export interface QuoteInput {
  items?: CartItemInput[]
  couponCode?: string | null
}

export interface QuoteLine {
  nftId: Id
  editionId: Id
  quantity: number
  unitPriceEth: EthAmount
  lineTotalEth: EthAmount
  available: number
}

export interface Quote {
  id: Id
  ownerId: string
  lines: QuoteLine[]
  couponCode: string | null
  subtotalEth: EthAmount
  discountEth: EthAmount
  networkFeeEth: EthAmount
  totalEth: EthAmount
  validUntil: IsoDate
  catalogFingerprint: string
}

export type OrderStatus = 'pending' | 'confirmed' | 'declined'

export interface OrderCreateInput {
  quoteId: Id
  walletId: Id
}

export interface Receipt {
  orderId: Id
  createdAt: IsoDate
  transactionReference: string
  walletAddress: string
  lines: QuoteLine[]
  subtotalEth: EthAmount
  discountEth: EthAmount
  networkFeeEth: EthAmount
  totalEth: EthAmount
}

export interface Order {
  id: Id
  userId: Id
  status: OrderStatus
  version: number
  createdAt: IsoDate
  updatedAt: IsoDate
  receipt: Receipt
}

export interface RealtimeEnvelope<TType extends string, TPayload> {
  id: Id
  type: TType
  resourceId: Id
  version: number
  occurredAt: IsoDate
  payload: TPayload
}

export type NftUpdatedEvent = RealtimeEnvelope<'nft.updated', Nft>
export type OrderUpdatedEvent = RealtimeEnvelope<'order.updated', Order>
export type RealtimeEvent = NftUpdatedEvent | OrderUpdatedEvent

export type MockOrderOutcome = OrderStatus
export interface MockScenario {
  emptyCatalog: boolean
  latencyMs: number
  failNext: 'none' | 'network' | 'server' | 'validation'
  sessionExpired: boolean
  registrationConflict: boolean
  orderOutcome: MockOrderOutcome
  timeoutAfterCreate: boolean
}
