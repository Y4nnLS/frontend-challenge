import { createFileRoute } from '@tanstack/react-router'

import { Button } from '@/components/ui/button'

export const Route = createFileRoute('/validation')({ component: ValidationPage })

function ValidationPage() {
  return (
    <section aria-labelledby="validation-title" className="space-y-4">
      <h1 id="validation-title" className="text-2xl font-semibold">
        Rota de validação
      </h1>
      <p>Componente base preparado com Tailwind CSS e shadcn/ui.</p>
      <Button type="button" variant="secondary">
        Componente shadcn
      </Button>
    </section>
  )
}
