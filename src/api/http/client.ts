import axios from 'axios'

const SESSION_STORAGE_KEY = 'jungle-session-token'
const GUEST_STORAGE_KEY = 'jungle-guest-cart-id'
const SESSION_CHANGED_EVENT = 'jungle-session-changed'

export const httpClient = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL ?? '',
  timeout: 5_000,
  headers: { Accept: 'application/json' },
})

httpClient.interceptors.request.use((config) => {
  if (typeof localStorage === 'undefined') return config
  const token = localStorage.getItem(SESSION_STORAGE_KEY)
  const guestId = localStorage.getItem(GUEST_STORAGE_KEY) ?? crypto.randomUUID()
  localStorage.setItem(GUEST_STORAGE_KEY, guestId)
  if (token) config.headers.set('x-session-token', token)
  config.headers.set('x-guest-id', guestId)
  return config
})

export const sessionStorage = {
  getToken: () => typeof localStorage === 'undefined' ? null : localStorage.getItem(SESSION_STORAGE_KEY),
  setToken: (token: string) => { if (typeof localStorage !== 'undefined') { localStorage.setItem(SESSION_STORAGE_KEY, token); window.dispatchEvent(new Event(SESSION_CHANGED_EVENT)) } },
  clear: () => { if (typeof localStorage !== 'undefined') { localStorage.removeItem(SESSION_STORAGE_KEY); window.dispatchEvent(new Event(SESSION_CHANGED_EVENT)) } },
}
