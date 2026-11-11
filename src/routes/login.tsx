import { createFileRoute } from '@tanstack/react-router'
import { AuthPage } from '@/auth/auth-page'

export const Route = createFileRoute('/login')({ validateSearch: (search: Record<string, unknown>) => ({ returnTo: typeof search.returnTo === 'string' ? search.returnTo : undefined }), component: LoginRoute })
function LoginRoute() { return <AuthPage mode="login" returnTo={Route.useSearch().returnTo}/> }
