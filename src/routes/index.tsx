import { createFileRoute } from '@tanstack/react-router'

import { RealtimeProbe } from '@/realtime/realtime-probe'
import { useHealthQuery } from '@/health/queries/use-health-query'

export const Route = createFileRoute('/')({ component: FoundationPage })

function FoundationPage() {
  const health = useHealthQuery()

  return (
    <section aria-labelledby="foundation-title" className="space-y-4">
      <h1 id="foundation-title" className="text-2xl font-semibold">
        Jungle Gaming: fundação técnica
      </h1>
      <p data-testid="health-status" aria-live="polite">
        REST Axios/MSW:{' '}
        {health.isPending
          ? 'loading'
          : health.isError
            ? 'failed'
            : `${health.data.status} (${health.data.service})`}
      </p>
      <RealtimeProbe />
    </section>
  )
}
