import type { AxiosRequestConfig } from 'axios'

import type { Cart, CartItemInput, CartMergeResult, CouponValidation, Favorite, LoginInput, Nft, NftListParams, Order, OrderCreateInput, Page, Profile, ProfileUpdateInput, Quote, QuoteInput, RegisterInput, Session, Wallet, WalletInput } from '@/api/contracts/marketplace'
import { httpClient, sessionStorage } from '@/api/http/client'

const request = <T>(config: AxiosRequestConfig) => httpClient.request<T>(config).then((response) => response.data)
export const marketplaceApi = {
  register: async (input: RegisterInput) => { const session = await request<Session>({ url: '/api/auth/register', method: 'post', data: input }); sessionStorage.setToken(session.token); return session },
  login: async (input: LoginInput) => { const session = await request<Session>({ url: '/api/auth/login', method: 'post', data: input }); sessionStorage.setToken(session.token); return session },
  session: () => request<Session>({ url: '/api/auth/session' }),
  logout: async () => { await request({ url: '/api/auth/logout', method: 'post' }); sessionStorage.clear() },
  listNfts: (params: NftListParams, signal?: AbortSignal) => request<Page<Nft>>({ url: '/api/nfts', params, signal }),
  getNft: (id: string, signal?: AbortSignal) => request<Nft>({ url: `/api/nfts/${id}`, signal }),
  favorites: () => request<Favorite[]>({ url: '/api/favorites' }),
  addFavorite: (nftId: string) => request<Favorite[]>({ url: `/api/favorites/${nftId}`, method: 'put' }),
  removeFavorite: (nftId: string) => request<Favorite[]>({ url: `/api/favorites/${nftId}`, method: 'delete' }),
  cart: () => request<Cart>({ url: '/api/cart' }),
  setCartItem: (item: CartItemInput) => request<Cart>({ url: '/api/cart/items', method: 'put', data: item }),
  removeCartItem: (nftId: string, editionId: string) => request<Cart>({ url: `/api/cart/items/${nftId}/${editionId}`, method: 'delete' }),
  setCoupon: (couponCode: string | null) => request<Cart>({ url: '/api/cart/coupon', method: 'put', data: { couponCode } }),
  mergeGuestCart: (guestId: string) => request<CartMergeResult>({ url: '/api/cart/merge-guest', method: 'post', data: { guestId } }),
  validateCoupon: (code: string | null) => request<CouponValidation>({ url: '/api/coupons/validate', method: 'post', data: { code } }),
  quote: (input: QuoteInput) => request<Quote>({ url: '/api/quotes', method: 'post', data: input }),
  createOrder: (input: OrderCreateInput, idempotencyKey: string) => request<Order>({ url: '/api/orders', method: 'post', data: input, headers: { 'Idempotency-Key': idempotencyKey } }),
  orders: () => request<Order[]>({ url: '/api/orders' }),
  order: (id: string) => request<Order>({ url: `/api/orders/${id}` }),
  profile: () => request<Profile>({ url: '/api/profile' }),
  updateProfile: (input: ProfileUpdateInput) => request<Profile>({ url: '/api/profile', method: 'patch', data: input }),
  changePassword: (currentPassword: string, nextPassword: string) => request<{ ok: true }>({ url: '/api/profile/password', method: 'post', data: { currentPassword, nextPassword } }),
  wallets: () => request<Wallet[]>({ url: '/api/wallets' }),
  createWallet: (input: WalletInput) => request<Wallet>({ url: '/api/wallets', method: 'post', data: input }),
  updateWallet: (id: string, input: WalletInput) => request<Wallet>({ url: `/api/wallets/${id}`, method: 'patch', data: input }),
}
