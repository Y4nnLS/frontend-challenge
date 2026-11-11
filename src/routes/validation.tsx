import { createFileRoute, Link } from '@tanstack/react-router'
import { Button } from '@/components/ui/button'
import { RealtimeProbe } from '@/realtime/realtime-probe'
import { useHealthQuery } from '@/health/queries/use-health-query'

export const Route = createFileRoute('/validation')({ component: ValidationPage })

function ValidationPage() {
  const health = useHealthQuery()
  return (
    <main className="mx-auto flex min-h-screen max-w-3xl flex-col gap-5 p-8">
      <nav className="flex gap-5"><Link to="/">Início</Link><Link to="/validation">Validação</Link></nav>
      <h1 className="text-2xl font-semibold">Rota de validação</h1>
      <p>Componente base preparado com Tailwind CSS e shadcn/ui.</p>
      <p data-testid="health-status" aria-live="polite">REST Axios/MSW: {health.isPending ? 'loading' : health.isError ? 'failed' : `${health.data.status} (${health.data.service})`}</p>
      <RealtimeProbe />
      <Button type="button" variant="secondary">Componente shadcn</Button>
    </main>
  )
}
