import type { QueryClient } from '@tanstack/react-query'
import { Link, Outlet, createRootRouteWithContext } from '@tanstack/react-router'

interface RouterContext {
  queryClient: QueryClient
}

export const Route = createRootRouteWithContext<RouterContext>()({
  component: RootLayout,
  notFoundComponent: () => <p className="p-8">Rota não encontrada.</p>,
})

function RootLayout() {
  return (
    <main className="mx-auto min-h-screen max-w-3xl p-6">
      <nav aria-label="Navegação de validação" className="mb-8 flex gap-4">
        <Link to="/" activeProps={{ className: 'underline' }}>
          Fundação
        </Link>
        <Link to="/validation" activeProps={{ className: 'underline' }}>
          Validação
        </Link>
      </nav>
      <Outlet />
    </main>
  )
}
