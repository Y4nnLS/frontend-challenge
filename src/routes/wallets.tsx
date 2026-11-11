import { createFileRoute } from '@tanstack/react-router'
import { WalletsPage } from '@/marketplace/private-pages'
export const Route = createFileRoute('/wallets')({ component: WalletsPage })
