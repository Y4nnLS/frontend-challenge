import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { QueryClientProvider } from '@tanstack/react-query'
import { RouterProvider } from '@tanstack/react-router'

import '@/app/styles.css'
import { queryClient } from '@/app/query-client'
import { router } from '@/app/router'

async function enableMocking() {
  if (import.meta.env.VITE_ENABLE_MSW === 'false') {
    return
  }

  const { worker } = await import('@/mocks/browser')
  await worker.start({
    onUnhandledRequest: 'bypass',
    serviceWorker: { url: '/mockServiceWorker.js' },
  })
}

void enableMocking().then(() => {
  const rootElement = document.getElementById('root')

  if (!rootElement) {
    throw new Error('Application root was not found.')
  }

  createRoot(rootElement).render(
    <StrictMode>
      <QueryClientProvider client={queryClient}>
        <RouterProvider router={router} context={{ queryClient }} />
      </QueryClientProvider>
    </StrictMode>,
  )
})
