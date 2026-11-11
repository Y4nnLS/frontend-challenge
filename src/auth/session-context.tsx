/* eslint-disable react-refresh/only-export-components */
import { createContext, useCallback, useContext, useEffect, useMemo, type ReactNode } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'

import type { LoginInput, RegisterInput, Session } from '@/api/contracts/marketplace'
import { marketplaceApi } from '@/api/marketplace-api'
import { sessionStorage } from '@/api/http/client'
import { createRealtimeSocket } from '@/realtime/socket-client'
import { subscribeRealtime } from '@/realtime/subscriptions'

type SessionContextValue = {
  session: Session | null
  isLoading: boolean
  login(input: LoginInput): Promise<Session>
  register(input: RegisterInput): Promise<Session>
  logout(): Promise<void>
}

const SessionContext = createContext<SessionContextValue | null>(null)
const privatePrefix = 'private'

function removePrivateData(queryClient: ReturnType<typeof useQueryClient>) {
  queryClient.removeQueries({ predicate: (query) => query.queryKey[0] === privatePrefix })
}

export function SessionProvider({ children }: { children: ReactNode }) {
  const queryClient = useQueryClient()
  const sessionQuery = useQuery({
    queryKey: ['session'],
    queryFn: marketplaceApi.session,
    enabled: Boolean(sessionStorage.getToken()),
    retry: false,
  })
  const setSession = useCallback(async (session: Session) => {
    queryClient.setQueryData(['session'], session)
    const guestCartId = localStorage.getItem('jungle-guest-cart-id') || crypto.randomUUID()
    localStorage.setItem('jungle-guest-cart-id', guestCartId)
    await marketplaceApi.mergeGuestCart(guestCartId)
    await queryClient.invalidateQueries({ predicate: (query) => query.queryKey[0] === privatePrefix })
    return session
  }, [queryClient])
  const loginMutation = useMutation({ mutationFn: marketplaceApi.login, onSuccess: setSession })
  const registerMutation = useMutation({ mutationFn: marketplaceApi.register, onSuccess: setSession })

  useEffect(() => {
    const refresh = () => {
      if (sessionStorage.getToken()) void sessionQuery.refetch()
      else { queryClient.setQueryData(['session'], null); removePrivateData(queryClient) }
    }
    window.addEventListener('jungle-session-changed', refresh)
    return () => window.removeEventListener('jungle-session-changed', refresh)
  }, [queryClient, sessionQuery])

  useEffect(() => {
    if (sessionQuery.isError) {
      sessionStorage.clear()
      queryClient.setQueryData(['session'], null)
      removePrivateData(queryClient)
    }
  }, [queryClient, sessionQuery.isError])

  const session = sessionQuery.data ?? null
  useEffect(() => {
    if (!session) return
    const socket = createRealtimeSocket()
    return subscribeRealtime(socket, {
      token: session.token,
      onEvent: (event) => {
        if (event.type === 'nft.updated') {
          queryClient.setQueryData(['nft', event.payload.slug], event.payload)
          void queryClient.invalidateQueries({ predicate: (query) => query.queryKey[0] === 'catalog' || query.queryKey[0] === privatePrefix })
        }
        if (event.type === 'order.updated' && event.payload.userId === session.user.id) {
          queryClient.setQueryData([privatePrefix, session.user.id, 'order', event.resourceId], event.payload)
          void queryClient.invalidateQueries({ queryKey: [privatePrefix, session.user.id, 'orders'] })
        }
      },
      reconcile: () => {
        void queryClient.invalidateQueries({ predicate: (query) => query.queryKey[0] === 'catalog' || query.queryKey[0] === 'nft' || (query.queryKey[0] === privatePrefix && query.queryKey[1] === session.user.id) })
      },
    })
  }, [queryClient, session])

  const logout = useCallback(async () => {
    try { await marketplaceApi.logout() } finally {
      queryClient.setQueryData(['session'], null)
      removePrivateData(queryClient)
    }
  }, [queryClient])
  const value = useMemo<SessionContextValue>(() => ({
    session,
    isLoading: sessionQuery.isPending,
    login: loginMutation.mutateAsync,
    register: registerMutation.mutateAsync,
    logout,
  }), [loginMutation.mutateAsync, logout, registerMutation.mutateAsync, session, sessionQuery.isPending])
  return <SessionContext.Provider value={value}>{children}</SessionContext.Provider>
}

export function useSession() {
  const value = useContext(SessionContext)
  if (!value) throw new Error('useSession must be used below SessionProvider')
  return value
}

export function privateKey(userId: string, resource: string, ...parts: unknown[]) {
  return [privatePrefix, userId, resource, ...parts] as const
}
