import { createFileRoute } from '@tanstack/react-router'
import { ProfilePage } from '@/marketplace/private-pages'
export const Route = createFileRoute('/profile')({ component: ProfilePage })
