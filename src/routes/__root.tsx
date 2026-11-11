import type { QueryClient } from '@tanstack/react-query'
import { Outlet, createRootRouteWithContext } from '@tanstack/react-router'
import { SessionProvider } from '@/auth/session-context'

interface RouterContext {
  queryClient: QueryClient
}

export const Route = createRootRouteWithContext<RouterContext>()({
  component: RootLayout,
  notFoundComponent: () => (
    <main className="mx-auto flex min-h-[70vh] max-w-5xl flex-col items-start justify-center gap-4 px-6">
      <p className="eyebrow">404 · KURIO</p>
      <h1 className="text-3xl font-bold">Página não encontrada</h1>
      <a className="text-copper underline underline-offset-4" href="/">Voltar para o início</a>
    </main>
  ),
})

function RootLayout() {
  return <SessionProvider><Outlet /></SessionProvider>
}
