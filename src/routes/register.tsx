import { createFileRoute } from '@tanstack/react-router'
import { AuthPage } from '@/auth/auth-page'

export const Route = createFileRoute('/register')({ validateSearch: (search: Record<string, unknown>) => ({ returnTo: typeof search.returnTo === 'string' ? search.returnTo : undefined }), component: RegisterRoute })
function RegisterRoute() { return <AuthPage mode="register" returnTo={Route.useSearch().returnTo}/> }
